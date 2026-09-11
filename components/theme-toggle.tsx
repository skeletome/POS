"use client";

import { cn } from "@/lib/cn";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "inline-flex w-full select-none items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm text-text-primary transition-colors duration-150 hover:bg-muted",
        className,
      )}
    >
      <span className="flex items-center gap-2">
        {isDark ? <Moon size={14} /> : <Sun size={14} />}
        <span>{isDark ? "Mode Gelap" : "Mode Terang"}</span>
      </span>
      <span
        aria-hidden
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 transition-colors duration-150",
          isDark ? "bg-primary-500" : "bg-border-strong",
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-150",
            isDark ? "translate-x-5" : "translate-x-0",
          )}
        />
      </span>
    </button>
  );
}