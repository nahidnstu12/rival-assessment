"use client";

import { X } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { taskDefaults, taskSchema, type TaskFormValues } from "@/schemas/task.schema";
import type { Task } from "@/types/task";
import { todayISO } from "@/lib/utils";

type TaskModalProps = {
  open: boolean;
  task?: Task | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormValues) => void;
};

export function TaskModal({ open, task, loading, onClose, onSubmit }: TaskModalProps) {
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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog">
        <div
          className="flex items-center justify-between px-5 py-[18px] border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <h3 className="text-base font-semibold">{isEdit ? "Edit task" : "New task"}</h3>
          <button type="button" className="icon-action" onClick={onClose} aria-label="Close">
            <X size={16} strokeWidth={2} />
          </button>
        </div>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="p-5 space-y-4"
        >
          <div className={`field ${form.formState.errors.title ? "invalid" : ""}`}>
            <label className="block text-[13px] font-medium mb-1.5">Title</label>
            <input {...form.register("title")} placeholder="e.g. Design the onboarding flow" />
            {form.formState.errors.title && (
              <div className="err">{form.formState.errors.title.message}</div>
            )}
          </div>
          <div className="field">
            <label className="block text-[13px] font-medium mb-1.5">
              Description{" "}
              <span className="text-[var(--text-subtle)] font-normal">(optional)</span>
            </label>
            <textarea {...form.register("description")} rows={3} placeholder="Add more detail…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="field">
              <label className="block text-[13px] font-medium mb-1.5">Status</label>
              <select {...form.register("status")}>
                <option value="TODO">To do</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>
            <div className="field">
              <label className="block text-[13px] font-medium mb-1.5">Priority</label>
              <select {...form.register("priority")}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label className="block text-[13px] font-medium mb-1.5">
              Due date{" "}
              <span className="text-[var(--text-subtle)] font-normal">(optional)</span>
            </label>
            <input type="date" {...form.register("dueDate")} />
          </div>
          <div
            className="flex justify-end gap-2.5 px-5 py-3.5 -mx-5 -mb-5 border-t"
            style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
          >
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Saving…" : isEdit ? "Save changes" : "Create task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
