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
      <div className="topbar-heading">
        <h1 className="topbar-title">{title}</h1>
        {subtitle && <p className="topbar-subtitle">{subtitle}</p>}
      </div>
      <div className="flex-1" />
      {showSearch && onSearchChange && (
        <div className="topbar-search">
          <span className="topbar-search-icon" aria-hidden>
            🔍
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks…"
            className="topbar-search-input"
          />
        </div>
      )}
      {showNewTask && onNewTask && (
        <button type="button" className="btn btn-primary shrink-0" onClick={onNewTask}>
          + New task
        </button>
      )}
    </div>
  );
}
