"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="icon-btn flex-1 flex items-center justify-center gap-[7px] py-2 border rounded-[var(--radius-sm)] text-[var(--text-muted)] text-[12.5px] font-medium"
      style={{ borderColor: "var(--border)" }}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? "☀" : "☾"} {isDark ? "Light" : "Dark"}
    </button>
  );
}
