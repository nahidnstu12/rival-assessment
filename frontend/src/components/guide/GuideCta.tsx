"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function GuideCta() {
  const { user, isPending } = useAuth();

  if (user) {
    return (
      <section className="guide-cta">
        <h2>{isPending ? "Account pending approval" : `Welcome back, ${user.name.split(" ")[0]}`}</h2>
        <p>
          {isPending
            ? "An admin must approve your account before you can manage tasks."
            : "Jump back into your workspace or review the steps above."}
        </p>
        <Link href={isPending ? "/pending" : "/tasks"} className="btn btn-primary">
          {isPending ? "View pending status" : "Go to My tasks"}
          <ArrowRight size={16} strokeWidth={2.5} />
        </Link>
      </section>
    );
  }

  return (
    <section className="guide-cta">
      <h2>Ready to explore?</h2>
      <p>Start with the admin account to see the full feature set.</p>
      <Link href="/login" className="btn btn-primary">
        Sign in to Taskflow
        <ArrowRight size={16} strokeWidth={2.5} />
      </Link>
    </section>
  );
}
