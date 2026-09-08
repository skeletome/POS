import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  subTone = "default",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  subTone?: "default" | "success" | "danger";
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">{value}</p>
      {sub && (
        <p
          className={cn(
            "mt-1 text-xs",
            subTone === "success" ? "text-green-600" : subTone === "danger" ? "text-red-600" : "text-gray-500",
          )}
        >
          {sub}
        </p>
      )}
    </div>
  );
}