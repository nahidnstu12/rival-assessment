"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

type ThemeToggleProps = {
  compact?: boolean;
};

export function ThemeToggle({ compact }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return compact ? <span className="icon-action" aria-hidden /> : null;

  const isDark = theme === "dark";
  const toggle = () => setTheme(isDark ? "light" : "dark");

  if (compact) {
    return (
      <button
        type="button"
        className="icon-action"
        onClick={toggle}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
      </button>
    );
  }

  return (
    <button
      type="button"
      className="icon-btn flex-1 flex items-center justify-center gap-[7px] py-2 border rounded-[var(--radius-sm)] text-[var(--text-muted)] text-[12.5px] font-medium"
      style={{ borderColor: "var(--border)" }}
      onClick={toggle}
    >
      {isDark ? "☀" : "☾"} {isDark ? "Light" : "Dark"}
    </button>
  );
}
