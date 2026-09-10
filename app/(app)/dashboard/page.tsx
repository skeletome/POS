"use client";

import {
  ArrowUpRight,
  Banknote,
  CalendarDays,
  CalendarRange,
  CreditCard,
  QrCode,
  ReceiptText,
  Settings2,
  ShoppingBag,
  TrendingUp,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { CustomRangePicker } from "@/components/date-range-picker";
import { PaymentPieChart, SalesAreaChart } from "@/components/dashboard-charts";
import { Button, Card, CardHeader, EmptyState } from "@/components/ui";
import { DashboardSkeleton } from "@/components/skeletons";
import { cn } from "@/lib/cn";
import {
  dateRangePresets,
  getRange,
  isWithin,
  type CustomRange,
  type DateRangeKey,
} from "@/lib/date-range";
import { formatRupiah } from "@/lib/format";
import { paymentMethodLabels } from "@/lib/dummy-data";
import { usePosStore } from "@/lib/use-pos-store";
import type { PaymentMethod } from "@/lib/types";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";

function StatCard({
  label,
  value,
  icon,
  hint,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  hint?: string;
}) {
  return (
    <Card className="flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-500">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-text-muted">{label}</p>
        <p className="mt-0.5 truncate text-2xl font-semibold tracking-tight text-text-primary">
          {value}
        </p>
        {hint ? <p className="mt-0.5 text-xs text-text-muted">{hint}</p> : null}
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const transactions = usePosStore((s) => s.transactions);
  const products = usePosStore((s) => s.products);
  const user = usePosStore((s) => s.user);
  const dataLoaded = usePosStore((s) => s.dataLoaded);
  const [rangeKey, setRangeKey] = useState<DateRangeKey>("today");
  const [customRange, setCustomRange] = useState<CustomRange | null>(null);

  const range = useMemo(
    () => getRange(rangeKey, new Date(), customRange ?? undefined),
    [rangeKey, customRange],
  );

  const completed = useMemo(
    () => transactions.filter((t) => t.status === "COMPLETED"),
    [transactions],
  );

  const filtered = useMemo(
    () => completed.filter((t) => isWithin(t.createdAt, range)),
    [completed, range],
  );

  const stats = useMemo(() => {
    const totalSales = filtered.reduce((s, t) => s + t.total, 0);
    const totalTransactions = filtered.length;
    const totalProductsSold = filtered.reduce(
      (s, t) => s + t.items.reduce((x, i) => x + i.quantity, 0),
      0,
    );
    const avg = totalTransactions ? Math.round(totalSales / totalTransactions) : 0;
    return { totalSales, totalTransactions, totalProductsSold, avg };
  }, [filtered]);

  const salesSeries = useMemo(() => {
    const map = new Map<number, number>();
    for (const t of filtered) {
      const d = new Date(t.createdAt);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      map.set(dayStart, (map.get(dayStart) ?? 0) + t.total);
    }
    const fmt = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" });
    const out: { label: string; total: number }[] = [];
    const cur = new Date(range.from);
    while (cur.getTime() <= range.to.getTime() && out.length < 120) {
      const key = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate()).getTime();
      out.push({ label: fmt.format(cur), total: map.get(key) ?? 0 });
      cur.setDate(cur.getDate() + 1);
    }
    return out;
  }, [filtered, range]);

  const topProducts = useMemo(() => {
    const m = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const t of filtered) {
      for (const it of t.items) {
        const cur = m.get(it.productName) ?? { name: it.productName, qty: 0, revenue: 0 };
        cur.qty += it.quantity;
        cur.revenue += it.subtotal;
        m.set(it.productName, cur);
      }
    }
    return [...m.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [filtered]);

  const topProductColumns: ColumnDef<{ name: string; qty: number; revenue: number }, unknown>[] = [
    {
      id: "name",
      accessorKey: "name",
      header: "Produk",
      cell: ({ row }) => {
        const product = products.find((x) => x.name === row.original.name);
        return (
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-50 text-sm">
              {product?.emoji ?? "🍽️"}
            </span>
            <span className="font-medium text-text-primary">{row.original.name}</span>
          </div>
        );
      },
    },
    {
      id: "qty",
      accessorKey: "qty",
      header: () => <div className="text-right">Quantity</div>,
      cell: ({ row }) => (
        <div className="text-right text-text-secondary">{row.original.qty}</div>
      ),
    },
    {
      id: "revenue",
      accessorKey: "revenue",
      header: () => <div className="text-right">Revenue</div>,
      cell: ({ row }) => (
        <div className="text-right font-medium text-text-primary">
          {formatRupiah(row.original.revenue)}
        </div>
      ),
    },
  ];

  const paymentSummary = useMemo(() => {
    const base: Record<PaymentMethod, { count: number; total: number }> = {
      CASH: { count: 0, total: 0 },
      BANK_TRANSFER: { count: 0, total: 0 },
      QRIS: { count: 0, total: 0 },
    };
    for (const t of filtered) {
      base[t.payment.method].count += 1;
      base[t.payment.method].total += t.total;
    }
    return base;
  }, [filtered]);

  const paymentSlices = useMemo(
    () =>
      (Object.keys(paymentSummary) as PaymentMethod[]).map((key) => ({
        name: key,
        value: paymentSummary[key].total,
      })),
    [paymentSummary],
  );

  const paymentMethods: { key: PaymentMethod; icon: React.ReactNode }[] = [
    { key: "CASH", icon: <Banknote size={16} /> },
    { key: "BANK_TRANSFER", icon: <CreditCard size={16} /> },
    { key: "QRIS", icon: <QrCode size={16} /> },
  ];

  return (
    <div className="space-y-5">
      {!dataLoaded ? <DashboardSkeleton /> : <>
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              Selamat datang, {user?.name}
            </h2>
            <p className="text-sm text-text-muted">Ringkasan performa toko Anda.</p>
          </div>
          <div className="flex flex-wrap gap-1.5 rounded-xl bg-slate-50 p-1.5 ring-1 ring-slate-100">
            {dateRangePresets.map((p) => {
              const active = rangeKey === p.key;
              const icons: Record<DateRangeKey, React.ReactNode> = {
                today: <CalendarDays size={14} />,
                thisWeek: <CalendarRange size={14} />,
                thisMonth: <CalendarIcon size={14} />,
                custom: <Settings2 size={14} />,
              };
              return (
                <button
                  key={p.key}
                  onClick={() => setRangeKey(p.key)}
                  aria-pressed={active}
                  className={cn(
                    "flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all duration-150 active:scale-95",
                    active
                      ? "bg-primary-500 text-white shadow-md ring-2 ring-primary-200"
                      : "bg-white text-text-primary shadow-sm hover:bg-slate-100",
                  )}
                >
                  {icons[p.key]}
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
        {rangeKey === "custom" ? (
          <div className="mt-3">
            <CustomRangePicker value={customRange} onChange={setCustomRange} />
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Sales"
          value={formatRupiah(stats.totalSales)}
          icon={<TrendingUp size={20} />}
        />
        <StatCard
          label="Total Transaksi"
          value={String(stats.totalTransactions)}
          icon={<ReceiptText size={20} />}
        />
        <StatCard
          label="Produk Terjual"
          value={String(stats.totalProductsSold)}
          icon={<ShoppingBag size={20} />}
        />
        <StatCard
          label="Rata-rata Transaksi"
          value={formatRupiah(stats.avg)}
          icon={<ArrowUpRight size={20} />}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Tren Penjualan"
            description="Total penjualan per hari pada periode terpilih"
          />
          {salesSeries.every((s) => s.total === 0) ? (
            <EmptyState
              icon={<TrendingUp size={20} />}
              title="Belum ada penjualan"
              description="Belum ada transaksi pada periode ini."
            />
          ) : (
            <div className="overflow-x-auto">
              <SalesAreaChart data={salesSeries} />
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Metode Pembayaran" description="Distribusi nilai transaksi per metode" />
          {paymentSlices.every((s) => s.value === 0) ? (
            <EmptyState
              icon={<QrCode size={20} />}
              title="Belum ada pembayaran"
              description="Belum ada transaksi pada periode ini."
            />
          ) : (
            <div>
              <PaymentPieChart data={paymentSlices} />
              <div className="mt-2 space-y-1 border-t border-border pt-3">
                {paymentMethods.map(({ key, icon }) => {
                  const p = paymentSummary[key];
                  return (
                    <div key={key} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-text-secondary">
                        {icon}
                        {paymentMethodLabels[key]}
                      </span>
                      <span className="font-medium text-text-primary">
                        {p.count} transaksi · {formatRupiah(p.total)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Produk Terlaris"
          description="Produk dengan jumlah penjualan tertinggi"
          action={
            <Link href="/reports">
              <Button variant="secondary" size="sm">
                Lihat laporan
              </Button>
            </Link>
          }
        />
        <DataTable
          columns={topProductColumns}
          data={topProducts}
          searchable={false}
          emptyTitle="Belum ada data"
          emptyDescription="Tidak ada produk terjual pada periode ini."
          emptyIcon={<ShoppingBag size={20} />}
        />
      </Card>
      </>}
    </div>
  );
}