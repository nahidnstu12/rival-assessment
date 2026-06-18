"use client";

import { useToast } from "@/context/ToastContext";
import { tasksApi } from "@/lib/api/tasks";
import type { TaskFormValues } from "@/schemas/task.schema";
import type { Task, TaskListParams, TaskListResponse, TaskStatus } from "@/types/task";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type TaskSnapshot = [readonly unknown[], TaskListResponse | undefined];

type ReorderOptions = {
  switchToManual?: boolean;
  setSort?: (sort: string, order?: string) => void;
};

function statusCountKey(status: TaskStatus): keyof TaskListResponse["counts"] {
  return status === "IN_PROGRESS" ? "in_progress" : (status.toLowerCase() as "todo" | "done");
}

function bumpCounts(
  counts: TaskListResponse["counts"],
  from: TaskStatus | null,
  to: TaskStatus | null,
  deltaTotal = 0,
): TaskListResponse["counts"] {
  const next = { ...counts, all: Math.max(0, counts.all + deltaTotal) };
  if (from) next[statusCountKey(from)] = Math.max(0, next[statusCountKey(from)] - 1);
  if (to) next[statusCountKey(to)] = next[statusCountKey(to)] + 1;
  return next;
}

function taskMatchesFilter(task: Pick<Task, "title" | "description" | "status">, params: TaskListParams) {
  if (params.search) {
    const q = params.search.toLowerCase();
    const inTitle = task.title.toLowerCase().includes(q);
    const inDesc = task.description?.toLowerCase().includes(q);
    if (!inTitle && !inDesc) return false;
  }
  if (params.status && params.status !== "all") {
    const filterStatus =
      params.status === "in_progress" ? "IN_PROGRESS" : (params.status.toUpperCase() as TaskStatus);
    if (task.status !== filterStatus) return false;
  }
  return true;
}

function formToTaskPatch(data: Partial<TaskFormValues>): Partial<Task> {
  return {
    ...(data.title !== undefined && { title: data.title }),
    ...(data.description !== undefined && { description: data.description || null }),
    ...(data.status !== undefined && { status: data.status }),
    ...(data.priority !== undefined && { priority: data.priority }),
    ...(data.dueDate !== undefined && { dueDate: data.dueDate || null }),
  };
}

function withPageOrders(reordered: Task[], previous: Task[]): Task[] {
  const baseOrder = Math.min(...previous.map((t) => t.order));
  return reordered.map((t, i) => ({ ...t, order: baseOrder + i }));
}

function makeOptimisticTask(data: TaskFormValues, tempId: string): Task {
  const now = new Date().toISOString();
  return {
    id: tempId,
    title: data.title,
    description: data.description || null,
    status: data.status,
    priority: data.priority,
    dueDate: data.dueDate || null,
    order: 0,
    userId: "",
    createdAt: now,
    updatedAt: now,
  };
}

