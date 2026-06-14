import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { RootProviders } from "./root-providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Taskflow",
    template: "%s · Taskflow",
  },
  description:
    "A focused task workspace — organize work, track status, and order your day exactly how you want it.",
  applicationName: "Taskflow",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  );
}
