"use client";

import { useTaskActivity } from "@/hooks/useTaskActivity";
import type {
  ActivityDiff,
  TaskActivity,
  TaskActivityAction,
} from "@/types/activity";

type ActivityListProps = {
  taskId: string;
};

export function ActivityList({ taskId }: ActivityListProps) {
  const {
    data,
    isLoading,
    isError,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useTaskActivity(taskId);

  const rows = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <section className="activity-section" aria-label="Activity log">
      <header className="activity-header">
        <h4 className="activity-title">Activity</h4>
      </header>

      {isLoading && <p className="activity-empty">Loading…</p>}

      {isError && (
        <div className="activity-empty">
          <p>Failed to load activity</p>
          <button type="button" className="btn btn-ghost" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && rows.length === 0 && (
        <p className="activity-empty">No activity yet.</p>
      )}

      {rows.length > 0 && (
        <ul className="activity-list">
          {rows.map((row) => (
            <ActivityRow key={row.id} row={row} />
          ))}
        </ul>
      )}

      {hasNextPage && (
        <button
          type="button"
          className="btn btn-ghost activity-more"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? "Loading…" : "Show more"}
        </button>
      )}
    </section>
  );
}

function ActivityRow({ row }: { row: TaskActivity }) {
  const isAttachmentEvent =
    row.action === "ATTACHMENT_ADDED" || row.action === "ATTACHMENT_REMOVED";
  const filename =
    isAttachmentEvent && typeof row.changes?.filename?.to !== "undefined"
      ? // Stored as { filename: "name.png" } not the diff shape — accept both
        String(row.changes?.filename?.to)
      : isAttachmentEvent && row.changes && typeof (row.changes as unknown as { filename?: string }).filename === "string"
        ? (row.changes as unknown as { filename: string }).filename
        : null;

  return (
    <li className="activity-row">
      <div className="activity-meta">
        <span className="activity-actor">{row.actor.name}</span>
        {row.actor.role === "ADMIN" && (
          <span className="activity-badge">Admin</span>
        )}
        <span className="activity-action">{actionLabel(row.action)}</span>
        <time className="activity-time" dateTime={row.createdAt}>
          {formatRelative(row.createdAt)}
        </time>
      </div>
      {isAttachmentEvent && filename && (
        <p className="activity-diff activity-attachment">{filename}</p>
      )}
      {!isAttachmentEvent && row.changes && (
        <ActivityDiffLines diff={row.changes} action={row.action} />
      )}
    </li>
  );
}

function ActivityDiffLines({
  diff,
  action,
}: {
  diff: ActivityDiff;
  action: TaskActivityAction;
}) {
  const entries = Object.entries(diff);
  if (entries.length === 0) return null;

  // STATUS_CHANGED → render a single pill instead of a list (per phase doc).
  if (action === "STATUS_CHANGED" && diff.status) {
    return (
      <p className="activity-diff activity-diff-pill">
        <span className="activity-pill">{String(diff.status.from ?? "—")}</span>
        <span aria-hidden> → </span>
        <span className="activity-pill activity-pill-active">
          {String(diff.status.to ?? "—")}
        </span>
      </p>
    );
  }

  return (
    <ul className="activity-diff">
      {entries.map(([field, change]) => (
        <li key={field} className="activity-diff-line">
          <span className="activity-field">{fieldLabel(field)}</span>:{" "}
          <span className="activity-from">{formatValue(field, change.from)}</span>
          <span aria-hidden> → </span>
          <span className="activity-to">{formatValue(field, change.to)}</span>
        </li>
      ))}
    </ul>
  );
}

function actionLabel(action: TaskActivityAction): string {
  switch (action) {
    case "CREATED":
      return "created this task";
    case "STATUS_CHANGED":
      return "changed status";
    case "DELETED":
      return "deleted this task";
    case "ATTACHMENT_ADDED":
      return "added an attachment";
    case "ATTACHMENT_REMOVED":
      return "removed an attachment";
    case "UPDATED":
    default:
      return "updated";
  }
}

function fieldLabel(field: string): string {
  switch (field) {
    case "title":
      return "Title";
    case "description":
      return "Description";
    case "status":
      return "Status";
    case "priority":
      return "Priority";
    case "dueDate":
      return "Due date";
    default:
      return field;
  }
}

function formatValue(field: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (field === "description") {
    const s = String(value);
    return s.length > 40 ? `${s.slice(0, 40)}…` : s;
  }
  return String(value);
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const sec = Math.round((now - then) / 1000);
  if (sec < 60) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toISOString().slice(0, 10);
}
