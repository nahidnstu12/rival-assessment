"use client";

import { adminApi } from "@/lib/api/admin";
import { useQuery } from "@tanstack/react-query";

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => adminApi.users(),
    select: (d) => d.users,
  });
}

export function usePendingCount() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => adminApi.users(),
    select: (d) => d.users.filter((u) => u.status === "PENDING").length,
  });
}
