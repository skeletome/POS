"use client";

import { formatIDRCompact } from "@/lib/format";
import { cn } from "@/lib/cn";

export interface ChartPoint {
  label: string;
  value: number;
}

export function SalesAreaChart({
  data,
  height = 220,
  formatValue = (v: number) => formatIDRCompact(v),
}: {
  data: ChartPoint[];
  height?: number;
  formatValue?: (v: number) => string;
}) {
  if (data.length === 0) return null;
  const W = 100;
  const H = 40;
  const PAD = 4;
  const max = Math.max(...data.map((d) => d.value), 1);
  const stepX = (W - PAD * 2) / (data.length - 1 || 1);
  const points = data.map((d, i) => ({
    x: PAD + i * stepX,
    y: H - PAD - ((d.value / max) * (H - PAD * 2)),
    ...d,
  }));
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  const area = `${line} L${(PAD + (data.length - 1) * stepX).toFixed(2)},${H - PAD} L${PAD},${H - PAD} Z`;

  const activeIdx = data.length - 1;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height }} className="w-full">
        <defs>
          <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={PAD} x2={W - PAD} y1={H * f} y2={H * f} stroke="#eef2f7" strokeWidth="0.2" />
        ))}
        <path d={area} fill="url(#area-grad)" />
        <path d={line} fill="none" stroke="#3b82f6" strokeWidth="0.4" />
        {points.slice(-1).map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="0.9" fill="#2563eb" stroke="#fff" strokeWidth="0.3" />
          </g>
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-[11px] text-gray-400">
        {points.map((d, i) => (
          <span key={i} className={i === activeIdx ? "font-medium text-gray-600" : ""}>
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export interface DonutSegment {
  key: string;
  label: string;
  value: number;
  color: string;
}

export function DonutChart({
  segments,
  size = 140,
}: {
  segments: DonutSegment[];
  size?: number;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef2f7" strokeWidth={stroke} />
        {segments.map((seg) => {
          const len = (seg.value / total) * c;
          const dash = `${len} ${c - len}`;
          const el = (
            <circle
              key={seg.key}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={stroke}
              strokeDasharray={dash}
              strokeDashoffset={-offset}
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="flex min-w-0 flex-col gap-2.5">
        {segments.map((seg) => (
          <div key={seg.key} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="truncate text-gray-500">{seg.label}</span>
            <span className="ml-auto font-medium text-gray-900">
              {seg.value ? formatIDRCompact(seg.value) : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Progress({ value, color = "bg-blue-500" }: { value: number; color?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
      <div
        className={cn("h-full rounded-full transition-all duration-150", color)}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}
