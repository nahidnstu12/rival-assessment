import { Router } from "express";
import { prisma } from "../db.js";
import { emit } from "../events/bus.js";
import { requireApproved, requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { activityListQuerySchema } from "../schemas/activity.schema.js";
import { taskCreateSchema, taskListQuerySchema, taskUpdateSchema } from "../schemas/task.schema.js";
import { diffTask, logCreated, logUpdated } from "../utils/activity.js";
import { sendError } from "../utils/errors.js";
import { paramId } from "../utils/params.js";
import {
  buildCountWhere,
  getStatusCounts,
  listTasks,
  parseDueDate,
  parseListParams,
  serializeTask,
} from "../utils/taskQuery.js";

export const tasksRouter = Router();

tasksRouter.use(requireAuth, requireApproved);

tasksRouter.post("/", validate(taskCreateSchema), async (req, res, next) => {
  try {
    const userId = req.userId!;
    const actorId = req.userId!;
    const maxOrder = await prisma.task.aggregate({
      where: { userId },
      _max: { order: true },
    });

    const task = await prisma.$transaction(async (tx) => {
      const created = await tx.task.create({
        data: {
          title: req.body.title,
          description: req.body.description,
          status: req.body.status,
          priority: req.body.priority,
          dueDate: parseDueDate(req.body.dueDate),
          order: req.body.order ?? (maxOrder._max.order ?? -1) + 1,
          userId,
        },
      });
      await logCreated(tx, created.id, actorId);
      return created;
    });

    // Emit AFTER commit. Two events — task list mutated + activity row added.
    emit({ type: "task.created", taskId: task.id, ownerId: task.userId, actorId });
    emit({ type: "task.activity.added", taskId: task.id, ownerId: task.userId, actorId });

    res.status(201).json({ task: serializeTask(task) });
  } catch (err) {
    next(err);
  }
});

tasksRouter.get("/", async (req, res, next) => {
  try {
    const parsed = taskListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return sendError(res, 400, "VALIDATION_ERROR", "Invalid query parameters", parsed.error.issues);
    }
    const q = parsed.data;

    const query = {
      userId: req.userId!,
      isAdmin: req.userRole === "ADMIN",
      status: q.status,
      search: q.search,
      sort: q.sort,
      order: q.order,
      scope: q.scope,
      page: q.page?.toString(),
      limit: q.limit?.toString(),
    };
    const params = parseListParams(query);
    const isAllScope = req.userRole === "ADMIN" && q.scope === "all";

    const [result, counts] = await Promise.all([
      listTasks(
        (args) =>
          prisma.task.findMany({
            ...args,
            ...(isAllScope && {
              include: { user: { select: { id: true, name: true, email: true } } },
            }),
          }),
        (args) => prisma.task.count(args),
        params,
      ),
      getStatusCounts((args) => prisma.task.count(args), buildCountWhere(query)),
    ]);

    res.json({
      ...result,
      counts,
      data: result.data.map(serializeTask),
    });
  } catch (err) {
    next(err);
  }
});

tasksRouter.get("/:id", async (req, res, next) => {
  try {
    const task = await prisma.task.findFirst({
      where: { id: paramId(req.params.id), userId: req.userId! },
    });
    if (!task) {
      return sendError(res, 404, "NOT_FOUND", "Task not found");
    }
    res.json({ task: serializeTask(task) });
  } catch (err) {
    next(err);
  }
});

tasksRouter.patch("/:id", validate(taskUpdateSchema), async (req, res, next) => {
  try {
    const existing = await prisma.task.findFirst({
      where: { id: paramId(req.params.id), ...(req.userRole !== "ADMIN" && { userId: req.userId! }) },
    });
    if (!existing) {
      return sendError(res, 404, "NOT_FOUND", "Task not found");
    }

    const actorId = req.userId!;
    const { title, description, status, priority, dueDate, order } = req.body;

    // Build the patch we'll send to Prisma + the diff input (excludes `order` — drag-reorder noise).
    const dueDateValue = dueDate !== undefined ? parseDueDate(dueDate) : undefined;
    const updateData = {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status }),
      ...(priority !== undefined && { priority }),
      ...(order !== undefined && { order }),
      ...(dueDateValue !== undefined && { dueDate: dueDateValue }),
    };

    const diffInput = {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description: description ?? null }),
      ...(status !== undefined && { status }),
      ...(priority !== undefined && { priority }),
      ...(dueDateValue !== undefined && { dueDate: dueDateValue }),
    };
    const diff = diffTask(existing, diffInput);

    const task = await prisma.$transaction(async (tx) => {
      const updated = await tx.task.update({
        where: { id: existing.id },
        data: updateData,
      });
      if (diff) {
        await logUpdated(tx, updated.id, actorId, diff);
      }
      return updated;
    });

    // Emit AFTER commit. Skip if the patch was a no-op (no diff and no order change).
    if (diff || order !== undefined) {
      emit({ type: "task.updated", taskId: task.id, ownerId: task.userId, actorId });
    }
    if (diff) {
      emit({ type: "task.activity.added", taskId: task.id, ownerId: task.userId, actorId });
    }

    res.json({ task: serializeTask(task) });
  } catch (err) {
    next(err);
  }
});

tasksRouter.delete("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.task.findFirst({
      where: { id: paramId(req.params.id), userId: req.userId! },
    });
    if (!existing) {
      return sendError(res, 404, "NOT_FOUND", "Task not found");
    }

    // Cascade wipes TaskActivity rows automatically (FK onDelete: Cascade).
    await prisma.task.delete({ where: { id: existing.id } });

    emit({
      type: "task.deleted",
      taskId: existing.id,
      ownerId: existing.userId,
      actorId: req.userId!,
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

tasksRouter.get("/:id/activity", async (req, res, next) => {
  try {
    const parsed = activityListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return sendError(res, 400, "VALIDATION_ERROR", "Invalid query parameters", parsed.error.issues);
    }

    // Ownership check (admin sees all).
    const task = await prisma.task.findFirst({
      where: {
        id: paramId(req.params.id),
        ...(req.userRole !== "ADMIN" && { userId: req.userId! }),
      },
      select: { id: true },
    });
    if (!task) {
      return sendError(res, 404, "NOT_FOUND", "Task not found");
    }

    const limit = parsed.data.limit ?? 10;
    const cursor = parsed.data.cursor;

    const rows = await prisma.taskActivity.findMany({
      where: { taskId: task.id },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      include: {
        actor: { select: { id: true, name: true, role: true } },
      },
    });

    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    res.json({
      data: data.map((row) => ({
        id: row.id,
        taskId: row.taskId,
        action: row.action,
        changes: row.changes,
        createdAt: row.createdAt.toISOString(),
        actor: row.actor,
      })),
      nextCursor,
    });
  } catch (err) {
    next(err);
  }
});
