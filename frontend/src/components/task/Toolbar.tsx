"use client";

import { GripVertical } from "lucide-react";
import { useTaskFilters } from "@/hooks/useTaskFilters";

const SORT_OPTIONS = [
  { value: "manual", label: "Manual order", mineOnly: true },
  { value: "createdAt-desc", label: "Newest first", sort: "createdAt", order: "desc" },
  { value: "createdAt-asc", label: "Oldest first", sort: "createdAt", order: "asc" },
  { value: "dueDate-asc", label: "Due date ↑", sort: "dueDate", order: "asc" },
  { value: "dueDate-desc", label: "Due date ↓", sort: "dueDate", order: "desc" },
  { value: "priority-desc", label: "Priority ↓", sort: "priority", order: "desc" },
  { value: "priority-asc", label: "Priority ↑", sort: "priority", order: "asc" },
] as const;

type ToolbarProps = {
  counts: { all: number; todo: number; in_progress: number; done: number };
  mineOnly?: boolean;
  sortDisabled?: boolean;
  defaultSort?: string;
};

export function Toolbar({ counts, mineOnly = true, sortDisabled, defaultSort = "manual" }: ToolbarProps) {
  const { status, sort, order, setParam, setSort } = useTaskFilters(defaultSort);

  const sortValue =
    SORT_OPTIONS.find((o) => "sort" in o && o.sort === sort && o.order === order)?.value ??
    (sort === "manual" ? "manual" : "createdAt-desc");

  const pills = [
    { key: "all", label: "All", count: counts.all },
    { key: "todo", label: "To do", count: counts.todo },
    { key: "in_progress", label: "In progress", count: counts.in_progress },
    { key: "done", label: "Done", count: counts.done },
  ];

  return (
    <div className="flex items-center gap-2.5 flex-wrap mb-[18px]">
      <div className="pills">
        {pills.map((p) => (
          <button
            key={p.key}
            type="button"
            className={`pill ${status === p.key ? "active" : ""}`}
            onClick={() => setParam("status", p.key === "all" ? null : p.key)}
          >
            {p.label}
            <span className="mono text-[11px] opacity-60 ml-1">{p.count}</span>
          </button>
        ))}
      </div>
      <div className="flex-1" />
      {sort === "manual" && mineOnly && (
        <span
          className="inline-flex items-center gap-1.5 text-xs text-[var(--text-subtle)] px-2.5 py-1.5 border rounded-full"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
        >
          <GripVertical size={14} strokeWidth={2} />
          Drag rows to reorder
        </span>
      )}
      <select
        className="py-2 px-3 border rounded-[var(--radius-sm)] text-sm font-medium bg-[var(--surface)] disabled:opacity-50"
        style={{ borderColor: "var(--border-strong)" }}
        disabled={sortDisabled}
        value={sortValue}
        onChange={(e) => {
          const opt = SORT_OPTIONS.find((o) => o.value === e.target.value);
          if (!opt) return;
          if (opt.value === "manual") setSort("manual");
          else if ("sort" in opt) setSort(opt.sort, opt.order);
        }}
      >
        {SORT_OPTIONS.filter((o) => mineOnly || !("mineOnly" in o && o.mineOnly)).map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
