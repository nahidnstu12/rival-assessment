"use client";

import { tasksApi } from "@/lib/api/tasks";
import type { TaskListParams } from "@/types/task";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useAccess } from "./useAccess";
import { useTaskFilters } from "./useTaskFilters";

export function useTasks(scope: "mine" | "all" = "mine") {
  const { canFetchTasks, canFetchAdminTasks } = useAccess();
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

  const queryKey = ["tasks", params] as const;
  const enabled = scope === "all" ? canFetchAdminTasks : canFetchTasks;

  return {
    ...useQuery({
      queryKey,
      queryFn: () => tasksApi.list(params),
      placeholderData: keepPreviousData,
      enabled,
    }),
    queryKey,
    params,
    enabled,
  };
}

export function useMyTaskCount() {
  const { canFetchTasks } = useAccess();

  return useQuery({
    queryKey: ["tasks", "count"],
    queryFn: () => tasksApi.list({ limit: 1, page: 1 }),
    select: (d) => d.total,
    enabled: canFetchTasks,
  });
}
