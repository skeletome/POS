"use client";

import { cn } from "@/lib/cn";

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex shrink-0 select-none items-center gap-2 whitespace-nowrap text-sm text-text-primary"
    >
      <span
        aria-hidden
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 transition-colors duration-150",
          checked ? "bg-primary-500" : "bg-border-strong",
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-150",
            checked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </span>
      {label ? <span className="shrink-0">{label}</span> : null}
    </button>
  );
}