"use client";

import { adminApi } from "@/lib/api/admin";
import { useQuery } from "@tanstack/react-query";
import { useAccess } from "./useAccess";

export function useAdminUsers() {
  const { canFetchAdmin } = useAccess();

  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => adminApi.users(),
    select: (d) => d.users,
    enabled: canFetchAdmin,
  });
}

export function usePendingCount() {
  const { canFetchAdmin } = useAccess();

  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => adminApi.users(),
    select: (d) => d.users.filter((u) => u.status === "PENDING").length,
    enabled: canFetchAdmin,
  });
}
