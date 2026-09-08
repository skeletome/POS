"use client";

import { cn } from "@/lib/cn";

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 text-sm text-gray-900 outline-none transition-colors duration-150 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:bg-slate-50",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}