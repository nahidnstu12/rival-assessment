import { api } from "@/lib/api";
import type { TaskActivityPage } from "@/types/activity";
import type { Task, TaskListParams, TaskListResponse } from "@/types/task";

function toQuery(params: TaskListParams) {
  const q = new URLSearchParams();
  if (params.scope === "all") q.set("scope", "all");
  if (params.status && params.status !== "all") q.set("status", params.status);
  if (params.search) q.set("search", params.search);
  if (params.sort) q.set("sort", params.sort);
  if (params.order) q.set("order", params.order);
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  const s = q.toString();
  return s ? `?${s}` : "";
}

export const tasksApi = {
  list: (params: TaskListParams = {}) =>
    api<TaskListResponse>(`/tasks${toQuery(params)}`),
  get: (id: string) => api<{ task: Task }>(`/tasks/${id}`),
  create: (data: Partial<Task>) =>
    api<{ task: Task }>("/tasks", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Task>) =>
    api<{ task: Task }>(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) => api<void>(`/tasks/${id}`, { method: "DELETE" }),
  activity: (id: string, params: { limit?: number; cursor?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.limit) q.set("limit", String(params.limit));
    if (params.cursor) q.set("cursor", params.cursor);
    const s = q.toString();
    return api<TaskActivityPage>(`/tasks/${id}/activity${s ? `?${s}` : ""}`);
  },
};
