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
      ownerId: string;
      actorId: string;
      ts: number;
    }
  | {
      type: UserEventType;
      userId: string;
      actorId: string;
      ts: number;
    };
