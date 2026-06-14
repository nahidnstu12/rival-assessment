"use client";

import { IconButton } from "@/components/ui/IconButton";
import { avatarColor, fmtDate, initials, isOverdue, priorityLabel, statusLabel } from "@/lib/utils";
import type { Task } from "@/types/task";
import { Check, GripVertical, Pencil, Trash2 } from "lucide-react";

type TaskRowProps = {
  task: Task;
  dragEnabled?: boolean;
  showOwner?: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDragStart?: (id: string) => void;
  onDragEnd?: () => void;
  onDragOver?: (e: React.DragEvent, id: string) => void;
  onDrop?: (e: React.DragEvent, id: string) => void;
  dragClass?: string;
};

export function TaskRow({
  task,
  dragEnabled,
  showOwner,
  onToggle,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  dragClass,
}: TaskRowProps) {
  const done = task.status === "DONE";
  const statusClass = task.status === "IN_PROGRESS" ? "in_progress" : task.status.toLowerCase();

  return (
    <div
      className={`task-row ${done ? "done" : ""} ${dragClass ?? ""}`}
      draggable={dragEnabled}
      onDragStart={() => onDragStart?.(task.id)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver?.(e, task.id)}
      onDrop={(e) => onDrop?.(e, task.id)}
    >
      {dragEnabled && (
        <span className="drag-handle" aria-hidden>
          <GripVertical size={16} strokeWidth={2} />
        </span>
      )}
      <button
        type="button"
        className={`checkbox ${done ? "done" : ""}`}
        onClick={onToggle}
        aria-label={done ? "Mark as incomplete" : "Mark as complete"}
      >
        {done && <Check size={11} strokeWidth={3} />}
      </button>
      <div className="min-w-0 flex-1">
        <div className="task-title font-medium text-sm truncate">{task.title}</div>
        {task.description && (
          <div className="text-[12.5px] text-[var(--text-muted)] truncate mt-0.5">
            {task.description}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {showOwner && task.owner && (
          <div className="flex items-center gap-1.5">
            <div
              className="avatar !size-[22px] !text-[9.5px]"
              style={{ background: avatarColor(task.owner.email) }}
            >
              {initials(task.owner.name)}
            </div>
            <span className="text-[12.5px] text-[var(--text-muted)] font-medium hidden sm:inline">
              {task.owner.name.split(" ")[0]}
            </span>
          </div>
        )}
        <span className={`badge b-${task.priority.toLowerCase()}`}>
          <span className="dot" />
          {priorityLabel(task.priority)}
        </span>
        <span className={`badge s-${statusClass}`}>
          <span className="dot" />
          {statusLabel(task.status)}
        </span>
        <span
          className={`mono text-xs ${isOverdue(task.dueDate, task.status) ? "text-[var(--red)]" : "text-[var(--text-muted)]"}`}
        >
          {fmtDate(task.dueDate)}
        </span>
        <div className="task-row-actions">
          <IconButton icon={Pencil} label="Edit task" onClick={onEdit} />
          <IconButton icon={Trash2} label="Delete task" variant="danger" onClick={onDelete} />
        </div>
      </div>
    </div>
  );
}
