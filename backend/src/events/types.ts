/**
 * Event payloads are deliberately small — IDs only, no full task bodies.
 * Clients refetch via REST on receipt (the "invalidate, don't merge" rule).
 */

export type TaskEventType =
  | "task.created"
  | "task.updated"
  | "task.deleted"
  | "task.activity.added"
  | "attachment.added"
  | "attachment.removed";

export type UserEventType = "user.approved" | "user.rejected";

export type AppEvent =
  | {
      type: TaskEventType;
      taskId: string;
      ownerId: string; // for per-user scoping
      actorId: string;
      ts: number;
    }
  | {
      type: UserEventType;
      userId: string; // target user
      actorId: string;
      ts: number;
    };
