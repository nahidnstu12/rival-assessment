"use client";

import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isPending, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading || !user) return;
    if (user.status === "REJECTED") {
      logout();
      return;
    }
    if (isPending && pathname !== "/pending") {
      router.replace("/pending");
    }
    if (!isPending && pathname === "/pending") {
      router.replace("/tasks");
    }
  }, [user, isLoading, isPending, logout, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center text-sm text-[var(--text-muted)]">
        Loading…
      </div>
    );
  }

  return children;
}
