import type { Transaction } from "./types";

export type Period = "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "CUSTOM";

export interface DateRange {
  from: string;
  to: string;
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function dateKey(iso: string): string {
  const d = new Date(iso);
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function shortLabel(key: string): string {
  const [, m, d] = key.split("-");
  return `${+m}/${+d}`;
}

export function inPeriod(tx: Transaction, period: Period, range: DateRange): boolean {
  const d = new Date(tx.createdAt);
  const now = new Date();

  switch (period) {
    case "TODAY":
      return isSameDay(d, now);
    case "THIS_WEEK": {
      const day = (now.getDay() + 6) % 7;
      const monday = startOfDay(now);
      monday.setDate(now.getDate() - day);
      return d >= monday;
    }
    case "THIS_MONTH":
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    case "CUSTOM": {
      if (range.from) {
        const from = startOfDay(new Date(range.from));
        if (d < from) return false;
      }
      if (range.to) {
        const to = startOfDay(new Date(range.to));
        to.setDate(to.getDate() + 1);
        if (d >= to) return false;
      }
      return true;
    }
    default:
      return true;
  }
}

export const completed = (tx: Transaction) => tx.status === "COMPLETED";

export const DEFAULT_RANGE: DateRange = { from: "", to: "" };