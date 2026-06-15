"use client";

import { useAuth } from "@/context/AuthContext";
import { useMemo } from "react";

/**
 * Single source of truth for what the current session may fetch or do.
 * Every React Query hook should derive `enabled` from these flags.
 */
export function useAccess() {
  const { user, isLoading, isApproved, isPending } = useAuth();

  return useMemo(() => {
    const isAuthenticated = !!user;
    const isRejected = user?.status === "REJECTED";
    const isAdminRole = user?.role === "ADMIN";
    const canFetchTasks = isApproved;
    const canFetchAdmin = isApproved && isAdminRole;

    return {
      user,
      isLoading,
      isAuthenticated,
      isApproved,
      isPending,
      isRejected,
      /** Role flag only — prefer canFetchAdmin for API gates. */
      isAdminRole,
      canFetchTasks,
      /** Admin all-tasks list (`scope=all`). */
      canFetchAdminTasks: canFetchAdmin,
      /** Admin user management endpoints. */
      canFetchAdmin,
    };
  }, [user, isLoading, isApproved, isPending]);
}