export function useTaskMutations() {
  const qc = useQueryClient();
  const toast = useToast();

  function snapshotTasks(): TaskSnapshot[] {
    return qc.getQueriesData<TaskListResponse>({ queryKey: ["tasks"] });
  }

  function patchTaskLists(
    updater: (old: TaskListResponse, params: TaskListParams) => TaskListResponse,
  ) {
    for (const [key, data] of snapshotTasks()) {
      if (!data || key[1] === "count") continue;
      const params = (key[1] ?? {}) as TaskListParams;
      qc.setQueryData(key, updater(data, params));
    }
  }

  function patchTaskCount(delta: number) {
    qc.setQueryData<number>(["tasks", "count"], (old) => Math.max(0, (old ?? 0) + delta));
  }

  function rollback(ctx?: { prev: TaskSnapshot[] }) {
    ctx?.prev.forEach(([key, data]) => qc.setQueryData(key, data));
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
    onMutate: async (data) => {
      const tempId = `optimistic-${crypto.randomUUID()}`;
      const prev = snapshotTasks();
      const optimistic = makeOptimisticTask(data, tempId);

      patchTaskLists((old, params) => {
        const onFirstPage = (params.page ?? 1) === 1;
        const visible = onFirstPage && taskMatchesFilter(optimistic, params);
        return {
          ...old,
          total: old.total + 1,
          counts: bumpCounts(old.counts, null, data.status, 1),
          data: visible ? [optimistic, ...old.data].slice(0, old.limit) : old.data,
        };
      });
      patchTaskCount(1);

      return { prev, tempId };
    },
    onSuccess: ({ task }, _data, ctx) => {
      patchTaskLists((old) => ({
        ...old,
        data: old.data.some((t) => t.id === ctx?.tempId)
          ? old.data.map((t) => (t.id === ctx?.tempId ? task : t))
          : old.data,
      }));
      qc.invalidateQueries({ queryKey: ["task", task.id, "activity"] });
      toast.show("Task created");
    },
    onError: (_err, _data, ctx) => {
      rollback(ctx);
      patchTaskCount(-1);
      toast.show("Failed to create task");
    },
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TaskFormValues> }) =>
      tasksApi.update(id, formToTaskPatch(data)),
    onMutate: async ({ id, data }) => {
      const prev = snapshotTasks();

      patchTaskLists((old, params) => {
        const current = old.data.find((t) => t.id === id);
        if (!current) {
          return {
            ...old,
            data: old.data.map((t) => (t.id === id ? { ...t, ...formToTaskPatch(data) } : t)),
          };
        }

        const next = { ...current, ...formToTaskPatch(data), updatedAt: new Date().toISOString() };
        let counts = old.counts;
        if (data.status && data.status !== current.status) {
          counts = bumpCounts(counts, current.status, data.status);
        }

        let nextData = old.data.map((t) => (t.id === id ? next : t));
        if (params.status && params.status !== "all" && !taskMatchesFilter(next, params)) {
          nextData = nextData.filter((t) => t.id !== id);
        }

        return { ...old, counts, data: nextData };
      });

      return { prev };
    },
    onSuccess: ({ task }) => {
      patchTaskLists((old, params) => {
        let nextData = old.data.map((t) => (t.id === task.id ? { ...t, ...task } : t));
        if (!old.data.some((t) => t.id === task.id) && taskMatchesFilter(task, params)) {
          nextData = [task, ...nextData];
        }
        if (params.status && params.status !== "all" && !taskMatchesFilter(task, params)) {
          nextData = nextData.filter((t) => t.id !== task.id);
        }
        return { ...old, data: nextData };
      });
      qc.invalidateQueries({ queryKey: ["task", task.id, "activity"] });
      toast.show("Changes saved");
    },
    onError: (_err, _vars, ctx) => {
      rollback(ctx);
      toast.show("Failed to save changes");
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onMutate: async (id) => {
      const prev = snapshotTasks();

      patchTaskLists((old) => {
        const task = old.data.find((t) => t.id === id);
        if (!task) return { ...old, data: old.data.filter((t) => t.id !== id) };
        return {
          ...old,
          total: Math.max(0, old.total - 1),
          counts: bumpCounts(old.counts, task.status, null, -1),
          data: old.data.filter((t) => t.id !== id),
        };
      });
      patchTaskCount(-1);

      return { prev };
    },
    onError: (_err, _id, ctx) => {
      rollback(ctx);
      patchTaskCount(1);
      toast.show("Failed to delete task");
    },
    onSuccess: () => toast.show("Task deleted"),
  });

  const toggleComplete = useMutation({
    mutationFn: (task: Task) =>
      tasksApi.update(task.id, { status: task.status === "DONE" ? "TODO" : "DONE" }),
    onMutate: async (task) => {
      const prev = snapshotTasks();
      const nextStatus: TaskStatus = task.status === "DONE" ? "TODO" : "DONE";

      patchTaskLists((old, params) => {
        const next = { ...task, status: nextStatus, updatedAt: new Date().toISOString() };
        let nextData = old.data.map((t) => (t.id === task.id ? next : t));
        if (params.status && params.status !== "all" && !taskMatchesFilter(next, params)) {
          nextData = nextData.filter((t) => t.id !== task.id);
        }
        return {
          ...old,
          counts: bumpCounts(old.counts, task.status, nextStatus),
          data: nextData,
        };
      });

      return { prev, task };
    },
    onSuccess: (_res, task) => {
      qc.invalidateQueries({ queryKey: ["task", task.id, "activity"] });
      toast.show(task.status === "DONE" ? "Marked active" : "Task completed");
    },
    onError: (_err, _task, ctx) => {
      rollback(ctx);
      toast.show("Failed to update task");
    },
  });

  const reorder = useMutation({
    mutationFn: async ({
      reordered,
      previous,
    }: {
      reordered: Task[];
      previous: Task[];
      queryKey: readonly unknown[];
      prevSnapshot?: TaskListResponse;
    }) => {
      const prevOrder = new Map(previous.map((t) => [t.id, t.order]));
      const changed = reordered.filter((t) => prevOrder.get(t.id) !== t.order);
      if (changed.length === 0) return;
      await Promise.all(changed.map((t) => tasksApi.update(t.id, { order: t.order })));
    },
    onError: (_err, { queryKey, prevSnapshot }) => {
      if (prevSnapshot) qc.setQueryData(queryKey, prevSnapshot);
      toast.show("Failed to save order");
    },
  });

  function reorderTasks(
    reordered: Task[],
    previous: Task[],
    queryKey: readonly unknown[],
    params: TaskListParams,
    opts?: ReorderOptions,
  ) {
    const prevIds = previous.map((t) => t.id).join(",");
    const nextIds = reordered.map((t) => t.id).join(",");
    if (prevIds === nextIds) return;

    const withOrders = withPageOrders(reordered, previous);
    const prevSnapshot = qc.getQueryData<TaskListResponse>(queryKey);

    if (prevSnapshot) {
      qc.setQueryData(queryKey, { ...prevSnapshot, data: withOrders });
    }

    if (opts?.switchToManual && opts.setSort) {
      const manualKey = ["tasks", { ...params, sort: "manual", order: "asc" as const }];
      const manualSnapshot = qc.getQueryData<TaskListResponse>(manualKey);
      qc.setQueryData(manualKey, {
        ...(manualSnapshot ?? prevSnapshot ?? {
          page: 1,
          limit: params.limit ?? 6,
          total: 0,
          counts: { all: 0, todo: 0, in_progress: 0, done: 0 },
        }),
        data: withOrders,
      });
      opts.setSort("manual");
    }

    reorder.mutate({ reordered: withOrders, previous, queryKey, prevSnapshot });
  }

  return { create, update, remove, toggleComplete, reorder, reorderTasks };
}
