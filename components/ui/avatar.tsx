import { cn } from "@/lib/cn";

const tones: Record<string, string> = {
  blue: "bg-blue-100 text-blue-700",
  green: "bg-green-100 text-green-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
  slate: "bg-slate-200 text-slate-700",
};

export function Avatar({
  name,
  className,
  tone = "blue",
}: {
  name: string;
  className?: string;
  tone?: string;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
        tones[tone] ?? tones.blue,
        className,
      )}
    >
      {initials}
    </div>
  );
}