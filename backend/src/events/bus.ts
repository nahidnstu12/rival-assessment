import type { Response } from "express";
import type { AppEvent, TaskEventType, UserEventType } from "./types.js";

type Role = "USER" | "ADMIN";

export type Subscriber = {
  id: string;
  userId: string;
  role: Role;
  send: (event: AppEvent) => void;
};

/**
 * In-memory pub/sub. Single Render instance only — for horizontal scale
 * swap this with Redis pub/sub behind the same interface.
 */
class EventBus {
  private byUser = new Map<string, Set<Subscriber>>();
  private admins = new Set<Subscriber>();
  private nextId = 1;

  subscribe(res: Response, userId: string, role: Role): Subscriber {
    const sub: Subscriber = {
      id: `s${this.nextId++}`,
      userId,
      role,
      send: (event) => writeSse(res, event),
    };

    const set = this.byUser.get(userId) ?? new Set<Subscriber>();
    set.add(sub);
    this.byUser.set(userId, set);

    if (role === "ADMIN") this.admins.add(sub);
    return sub;
  }

  unsubscribe(sub: Subscriber) {
    const set = this.byUser.get(sub.userId);
    if (set) {
      set.delete(sub);
      if (set.size === 0) this.byUser.delete(sub.userId);
    }
    this.admins.delete(sub);
  }

  /**
   * Fan an event to the right channels.
   * For task events: owner + all admins.
   * For user events: target user + all admins.
   * Duplicates (admin who is also the owner) are deduped via a Set.
   */
  emit(event: AppEvent) {
    const targets = new Set<Subscriber>();

    if ("ownerId" in event) {
      const owner = this.byUser.get(event.ownerId);
      if (owner) owner.forEach((s) => targets.add(s));
    } else if ("userId" in event) {
      const target = this.byUser.get(event.userId);
      if (target) target.forEach((s) => targets.add(s));
    }
    this.admins.forEach((s) => targets.add(s));

    targets.forEach((s) => {
      try {
        s.send(event);
      } catch {
        // If the response is broken, drop the subscriber. The close handler
        // will run too, but this is belt-and-suspenders.
        this.unsubscribe(s);
      }
    });
  }
}

function writeSse(res: Response, event: AppEvent) {
  res.write(`event: ${event.type}\n`);
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

export const eventBus = new EventBus();

/**
 * Input shape for `emit()` — variants spelled out so TS keeps the discriminant.
 * `Omit<AppEvent, "ts">` collapses fields across variants in a discriminated union.
 */
type EmitInput =
  | { type: TaskEventType; taskId: string; ownerId: string; actorId: string }
  | { type: UserEventType; userId: string; actorId: string };

/** Convenience — auto-stamp ts so emit sites stay clean. */
export function emit(event: EmitInput) {
  eventBus.emit({ ...event, ts: Date.now() } as AppEvent);
}
