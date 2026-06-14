export function TaskSkeleton() {
  return (
    <div className="task-list">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="task-card animate-pulse">
          <div className="task-card-main">
            <div className="size-[18px] rounded-md bg-[var(--surface-2)]" />
            <div className="flex-1 space-y-2.5">
              <div className="h-3.5 w-2/5 rounded bg-[var(--surface-2)]" />
              <div className="h-3 w-3/5 rounded bg-[var(--surface-2)]" />
              <div className="flex gap-2">
                <div className="h-6 w-6 rounded-md bg-[var(--surface-2)]" />
                <div className="h-6 w-6 rounded-md bg-[var(--surface-2)]" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
