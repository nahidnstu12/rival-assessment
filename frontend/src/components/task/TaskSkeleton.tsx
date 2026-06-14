export function TaskSkeleton() {
  return (
    <div className="task-list">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="task-row animate-pulse">
          <div className="size-[18px] rounded bg-[var(--surface-2)]" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-1/3 rounded bg-[var(--surface-2)]" />
            <div className="h-3 w-1/2 rounded bg-[var(--surface-2)]" />
          </div>
        </div>
      ))}
    </div>
  );
}
