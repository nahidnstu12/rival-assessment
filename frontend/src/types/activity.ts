export type TaskActivityAction =
  | "CREATED"
  | "UPDATED"
  | "STATUS_CHANGED"
  | "DELETED"
  | "ATTACHMENT_ADDED"
  | "ATTACHMENT_REMOVED";

export type ActivityDiffEntry = {
  from: string | number | boolean | null;
  to: string | number | boolean | null;
};

export type ActivityDiff = Record<string, ActivityDiffEntry>;

export type TaskActivityActor = {
  id: string;
  name: string;
  role: "USER" | "ADMIN";
};

export type TaskActivity = {
  id: string;
  taskId: string;
  action: TaskActivityAction;
  changes: ActivityDiff | null;
  createdAt: string;
  actor: TaskActivityActor;
};

export type TaskActivityPage = {
  data: TaskActivity[];
  nextCursor: string | null;
};
