import { Router } from "express";
import { adminRouter } from "./routes/admin.js";
import { attachmentsRouter } from "./routes/attachments.js";
import { authRouter } from "./routes/auth.js";
import { eventsRouter } from "./routes/events.js";
import { tasksRouter } from "./routes/tasks.js";

export const router = Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true });
});

router.use("/auth", authRouter);
router.use("/tasks", tasksRouter);
router.use("/tasks/:id/attachments", attachmentsRouter);
router.use("/admin", adminRouter);
router.use("/events", eventsRouter);
