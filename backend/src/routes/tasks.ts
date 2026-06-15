import { Router } from "express";
import { prisma } from "../db.js";
import { requireApproved, requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { taskCreateSchema, taskListQuerySchema, taskUpdateSchema } from "../schemas/task.schema.js";
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
    const maxOrder = await prisma.task.aggregate({
      where: { userId },
      _max: { order: true },
    });

    const task = await prisma.task.create({
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
      where: { id: paramId(req.params.id), userId: req.userId! },
    });
    if (!existing) {
      return sendError(res, 404, "NOT_FOUND", "Task not found");
    }

    const { title, description, status, priority, dueDate, order } = req.body;
    const task = await prisma.task.update({
      where: { id: existing.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(order !== undefined && { order }),
        ...(dueDate !== undefined && { dueDate: parseDueDate(dueDate) }),
      },
    });

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

    await prisma.task.delete({ where: { id: existing.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
