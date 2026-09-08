import { cn } from "@/lib/cn";

export type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral";

const variants: Record<BadgeVariant, string> = {
  success: "bg-green-100 text-green-800",
  warning: "bg-amber-100 text-amber-800",
  error: "bg-red-100 text-red-800",
  info: "bg-blue-100 text-blue-800",
  neutral: "bg-slate-100 text-slate-600",
};

export function Badge({
  variant = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export function statusBadgeVariant(status: string): BadgeVariant {
  if (status === "COMPLETED") return "success";
  if (status === "PENDING") return "warning";
  if (status === "CANCELLED") return "error";
  return "neutral";
}