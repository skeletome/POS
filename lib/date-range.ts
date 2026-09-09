export type DateRangeKey = "today" | "thisWeek" | "thisMonth" | "custom";

export interface DateRange {
  key: DateRangeKey;
  from: Date;
  to: Date;
}

export interface CustomRange {
  from: string;
  to: string;
}

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const endOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

export function getRange(
  key: DateRangeKey,
  now = new Date(),
  custom?: CustomRange,
): DateRange {
  const today = startOfDay(now);
  if (key === "today") return { key, from: today, to: endOfDay(now) };

  if (key === "thisWeek") {
    const day = (now.getDay() + 6) % 7;
    const from = new Date(today);
    from.setDate(from.getDate() - day);
    return { key, from, to: endOfDay(now) };
  }

  if (key === "thisMonth") {
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    return { key, from, to: endOfDay(now) };
  }

  if (custom?.from && custom?.to) {
    const from = startOfDay(new Date(`${custom.from}T00:00:00`));
    const to = endOfDay(new Date(`${custom.to}T00:00:00`));
    if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime())) {
      return { key, from, to: to.getTime() >= from.getTime() ? to : from };
    }
  }

  return { key, from: today, to: endOfDay(now) };
}

export function isWithin(iso: string, range: DateRange): boolean {
  const t = new Date(iso).getTime();
  return t >= range.from.getTime() && t <= range.to.getTime();
}

export const dateRangePresets: { key: DateRangeKey; label: string }[] = [
  { key: "today", label: "Hari Ini" },
  { key: "thisWeek", label: "Minggu Ini" },
  { key: "thisMonth", label: "Bulan Ini" },
  { key: "custom", label: "Custom" },
];