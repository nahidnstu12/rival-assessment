"use client";

import { useToast } from "@/context/ToastContext";
import { adminApi } from "@/lib/api/admin";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { useAccess } from "@/hooks/useAccess";
import { useAuth } from "@/context/AuthContext";
import { avatarColor, initials } from "@/lib/utils";
import type { AdminUser } from "@/types/task";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";

function StatsCards({ users }: { users: AdminUser[] }) {
  const pending = users.filter((u) => u.status === "PENDING").length;
  const approved = users.filter((u) => u.status === "APPROVED").length;
  const rejected = users.filter((u) => u.status === "REJECTED").length;

  return (
    <div className="stats">
      {[
        { label: "Total users", value: users.length, sub: `${users.filter((u) => u.role === "ADMIN").length} admin` },
        { label: "Pending", value: pending, sub: "awaiting review" },
        { label: "Approved", value: approved, sub: "active members" },
        { label: "Rejected", value: rejected, sub: "declined" },
      ].map((s) => (
        <div key={s.label} className="stat-card">
          <div className="text-[12.5px] text-[var(--text-muted)] font-medium">{s.label}</div>
          <div className="mono text-[27px] font-semibold mt-2">{s.value}</div>
          <div className="text-xs text-[var(--text-subtle)] mt-1">{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

function UserRow({
  user,
  onApprove,
  onReject,
}: {
  user: AdminUser;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="task-row">
      <div className="flex items-center gap-2.5 min-w-[200px]">
        <div className="avatar" style={{ background: avatarColor(user.email) }}>
          {initials(user.name)}
        </div>
        <div>
          <div className="font-medium text-[13.5px]">{user.name}</div>
          <div className="mono text-[11.5px] text-[var(--text-subtle)]">{user.email}</div>
        </div>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
        {user.role === "ADMIN" && (
          <span className="badge b-high">
            <span className="dot" />
            Admin
          </span>
        )}
        <span className="mono text-xs text-[var(--text-muted)]">{user.taskCount} tasks</span>
        <span className={`status-tag st-${user.status.toLowerCase()} text-[11.5px] font-semibold px-2.5 py-0.5 rounded-full`}>
          {user.status.charAt(0) + user.status.slice(1).toLowerCase()}
        </span>
        {user.status === "PENDING" && (
          <div className="flex gap-1.5">
            <button type="button" className="btn btn-primary btn-sm" onClick={onApprove}>
              Approve
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onReject}>
              Reject
            </button>
          </div>
        )}
        {user.role !== "ADMIN" && user.status === "APPROVED" && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onReject}>
            Revoke
          </button>
        )}
        {user.status === "REJECTED" && (
          <button type="button" className="btn btn-primary btn-sm" onClick={onApprove}>
            Re-approve
          </button>
        )}
      </div>
    </div>
  );
}

export function UsersPage() {
  const { canFetchAdmin } = useAccess();
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const { data: users = [], isLoading, isError, refetch } = useAdminUsers();

  useEffect(() => {
    if (!canFetchAdmin) router.replace("/tasks");
  }, [canFetchAdmin, router]);

  const mutateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "APPROVED" | "REJECTED" }) =>
      adminApi.updateUserStatus(id, status),
    onSuccess: (_, { status }) => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.show(status === "APPROVED" ? "User approved" : "User updated");
    },
  });

  const pending = users.filter((u) => u.status === "PENDING");
  const active = users.filter((u) => u.status !== "PENDING");

  return (
    <AppShell
      topbar={{
        title: "Users",
        subtitle: "Approve access requests and manage members",
        showSearch: false,
        showNewTask: false,
      }}
    >
      {isLoading && <p className="text-[var(--text-muted)]">Loading…</p>}
      {isError && (
        <button type="button" className="btn btn-ghost" onClick={() => refetch()}>
          Retry
        </button>
      )}
      {!isLoading && !isError && (
        <>
          <StatsCards users={users} />
          <div className="flex items-center gap-2.5 mb-3.5">
            <h3 className="text-sm font-semibold">Pending requests</h3>
            {pending.length > 0 && (
              <span className="status-tag st-pending text-[11.5px] font-semibold px-2.5 py-0.5 rounded-full">
                {pending.length}
              </span>
            )}
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>
          {pending.length === 0 ? (
            <div className="empty py-9 mb-6">
              <h3 className="text-sm font-semibold">All caught up</h3>
              <p className="text-[var(--text-muted)] mb-0 text-sm">No access requests waiting.</p>
            </div>
          ) : (
            <div className="task-list mb-6">
              {pending.map((u) => (
                <UserRow
                  key={u.id}
                  user={u}
                  onApprove={() => mutateStatus.mutate({ id: u.id, status: "APPROVED" })}
                  onReject={() => {
                    if (confirm(`Reject ${u.name}?`)) mutateStatus.mutate({ id: u.id, status: "REJECTED" });
                  }}
                />
              ))}
            </div>
          )}
          <div className="flex items-center gap-2.5 mb-3.5">
            <h3 className="text-sm font-semibold">All members</h3>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>
          <div className="task-list">
            {active.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                onApprove={() => mutateStatus.mutate({ id: u.id, status: "APPROVED" })}
                onReject={() => {
                  const msg = u.status === "APPROVED" ? "Revoke access for" : "Reject";
                  if (confirm(`${msg} ${u.name}?`)) mutateStatus.mutate({ id: u.id, status: "REJECTED" });
                }}
              />
            ))}
          </div>
        </>
      )}
    </AppShell>
  );
}
