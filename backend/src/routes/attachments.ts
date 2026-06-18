import { Router, type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import { prisma } from "../db.js";
import { emit } from "../events/bus.js";
import { requireApproved, requireAuth } from "../middleware/auth.js";
import { storage } from "../storage/index.js";
import { logAttachmentAdded, logAttachmentRemoved } from "../utils/activity.js";
import { sendError } from "../utils/errors.js";
import { paramId } from "../utils/params.js";

// mergeParams lets us read `:id` from the parent mount (/tasks/:id/attachments).
// Express's generic Router type can't infer that, so route handlers below
// cast `req.params` through a typed helper.
export const attachmentsRouter = Router({ mergeParams: true });

type Params = { id: string; attachmentId?: string };
const params = (req: Request): Params => req.params as unknown as Params;

attachmentsRouter.use(requireAuth, requireApproved);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_PER_TASK = 10;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(new MimeError(`Unsupported mime type: ${file.mimetype}`));
      return;
    }
    cb(null, true);
  },
});

class MimeError extends Error {}

/**
 * Ownership check — non-admins can only touch their own tasks.
 * Returns the task's owner so we can scope SSE events correctly
 * (admins editing a user's task → fan to that user, not the admin).
 */
async function findOwnedTask(req: Request, taskId: string) {
  return prisma.task.findFirst({
    where: { id: taskId, ...(req.userRole !== "ADMIN" && { userId: req.userId! }) },
    select: { id: true, userId: true },
  });
}

attachmentsRouter.post("/", (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return sendError(res, 413, "FILE_TOO_LARGE", "File exceeds 5 MB limit");
      }
      return sendError(res, 400, "UPLOAD_ERROR", err.message);
    }
    if (err instanceof MimeError) {
      return sendError(res, 415, "UNSUPPORTED_MEDIA_TYPE", err.message);
    }
    if (err) return next(err);

    void handleUpload(req, res, next);
  });
});

async function handleUpload(req: Request, res: Response, next: NextFunction) {
  try {
    const taskId = paramId(params(req).id);
    const file = req.file;
    if (!file) {
      return sendError(res, 400, "FILE_REQUIRED", "Upload a `file` field");
    }

    const task = await findOwnedTask(req, taskId);
    if (!task) return sendError(res, 404, "NOT_FOUND", "Task not found");

    const count = await prisma.taskAttachment.count({ where: { taskId } });
    if (count >= MAX_PER_TASK) {
      return sendError(res, 409, "LIMIT_REACHED", `Max ${MAX_PER_TASK} attachments per task`);
    }

    const uploaded = await storage.upload({
      buffer: file.buffer,
      filename: file.originalname,
      mimeType: file.mimetype,
      taskId,
    });

    const actorId = req.userId!;
    const attachment = await prisma.$transaction(async (tx) => {
      const created = await tx.taskAttachment.create({
        data: {
          taskId,
          uploaderId: actorId,
          filename: file.originalname,
          url: uploaded.url,
          publicId: uploaded.publicId ?? null,
          size: uploaded.size,
          mimeType: file.mimetype,
          storage: uploaded.storage,
        },
      });
      await logAttachmentAdded(tx, taskId, actorId, file.originalname);
      return created;
    });

    emit({ type: "attachment.added", taskId, ownerId: task.userId, actorId });
    emit({ type: "task.activity.added", taskId, ownerId: task.userId, actorId });

    res.status(201).json({ attachment: serializeAttachment(attachment) });
  } catch (err) {
    next(err);
  }
}

attachmentsRouter.get("/", async (req, res, next) => {
  try {
    const taskId = paramId(params(req).id);

    const task = await findOwnedTask(req, taskId);
    if (!task) return sendError(res, 404, "NOT_FOUND", "Task not found");

    const rows = await prisma.taskAttachment.findMany({
      where: { taskId },
      orderBy: { createdAt: "desc" },
    });

    res.json({ data: rows.map(serializeAttachment) });
  } catch (err) {
    next(err);
  }
});

attachmentsRouter.delete("/:attachmentId", async (req, res, next) => {
  try {
    const p = params(req);
    const taskId = paramId(p.id);
    if (!p.attachmentId) {
      return sendError(res, 400, "VALIDATION_ERROR", "Attachment id required");
    }
    const attachmentId = paramId(p.attachmentId);

    const task = await findOwnedTask(req, taskId);
    if (!task) return sendError(res, 404, "NOT_FOUND", "Task not found");

    const attachment = await prisma.taskAttachment.findFirst({
      where: { id: attachmentId, taskId },
    });
    if (!attachment) {
      return sendError(res, 404, "NOT_FOUND", "Attachment not found");
    }

    const actorId = req.userId!;

    // Delete DB row + log inside a transaction. Storage cleanup is best-effort:
    // if the file vanished or Cloudinary is unreachable, we still want the
    // row removed (a worker would handle storage reconciliation in prod).
    await prisma.$transaction(async (tx) => {
      await tx.taskAttachment.delete({ where: { id: attachment.id } });
      await logAttachmentRemoved(tx, taskId, actorId, attachment.filename);
    });

    try {
      await storage.delete(attachment.publicId ?? attachment.url);
    } catch (storageErr) {
      console.error("Storage delete failed (orphaned file)", storageErr);
    }

    emit({ type: "attachment.removed", taskId, ownerId: task.userId, actorId });
    emit({ type: "task.activity.added", taskId, ownerId: task.userId, actorId });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

function serializeAttachment(a: {
  id: string;
  taskId: string;
  filename: string;
  url: string;
  size: number;
  mimeType: string;
  storage: "LOCAL" | "CLOUDINARY";
  createdAt: Date;
}) {
  return {
    id: a.id,
    taskId: a.taskId,
    filename: a.filename,
    url: a.url,
    size: a.size,
    mimeType: a.mimeType,
    storage: a.storage,
    createdAt: a.createdAt.toISOString(),
  };
}
