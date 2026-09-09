"use client";

import { cn } from "@/lib/cn";
import type { Bank } from "@/lib/types";

export function BankLogo({
  bank,
  className,
}: {
  bank: Pick<Bank, "name" | "logo">;
  className?: string;
}) {
  if (bank.logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={bank.logo}
        alt={bank.name}
        className={cn(
          "h-9 shrink-0 rounded-md border border-border object-contain object-center bg-white p-1",
          className,
        )}
      />
    );
  }
  return (
    <span
      className={cn(
        "flex h-9 shrink-0 items-center justify-center rounded-md bg-primary-50 px-2 text-xs font-bold text-primary-600",
        className,
      )}
    >
      {bank.name.slice(0, 3)}
    </span>
  );
}