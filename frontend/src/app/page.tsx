import { GuideCta } from "@/components/guide/GuideCta";
import { GuideHeader } from "@/components/guide/GuideHeader";
import type { Metadata } from "next";
import {
  CheckCircle2,
  GripVertical,
  LayoutList,
  Search,
  Shield,
  UserPlus,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Reviewer Guide",
  description: "Step-by-step guide for reviewing Taskflow — task management demo app.",
};

const DEMO_ACCOUNTS = [
  { role: "Admin", email: "sabir@rival.io", note: "Full access · approve users · all tasks" },
  { role: "Member", email: "tanvir@rival.io", note: "Approved user · own tasks only" },
  { role: "Member", email: "nadia@rival.io", note: "Approved user · own tasks only" },
  { role: "Pending", email: "pending@rival.io", note: "Blocked until admin approves" },
] as const;

const STEPS = [
  {
    icon: UserPlus,
    title: "Sign in or sign up",
    body: "Use a demo account below (password: demo1234) or create a new account. New signups land on a pending screen until an admin approves them.",
  },
  {
    icon: LayoutList,
    title: "Open My tasks",
    body: "After login you land on your task list. Each card shows status, priority, and due date. Click a row to edit; use the checkbox to mark done.",
  },
  {
    icon: CheckCircle2,
    title: "Create & edit tasks",
    body: "Hit New task or click any row to open the side sheet. Set title, description, status, priority, and due date with the inline calendar.",
  },
  {
    icon: Search,
    title: "Filter, search & sort",
    body: "Status pills and the sort dropdown live in the toolbar. Search and filters sync to the URL — refresh or share the link and state is preserved.",
  },
  {
    icon: GripVertical,
    title: "Drag to reorder",
    body: "On My tasks with Manual order selected, grab the ⠿ handle on the left and drag. Order saves instantly with optimistic updates.",
  },
  {
    icon: Shield,
    title: "Admin-only features",
    body: "Sign in as admin to view All tasks (every user) and the Users page to approve or reject pending accounts.",
  },
] as const;

export default function HomePage() {
  return (
    <div className="guide-page">
      <GuideHeader />

      <main className="guide-main">
        <section className="guide-hero">
          <p className="guide-eyebrow">Rival assessment · demo app</p>
          <h1 className="guide-title">Reviewer guide</h1>
          <p className="guide-lead">
            A quick walkthrough of Taskflow — full-stack task management with auth, URL-driven
            filters, drag-and-drop reorder, and admin approval flow.
          </p>
        </section>

        <section className="guide-section">
          <h2 className="guide-section-title">Demo accounts</h2>
          <p className="guide-section-desc">Password for all seeded users: <code>demo1234</code></p>
          <div className="guide-accounts">
            {DEMO_ACCOUNTS.map((account) => (
              <div key={account.email} className="guide-account-card">
                <span className="guide-account-role">{account.role}</span>
                <span className="guide-account-email">{account.email}</span>
                <span className="guide-account-note">{account.note}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="guide-section">
          <h2 className="guide-section-title">How to review — step by step</h2>
          <ol className="guide-steps">
            {STEPS.map(({ icon: Icon, title, body }, index) => (
              <li key={title} className="guide-step">
                <div className="guide-step-index">{index + 1}</div>
                <div className="guide-step-icon" aria-hidden>
                  <Icon size={18} strokeWidth={2} />
                </div>
                <div className="guide-step-body">
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <GuideCta />
      </main>

      <footer className="guide-footer">
        <span>Taskflow · Express + Next.js + PostgreSQL</span>
      </footer>
    </div>
  );
}
