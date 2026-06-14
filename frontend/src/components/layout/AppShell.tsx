"use client";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

type AppShellProps = {
  children: React.ReactNode;
  restricted?: boolean;
  topbar: React.ComponentProps<typeof Topbar>;
};

export function AppShell({ children, restricted, topbar }: AppShellProps) {
  return (
    <div className="app-shell">
      <Sidebar restricted={restricted} />
      <div className="main-scroll">
        <Topbar {...topbar} />
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
