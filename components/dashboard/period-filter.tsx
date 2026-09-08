"use client";

import { CalendarRange } from "lucide-react";

export type Period = "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "CUSTOM";

const mountedOf = (p: Period) => (p === "THIS_WEEK" ? "Minggu ini" : p === "THIS_MONTH" ? "Bulan ini" : p === "TODAY" ? "Hari ini" : "Kustom");

export function PeriodFilter({
  period,
  onChange,
  range,
  onRangeChange,
}: {
  period: Period;
  onChange: (p: Period) => void;
  range: { from: string; to: string };
  onRangeChange: (r: { from: string; to: string }) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="inline-flex items-center gap-1 rounded-lg bg-gray-100 p-1">
        {(["TODAY", "THIS_WEEK", "THIS_MONTH", "CUSTOM"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={
              period === p
                ? "rounded-md bg-blue-500 px-3 py-1.5 text-sm font-medium text-white transition-colors"
                : "rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-white/60"
            }
          >
            {mountedOf(p)}
          </button>
        ))}
      </div>
      {period === "CUSTOM" && (
        <div className="flex items-center gap-2">
          <CalendarRange className="h-4 w-4 text-gray-400" />
          <input
            type="date"
            value={range.from}
            onChange={(e) => onRangeChange({ ...range, from: e.target.value })}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500"
          />
          <span className="text-gray-400">s/d</span>
          <input
            type="date"
            value={range.to}
            onChange={(e) => onRangeChange({ ...range, to: e.target.value })}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500"
          />
        </div>
      )}
    </div>
  );
}