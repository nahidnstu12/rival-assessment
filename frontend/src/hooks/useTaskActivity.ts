"use client";

import { tasksApi } from "@/lib/api/tasks";
import type { TaskActivityPage } from "@/types/activity";
import { useInfiniteQuery } from "@tanstack/react-query";

const PAGE_SIZE = 10;

export function useTaskActivity(taskId: string | undefined) {
  return useInfiniteQuery<TaskActivityPage>({
    queryKey: ["task", taskId, "activity"],
    queryFn: ({ pageParam }) =>
      tasksApi.activity(taskId!, {
        limit: PAGE_SIZE,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!taskId,
  });
}
