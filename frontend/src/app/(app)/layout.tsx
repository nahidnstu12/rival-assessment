"use client";

import { useAuth } from "@/context/AuthContext";
import { useAccess } from "@/hooks/useAccess";
import { useEventStream } from "@/hooks/useEventStream";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const { user, isLoading, isPending, isRejected } = useAccess();
  const router = useRouter();
  const pathname = usePathname();

  // Single SSE connection for this tab; opens once user is loaded,
  // closes on logout (when user → null).
  useEventStream();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (isRejected) {
      logout();
      return;
    }
    if (isPending && pathname !== "/pending") {
      router.replace("/pending");
    }
    if (!isPending && pathname === "/pending") {
      router.replace("/tasks");
    }
  }, [user, isLoading, isPending, isRejected, logout, router, pathname]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen grid place-items-center text-sm text-[var(--text-muted)]">
        Loading…
      </div>
    );
  }

  return children;
}
