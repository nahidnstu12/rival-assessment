"use client";

type TopbarProps = {
  title: string;
  subtitle?: string;
  showSearch?: boolean;
  showNewTask?: boolean;
  search?: string;
  onSearchChange?: (v: string) => void;
  onNewTask?: () => void;
};

export function Topbar({
  title,
  subtitle,
  showSearch = true,
  showNewTask = true,
  search = "",
  onSearchChange,
  onNewTask,
}: TopbarProps) {
  return (
    <div className="topbar">
      <div>
        <div className="text-[17px] font-semibold tracking-tight">{title}</div>
        {subtitle && (
          <div className="text-[12.5px] text-[var(--text-subtle)] mono hidden sm:block">{subtitle}</div>
        )}
      </div>
      <div className="flex-1" />
      {showSearch && onSearchChange && (
        <div className="relative w-[150px] sm:w-[260px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)] text-sm">
            🔍
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks…"
            className="w-full py-2 pl-8 pr-3 border rounded-[var(--radius-sm)] text-sm bg-[var(--surface)]"
            style={{ borderColor: "var(--border-strong)" }}
          />
        </div>
      )}
      {showNewTask && onNewTask && (
        <button type="button" className="btn btn-primary" onClick={onNewTask}>
          + New task
        </button>
      )}
    </div>
  );
}
