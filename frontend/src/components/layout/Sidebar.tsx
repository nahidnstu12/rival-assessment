"use client";

import { useAuth } from "@/context/AuthContext";
import { useAccess } from "@/hooks/useAccess";
import { usePendingCount } from "@/hooks/useAdminUsers";
import { useMyTaskCount } from "@/hooks/useTasks";
import { avatarColor, initials, roleLabel } from "@/lib/utils";
import { LayoutList, Shield, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "../theme/ThemeToggle";

type SidebarProps = {
  restricted?: boolean;
};

export function Sidebar({ restricted }: SidebarProps) {
  const { user, logout } = useAuth();
  const { canFetchTasks, canFetchAdmin } = useAccess();
  const pathname = usePathname();
  const { data: taskCount = 0 } = useMyTaskCount();
  const { data: pendingCount = 0 } = usePendingCount();

  if (!user) return null;

  const isActive = (path: string) => {
    if (path === "/tasks") return pathname === "/tasks";
    if (path === "/tasks/all") return pathname.startsWith("/tasks/all");
    return pathname.startsWith(path);
  };

  const navClass = (path: string) => `nav-item ${isActive(path) ? "active" : ""}`;

  return (
    <aside className="sidebar">
      <Link href="/" className="flex items-center gap-2.5 px-2 pb-[18px] font-semibold text-[15px] hover:opacity-80 transition-opacity">
        <div
          className="size-7 rounded-[7px] grid place-items-center font-bold text-sm text-white"
          style={{ background: "var(--accent)" }}
        >
          T
        </div>
        Taskflow
      </Link>

      <div className="text-[11px] uppercase tracking-wider text-[var(--text-subtle)] font-semibold px-2 py-3.5 pb-1.5">
        Workspace
      </div>
      <Link
        href="/tasks"
        className={navClass("/tasks") + (restricted ? "" : "")}
        aria-disabled={restricted}
        style={restricted ? { pointerEvents: "none", opacity: 0.5 } : undefined}
      >
        <LayoutList size={16} strokeWidth={2} className="nav-icon" />
        My tasks
        {canFetchTasks && !restricted && <span className="nav-count">{taskCount}</span>}
      </Link>

      {canFetchAdmin && !restricted && (
        <>
          <div className="text-[11px] uppercase tracking-wider text-[var(--text-subtle)] font-semibold px-2 pt-3.5 pb-1.5">
            Administration
          </div>
          <Link href="/users" className={navClass("/users")}>
            <Users size={16} strokeWidth={2} className="nav-icon" />
            Users
            <span className={`nav-count ${pendingCount > 0 ? "alert" : ""}`}>{pendingCount}</span>
          </Link>
          <Link href="/tasks/all" className={navClass("/tasks/all")}>
            <Shield size={16} strokeWidth={2} className="nav-icon" />
            All tasks
          </Link>
        </>
      )}

      <div className="flex-1" />

      <div className="border-t pt-3 mt-2" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="avatar" style={{ background: avatarColor(user.email) }}>
            {initials(user.name)}
          </div>
          <div>
            <div className="font-medium text-[13px] leading-tight">{user.name}</div>
            <div className="text-[11.5px] text-[var(--text-subtle)]">
              {roleLabel(user.role, user.status)}
            </div>
          </div>
        </div>
        <div className="flex gap-1.5 mt-2">
          <ThemeToggle />
          <button
            type="button"
            className="icon-btn flex-1 flex items-center justify-center gap-[7px] py-2 border rounded-[var(--radius-sm)] text-[var(--text-muted)] text-[12.5px] font-medium"
            style={{ borderColor: "var(--border)" }}
            onClick={() => logout()}
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
