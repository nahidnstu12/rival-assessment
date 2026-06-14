"use client";

import { useToast } from "@/context/ToastContext";
import { tasksApi } from "@/lib/api/tasks";
import type { TaskFormValues } from "@/schemas/task.schema";
import type { Task, TaskListResponse } from "@/types/task";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type TaskSnapshot = [readonly unknown[], TaskListResponse | undefined];

export function useTaskMutations() {
  const qc = useQueryClient();
  const toast = useToast();

  const invalidate = () => qc.invalidateQueries({ queryKey: ["tasks"] });

  function snapshotTasks(): TaskSnapshot[] {
    return qc.getQueriesData<TaskListResponse>({ queryKey: ["tasks"] });
  }

  function patchTasks(updater: (old: TaskListResponse) => TaskListResponse) {
    for (const [key, data] of snapshotTasks()) {
      if (data) qc.setQueryData(key, updater(data));
    }
  }

  const create = useMutation({
    mutationFn: (data: TaskFormValues) =>
      tasksApi.create({
        title: data.title,
        description: data.description || undefined,
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate || null,
      }),
    onSuccess: () => {
      invalidate();
      toast.show("Task created");
    },
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TaskFormValues> }) =>
      tasksApi.update(id, {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate ?? null,
      }),
    onSuccess: () => {
      invalidate();
      toast.show("Changes saved");
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const prev = snapshotTasks();
      patchTasks((old) => ({
        ...old,
        data: old.data.filter((t) => t.id !== id),
        total: Math.max(0, old.total - 1),
      }));
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      ctx?.prev.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSuccess: () => toast.show("Task deleted"),
    onSettled: () => invalidate(),
  });

  const toggleComplete = useMutation({
    mutationFn: (task: Task) =>
      tasksApi.update(task.id, { status: task.status === "DONE" ? "TODO" : "DONE" }),
    onMutate: async (task) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const prev = snapshotTasks();
      const nextStatus = task.status === "DONE" ? "TODO" : "DONE";
      patchTasks((old) => ({
        ...old,
        data: old.data.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)),
      }));
      return { prev, task };
    },
    onError: (_err, _task, ctx) => {
      ctx?.prev.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSuccess: (_data, task) => {
      toast.show(task.status === "DONE" ? "Marked active" : "Task completed");
    },
    onSettled: () => invalidate(),
  });

  const reorder = useMutation({
    mutationFn: ({ id, order }: { id: string; order: number }) => tasksApi.update(id, { order }),
    onSuccess: () => toast.show("Order updated"),
    onSettled: () => invalidate(),
  });

  return { create, update, remove, toggleComplete, reorder };
}
