"use client";

import { cn } from "@/lib/cn";

export interface TabItem {
  value: string;
  label: string;
}

export function Tabs({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex items-center gap-1 rounded-lg bg-gray-100 p-1", className)}>
      {items.map((item) => (
        <button
          key={item.value}
          onClick={() => onChange(item.value)}
          className={cn(
            "rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors duration-150",
            value === item.value
              ? "bg-blue-500 text-white"
              : "text-gray-700 hover:bg-white/60 hover:text-gray-900",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}