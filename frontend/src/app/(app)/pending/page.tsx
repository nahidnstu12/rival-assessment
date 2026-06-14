"use client";

import { AppShell } from "@/components/layout/AppShell";
import { PendingScreen } from "@/components/PendingScreen";

export default function PendingPage() {
  return (
    <AppShell
      restricted
      topbar={{
        title: "Awaiting approval",
        subtitle: "",
        showSearch: false,
        showNewTask: false,
      }}
    >
      <PendingScreen />
    </AppShell>
  );
}
