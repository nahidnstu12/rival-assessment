"use client";

import { tasksApi } from "@/lib/api/tasks";
import type { TaskListParams } from "@/types/task";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTaskFilters } from "./useTaskFilters";

export function useTasks(scope: "mine" | "all" = "mine") {
  const defaultSort = scope === "all" ? "createdAt" : "manual";
  const { status, search, sort, order, page } = useTaskFilters(defaultSort);

  const params: TaskListParams = {
    scope,
    status: status !== "all" ? status : undefined,
    search: search || undefined,
    sort,
    order,
    page,
    limit: 6,
  };

  return useQuery({
    queryKey: ["tasks", params],
    queryFn: () => tasksApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useMyTaskCount() {
  return useQuery({
    queryKey: ["tasks", "count"],
    queryFn: () => tasksApi.list({ limit: 1, page: 1 }),
    select: (d) => d.total,
  });
}
