import type { Prisma, Task, TaskActivityAction } from "@prisma/client";

/**
 * Fields whose changes are worth logging.
 * `order` (drag-reorder) is excluded — too noisy.
 */
const TRACKED_FIELDS = ["title", "description", "status", "priority", "dueDate"] as const;
type TrackedField = (typeof TRACKED_FIELDS)[number];

export type DiffEntry = { from: unknown; to: unknown };
export type DiffJson = Record<string, DiffEntry>;

type TaskPatch = Partial<Pick<Task, TrackedField>>;

/**
 * Compare existing task vs incoming patch.
 * Returns only the fields that actually changed, in `{from, to}` shape.
 * Returns null if nothing tracked changed (e.g. only `order` moved).
 */
export function diffTask(existing: Task, patch: TaskPatch): DiffJson | null {
  const diff: DiffJson = {};

  for (const field of TRACKED_FIELDS) {
    if (!(field in patch)) continue;
    const next = patch[field] ?? null;
    const prev = existing[field] ?? null;

    if (isEqual(prev, next)) continue;
    diff[field] = { from: serializeValue(prev), to: serializeValue(next) };
  }

  return Object.keys(diff).length > 0 ? diff : null;
}

/**
 * If the only diff is `status`, log as STATUS_CHANGED so the UI can render
 * a single pill. Otherwise UPDATED (multi-field list).
 */
export function pickUpdateAction(diff: DiffJson): TaskActivityAction {
  const keys = Object.keys(diff);
  return keys.length === 1 && keys[0] === "status" ? "STATUS_CHANGED" : "UPDATED";
}

export function logCreated(
  tx: Prisma.TransactionClient,
  taskId: string,
  actorId: string,
) {
  return tx.taskActivity.create({
    data: { taskId, actorId, action: "CREATED", changes: undefined },
  });
}

export function logUpdated(
  tx: Prisma.TransactionClient,
  taskId: string,
  actorId: string,
  diff: DiffJson,
) {
  return tx.taskActivity.create({
    data: {
      taskId,
      actorId,
      action: pickUpdateAction(diff),
      changes: diff as Prisma.InputJsonValue,
    },
  });
}

export function logAttachmentAdded(
  tx: Prisma.TransactionClient,
  taskId: string,
  actorId: string,
  filename: string,
) {
  return tx.taskActivity.create({
    data: {
      taskId,
      actorId,
      action: "ATTACHMENT_ADDED",
      changes: { filename } as Prisma.InputJsonValue,
    },
  });
}

export function logAttachmentRemoved(
  tx: Prisma.TransactionClient,
  taskId: string,
  actorId: string,
  filename: string,
) {
  return tx.taskActivity.create({
    data: {
      taskId,
      actorId,
      action: "ATTACHMENT_REMOVED",
      changes: { filename } as Prisma.InputJsonValue,
    },
  });
}

function isEqual(a: unknown, b: unknown): boolean {
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (a instanceof Date) return a.toISOString() === b;
  if (b instanceof Date) return b.toISOString() === a;
  return a === b;
}

/** Dates → YYYY-MM-DD for renderer consistency (per phase doc). */
function serializeValue(v: unknown): unknown {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return v;
}
