"use client";

import { useMemo, useState } from "react";
import { Banknote, ReceiptText, ShoppingBag, TrendingUp, Wallet } from "lucide-react";
import { loadTransactions } from "@/lib/data";
import { completed, dateKey, DEFAULT_RANGE, inPeriod, shortLabel } from "@/lib/period";
import type { DateRange, Period } from "@/lib/period";
import { formatIDR, formatIDRCompact, formatNumber } from "@/lib/format";
import { PeriodFilter } from "@/components/dashboard/period-filter";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DonutChart, Progress, SalesAreaChart, type ChartPoint } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("THIS_MONTH");
  const [range, setRange] = useState<DateRange>(DEFAULT_RANGE);

  const total = useMemo(() => loadTransactions(), []);

  const filtered = useMemo(
    () => total.filter((tx) => completed(tx) && inPeriod(tx, period, range)),
    [total, period, range],
  );

  const stats = useMemo(() => {
    const sales = filtered.reduce((s, tx) => s + tx.total, 0);
    const items = filtered.reduce((s, tx) => s + tx.items.reduce((a, i) => a + i.quantity, 0), 0);
    const count = filtered.length;
    return {
      sales,
      count,
      items,
      avg: count ? sales / count : 0,
    };
  }, [filtered]);

  const trend = useMemo<ChartPoint[]>(() => {
    const byKey = new Map<string, number>();
    for (const tx of filtered) {
      const k = dateKey(tx.createdAt);
      byKey.set(k, (byKey.get(k) ?? 0) + tx.total);
    }
    return [...byKey.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => ({ label: shortLabel(k), value: v }));
  }, [filtered]);

  const topProducts = useMemo(() => {
    const agg = new Map<string, { name: string; emoji: string; quantity: number; revenue: number }>();
    for (const tx of filtered) {
      for (const item of tx.items) {
        const cur = agg.get(item.productId) ?? {
          name: item.name,
          emoji: item.emoji,
          quantity: 0,
          revenue: 0,
        };
        cur.quantity += item.quantity;
        cur.revenue += item.subtotal;
        agg.set(item.productId, cur);
      }
    }
    return [...agg.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [filtered]);

  const paymentSplit = useMemo(() => {
    const cash = filtered.filter((t) => t.paymentMethod === "CASH").reduce((s, t) => s + t.total, 0);
    const bank = filtered.filter((t) => t.paymentMethod === "BANK_TRANSFER").reduce((s, t) => s + t.total, 0);
    const qris = filtered.filter((t) => t.paymentMethod === "QRIS").reduce((s, t) => s + t.total, 0);
    return [
      { key: "cash", label: "Cash", value: cash, color: "#3b82f6" },
      { key: "bank", label: "Bank Transfer", value: bank, color: "#22c55e" },
      { key: "qris", label: "QRIS", value: qris, color: "#f59e0b" },
    ];
  }, [filtered]);

  const maxProduct = Math.max(...topProducts.map((p) => p.revenue), 1);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Ringkasan Penjualan</h2>
          <p className="text-xs text-gray-500">Pantau performa toko Anda</p>
        </div>
        <PeriodFilter period={period} onChange={setPeriod} range={range} onRangeChange={setRange} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Wallet} label="Total Sales" value={formatIDR(stats.sales)} sub={`${formatNumber(stats.count)} transaksi`} />
        <StatCard icon={ReceiptText} label="Total Transaksi" value={formatNumber(stats.count)} sub="Berstatus completed" />
        <StatCard icon={ShoppingBag} label="Produk Terjual" value={formatNumber(stats.items)} sub="Total item" />
        <StatCard icon={TrendingUp} label="Rata-rata Nilai Transaksi" value={formatIDR(stats.avg)} sub="Per transaksi" />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Tren Penjualan</CardTitle>
            <CardDescription>Total penjualan per hari pada periode terpilih</CardDescription>
          </CardHeader>
          {trend.length > 0 ? (
            <SalesAreaChart data={trend} />
          ) : (
            <EmptyInline text="Belum ada penjualan pada periode ini." />
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metode Pembayaran</CardTitle>
            <CardDescription>Distribusi total berdasarkan metode</CardDescription>
          </CardHeader>
          <DonutChart segments={paymentSplit} />
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Produk Terlaris</CardTitle>
          <CardDescription>Berdasarkan revenue pada periode terpilih</CardDescription>
        </CardHeader>
        {topProducts.length > 0 ? (
          <div className="space-y-4">
            {topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-4">
                <span className="w-4 text-sm font-medium text-gray-400">{i + 1}</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-lg">
                  {p.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <p className="truncate text-sm font-medium text-gray-900">{p.name}</p>
                    <p className="shrink-0 text-sm font-semibold text-gray-900">
                      {formatIDRCompact(p.revenue)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={(p.revenue / maxProduct) * 100} />
                    <span className="shrink-0 text-xs text-gray-500">{formatNumber(p.quantity)} terjual</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyInline text="Belum ada data produk terlaris." />
        )}
      </Card>

      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
        <Badge variant="info" className="mb-1">
          Demo frontend
        </Badge>
        Data pada halaman ini menggunakan data dummy. Integrasi backend (Supabase + TanStack Query)
        akan menyusul di tahap berikutnya.
      </div>
    </div>
  );
}

function EmptyInline({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <Banknote className="h-8 w-8 text-slate-300" />
      <p className="text-sm text-gray-400">{text}</p>
    </div>
  );
}