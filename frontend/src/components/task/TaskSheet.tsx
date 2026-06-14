"use client";

import { X } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { taskDefaults, taskSchema, type TaskFormValues } from "@/schemas/task.schema";
import type { Task } from "@/types/task";
import { todayISO } from "@/lib/utils";
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from "./TaskMetaIcons";
import { InlineDatePicker } from "@/components/ui/InlineDatePicker";

type TaskSheetProps = {
  open: boolean;
  task?: Task | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormValues) => void;
};

export function TaskSheet({ open, task, loading, onClose, onSubmit }: TaskSheetProps) {
  const isEdit = !!task;
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: taskDefaults,
  });

  useEffect(() => {
    if (!open) return;
    if (task) {
      form.reset({
        title: task.title,
        description: task.description ?? "",
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ?? "",
      });
    } else {
      form.reset({ ...taskDefaults, dueDate: todayISO() });
    }
  }, [open, task, form]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="sheet-root" aria-hidden={!open}>
      <div
        className="sheet-overlay"
        onClick={(e) => e.target === e.currentTarget && onClose()}
        aria-hidden
      />
      <aside className="sheet-panel" role="dialog" aria-modal="true" aria-label={isEdit ? "Edit task" : "New task"}>
        <div className="sheet-header">
          <div>
            <p className="sheet-eyebrow">{isEdit ? "Edit task" : "New task"}</p>
            <h3 className="sheet-title">{isEdit ? task?.title ?? "Task" : "Create a task"}</h3>
          </div>
          <button type="button" className="icon-action" onClick={onClose} aria-label="Close">
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="sheet-body">
          <div className={`field ${form.formState.errors.title ? "invalid" : ""}`}>
            <label className="field-label">Title</label>
            <input {...form.register("title")} placeholder="e.g. Design the onboarding flow" autoFocus />
            {form.formState.errors.title && (
              <div className="err">{form.formState.errors.title.message}</div>
            )}
          </div>

          <div className="field">
            <label className="field-label">
              Description <span className="field-hint">(optional)</span>
            </label>
            <textarea {...form.register("description")} rows={4} placeholder="Add more detail…" />
          </div>

          <div className="field">
            <label className="field-label">Status</label>
            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <div className="icon-toggle-group" role="group" aria-label="Status">
                  {STATUS_OPTIONS.map(({ value, icon: Icon, label, tone }) => (
                    <button
                      key={value}
                      type="button"
                      className={`icon-toggle ${tone} ${field.value === value ? "active" : ""}`}
                      onClick={() => field.onChange(value)}
                      aria-pressed={field.value === value}
                    >
                      <Icon size={16} strokeWidth={2} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              )}
            />
          </div>

          <div className="field">
            <label className="field-label">Priority</label>
            <Controller
              control={form.control}
              name="priority"
              render={({ field }) => (
                <div className="icon-toggle-group" role="group" aria-label="Priority">
                  {PRIORITY_OPTIONS.map(({ value, icon: Icon, label, tone }) => (
                    <button
                      key={value}
                      type="button"
                      className={`icon-toggle ${tone} ${field.value === value ? "active" : ""}`}
                      onClick={() => field.onChange(value)}
                      aria-pressed={field.value === value}
                    >
                      <Icon size={16} strokeWidth={2.25} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              )}
            />
          </div>

          <div className="field">
            <label className="field-label">
              Due date <span className="field-hint">(optional)</span>
            </label>
            <Controller
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <InlineDatePicker value={field.value ?? ""} onChange={field.onChange} />
              )}
            />
          </div>

          <div className="sheet-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Saving…" : isEdit ? "Save changes" : "Create task"}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}
