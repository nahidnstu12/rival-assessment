import { Router } from "express";
import { prisma } from "../db.js";
import { emit } from "../events/bus.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { userStatusUpdateSchema } from "../schemas/user.schema.js";
import { sendError } from "../utils/errors.js";
import { paramId } from "../utils/params.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

adminRouter.get("/users", async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        _count: { select: { tasks: true } },
      },
    });

    res.json({
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        taskCount: u._count.tasks,
        createdAt: u.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    next(err);
  }
});

adminRouter.patch("/users/:id", validate(userStatusUpdateSchema), async (req, res, next) => {
  try {
    const existing = await prisma.user.findUnique({ where: { id: paramId(req.params.id) } });
    if (!existing) {
      return sendError(res, 404, "NOT_FOUND", "User not found");
    }

    const user = await prisma.user.update({
      where: { id: existing.id },
      data: { status: req.body.status },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    // Emit only on transitions to a final state so the target user's pending
    // screen / login state flips live.
    if (user.status === "APPROVED" && existing.status !== "APPROVED") {
      emit({ type: "user.approved", userId: user.id, actorId: req.userId! });
    }
    if (user.status === "REJECTED" && existing.status !== "REJECTED") {
      emit({ type: "user.rejected", userId: user.id, actorId: req.userId! });
    }

    res.json({
      user: { ...user, createdAt: user.createdAt.toISOString() },
    });
  } catch (err) {
    next(err);
  }
});
