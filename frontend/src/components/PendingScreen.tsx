"use client";

import { useAuth } from "@/context/AuthContext";

export function PendingScreen() {
  const { user } = useAuth();

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-60px)] p-6">
      <div className="max-w-md text-center">
        <div
          className="mx-auto size-16 rounded-[18px] grid place-items-center mb-5 text-3xl"
          style={{ background: "var(--amber-soft)", color: "var(--amber)" }}
        >
          ⏱
        </div>
        <h2 className="text-[21px] font-semibold tracking-tight">Your account is under review</h2>
        <p className="mt-2.5 text-sm text-[var(--text-muted)] leading-relaxed">
          Thanks for registering{user?.name ? `, ${user.name.split(" ")[0]}` : ""}. An admin needs to
          approve your account before you can create and manage tasks.
        </p>
        <div
          className="mt-6 text-left border rounded-[var(--radius)] overflow-hidden text-[13.5px]"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
            <span className="size-[22px] rounded-full grid place-items-center text-[11px] font-semibold text-white" style={{ background: "var(--green)" }}>✓</span>
            Account created
          </div>
          <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "var(--border)", background: "var(--amber-soft)", color: "var(--amber)" }}>
            <span className="size-[22px] rounded-full grid place-items-center text-[11px] font-semibold text-white" style={{ background: "var(--amber)" }}>2</span>
            Waiting for admin approval
          </div>
          <div className="flex items-center gap-3 px-4 py-3 text-[var(--text-subtle)]">
            <span className="size-[22px] rounded-full grid place-items-center text-[11px] font-semibold border" style={{ borderColor: "var(--border-strong)" }}>3</span>
            Start creating tasks
          </div>
        </div>
      </div>
    </div>
  );
}
