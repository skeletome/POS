"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatRupiah } from "@/lib/format";
import type { PaymentMethod } from "@/lib/types";

export interface SalesPoint {
  label: string;
  total: number;
}

const salesChartConfig = {
  total: { label: "Penjualan", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function SalesAreaChart({ data }: { data: SalesPoint[] }) {
  return (
    <ChartContainer config={salesChartConfig} className="aspect-auto h-56 w-full">
      <AreaChart data={data} margin={{ left: 4, right: 4 }}>
        <defs>
          <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={18}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={70}
          tickFormatter={(v: number) =>
            v >= 1000000 ? `${(v / 1000000).toFixed(1)}jt` : `Rp${v.toLocaleString("id-ID")}`
          }
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent formatter={(value) => formatRupiah(Number(value))} />} />
        <Area
          dataKey="total"
          type="natural"
          fill="url(#fillSales)"
          stroke="var(--chart-1)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}

export interface PaymentSlice {
  name: PaymentMethod;
  value: number;
}

const paymentChartConfig = {
  CASH: { label: "Cash", color: "var(--chart-2)" },
  BANK_TRANSFER: { label: "Bank Transfer", color: "var(--chart-1)" },
  QRIS: { label: "QRIS", color: "var(--chart-3)" },
} satisfies ChartConfig;

export function PaymentPieChart({ data }: { data: PaymentSlice[] }) {
  const withFill = data.map((d) => ({
    ...d,
    fill: paymentChartConfig[d.name].color,
  }));
  return (
    <ChartContainer
      config={paymentChartConfig}
      className="aspect-auto h-52 w-full"
    >
      <PieChart margin={{ top: 4, bottom: 4 }}>
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel formatter={(value) => formatRupiah(Number(value))} />} />
        <Pie
          data={withFill}
          dataKey="value"
          nameKey="name"
          innerRadius={56}
          outerRadius={80}
          paddingAngle={3}
        />
        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
      </PieChart>
    </ChartContainer>
  );
}