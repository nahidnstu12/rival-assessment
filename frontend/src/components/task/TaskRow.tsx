"use client";

import { IconButton } from "@/components/ui/IconButton";
import { TruncatedText } from "@/components/ui/TruncatedText";
import { avatarColor, fmtDate, initials, isOverdue } from "@/lib/utils";
import type { Task } from "@/types/task";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { Calendar, Check, GripVertical, Pencil, Trash2 } from "lucide-react";
import { forwardRef, type CSSProperties, type Ref } from "react";
import { PriorityIcon, StatusIcon } from "./TaskMetaIcons";

export type TaskRowProps = {
  task: Task;
  dragEnabled?: boolean;
  showOwner?: boolean;
  isSortableDragging?: boolean;
  isDragOverlay?: boolean;
  style?: CSSProperties;
  sortableAttributes?: DraggableAttributes;
  dragHandleRef?: (element: HTMLElement | null) => void;
  dragHandleListeners?: SyntheticListenerMap;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export const TaskRow = forwardRef(function TaskRow(
  {
    task,
    dragEnabled,
    showOwner,
    isSortableDragging,
    isDragOverlay,
    style,
    sortableAttributes,
    dragHandleRef,
    dragHandleListeners,
    onToggle,
    onEdit,
    onDelete,
  }: TaskRowProps,
  ref: Ref<HTMLElement>,
) {
  const done = task.status === "DONE";
  const overdue = isOverdue(task.dueDate, task.status);
  const priorityTone = `priority-accent-${task.priority.toLowerCase()}`;

  function handleRowClick(e: React.MouseEvent) {
    if (isDragOverlay || isSortableDragging) return;
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, textarea, select, [data-drag-handle]")) return;
    onEdit();
  }

  return (
    <article
      ref={ref}
      style={style}
      className={[
        "task-card",
        done ? "done" : "",
        priorityTone,
        isSortableDragging ? "is-sortable-dragging" : "",
        isDragOverlay ? "is-drag-overlay" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={handleRowClick}
      {...sortableAttributes}
    >
      <div className="task-card-main">
        {dragEnabled && (
          <div
            ref={dragHandleRef}
            data-drag-handle
            className="drag-handle"
            aria-label="Drag to reorder"
            title="Drag to reorder"
            {...dragHandleListeners}
          >
            <GripVertical size={16} strokeWidth={2.5} />
          </div>
        )}

        <button
          type="button"
          className={`checkbox ${done ? "done" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          aria-label={done ? "Mark as incomplete" : "Mark as complete"}
        >
          {done && <Check size={11} strokeWidth={3} />}
        </button>

        <div className="min-w-0 flex-1 task-card-text">
          <TruncatedText text={task.title} lines={1} className="task-title" />
          {task.description && (
            <TruncatedText text={task.description} lines={2} className="task-desc" />
          )}
          <div className="task-meta-row">
            <StatusIcon status={task.status} showLabel />
            <PriorityIcon priority={task.priority} showLabel />
            {task.dueDate && (
              <span className={`task-due ${overdue ? "overdue" : ""}`}>
                <Calendar size={13} strokeWidth={2} />
                {fmtDate(task.dueDate)}
              </span>
            )}
            {showOwner && task.owner && (
              <span className="task-owner">
                <span
                  className="avatar !size-[20px] !text-[9px]"
                  style={{ background: avatarColor(task.owner.email) }}
                >
                  {initials(task.owner.name)}
                </span>
                {task.owner.name.split(" ")[0]}
              </span>
            )}
          </div>
        </div>
      </div>

      {!isDragOverlay && (
        <div className="task-card-actions" onClick={(e) => e.stopPropagation()}>
          <IconButton icon={Pencil} label="Edit task" onClick={onEdit} />
          <IconButton icon={Trash2} label="Delete task" variant="danger" onClick={onDelete} />
        </div>
      )}
    </article>
  );
});
