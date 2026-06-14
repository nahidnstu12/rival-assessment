"use client";

type EmptyStateProps = {
  filtered?: boolean;
  onClear?: () => void;
  onCreate?: () => void;
};

export function EmptyState({ filtered, onClear, onCreate }: EmptyStateProps) {
  return (
    <div className="empty">
      <div
        className="mx-auto size-[46px] rounded-xl grid place-items-center mb-4 text-xl"
        style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
      >
        {filtered ? "🔍" : "✓"}
      </div>
      <h3 className="text-[15px] font-semibold">
        {filtered ? "No matching tasks" : "No tasks yet"}
      </h3>
      <p className="text-[var(--text-muted)] my-1.5 mb-[18px] text-[13.5px]">
        {filtered
          ? "Try clearing the search or status filter."
          : "Create your first task to get started."}
      </p>
      {filtered && onClear ? (
        <button type="button" className="btn btn-ghost" onClick={onClear}>
          Clear filters
        </button>
      ) : onCreate ? (
        <button type="button" className="btn btn-primary mx-auto" onClick={onCreate}>
          New task
        </button>
      ) : null}
    </div>
  );
}
