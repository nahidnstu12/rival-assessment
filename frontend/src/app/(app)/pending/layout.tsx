import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Awaiting approval",
};

export default function PendingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
