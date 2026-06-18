import { Router } from "express";
import { eventBus } from "../events/bus.js";
import { requireApproved, requireAuth } from "../middleware/auth.js";

const HEARTBEAT_MS = 15_000;

export const eventsRouter = Router();

eventsRouter.use(requireAuth, requireApproved);

eventsRouter.get("/", (req, res) => {
  // SSE headers — flushHeaders so the client opens the stream immediately.
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // disables proxy buffering on nginx-style proxies
  res.flushHeaders();

  const userId = req.userId!;
  const role = req.userRole === "ADMIN" ? "ADMIN" : "USER";

  // Initial "hello" event so the client can confirm the stream is live.
  res.write(`event: hello\n`);
  res.write(`data: ${JSON.stringify({ ts: Date.now(), userId })}\n\n`);

  const subscriber = eventBus.subscribe(res, userId, role);

  // Heartbeat — Render's proxy / many CDNs kill idle HTTP connections.
  // SSE comments (`:` prefix) are ignored by EventSource but reset the
  // proxy's idle timer.
  const heartbeat = setInterval(() => {
    try {
      res.write(`: heartbeat ${Date.now()}\n\n`);
    } catch {
      // Stream broke — clean up. Close handler will also run.
      clearInterval(heartbeat);
      eventBus.unsubscribe(subscriber);
    }
  }, HEARTBEAT_MS);

  const cleanup = () => {
    clearInterval(heartbeat);
    eventBus.unsubscribe(subscriber);
  };

  req.on("close", cleanup);
  req.on("error", cleanup);
});
