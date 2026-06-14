"use client";

import { useAuth } from "@/context/AuthContext";
import { avatarColor, initials, roleLabel } from "@/lib/utils";
import { LayoutList, LogOut } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function GuideHeader() {
  const { user, isLoading, isPending, logout } = useAuth();

  return (
    <header className="guide-header">
      <div className="guide-header-inner">
        <Link href="/" className="guide-brand">
          <div className="guide-logo">T</div>
          <span>Taskflow</span>
        </Link>

        <div className="guide-header-actions">
          {isLoading ? (
            <span className="guide-header-muted">Loading…</span>
          ) : user ? (
            <>
              <div className="guide-session">
                <div className="avatar !size-[28px] !text-[10px]" style={{ background: avatarColor(user.email) }}>
                  {initials(user.name)}
                </div>
                <div className="guide-session-text">
                  <span className="guide-session-name">{user.name}</span>
                  <span className="guide-session-role">{roleLabel(user.role, user.status)}</span>
                </div>
              </div>
              <span className="guide-header-sep" aria-hidden />
              <div className="guide-header-cluster">
                {!isPending ? (
                  <Link href="/tasks" className="btn btn-primary btn-sm">
                    <LayoutList size={14} strokeWidth={2.5} />
                    My tasks
                  </Link>
                ) : (
                  <Link href="/pending" className="btn btn-ghost btn-sm">
                    Pending
                  </Link>
                )}
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => logout()}>
                  <LogOut size={14} strokeWidth={2.5} />
                  Sign out
                </button>
                <ThemeToggle compact />
              </div>
            </>
          ) : (
            <div className="guide-header-cluster">
              <Link href="/login" className="btn btn-primary btn-sm">
                Sign in
              </Link>
              <ThemeToggle compact />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
