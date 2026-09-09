"use client";

import { BarChart3, Download, Package, ReceiptText, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge, Button, Card, CardHeader, EmptyState, Tabs } from "@/components/ui";
import { ReportsSkeleton } from "@/components/skeletons";
import { DateRangePickerInline } from "@/components/date-range-picker";
import { cn } from "@/lib/cn";
import { dateRangePresets, getRange, isWithin, type DateRangeKey } from "@/lib/date-range";
import { formatDate, formatRupiah } from "@/lib/format";
import { paymentMethodLabels } from "@/lib/dummy-data";
import { usePosStore } from "@/lib/use-pos-store";
import { useReports } from "@/lib/api/hooks";
import { exportReportExcel } from "@/lib/report-export";
import type { PaymentMethod } from "@/lib/types";

type ReportTab = "sales" | "products" | "payments";

export default function ReportsPage() {
  const transactions = usePosStore((s) => s.transactions);
  const products = usePosStore((s) => s.products);
  const dataLoaded = usePosStore((s) => s.dataLoaded);
  const [tab, setTab] = useState<ReportTab>("sales");
  const [rangeKey, setRangeKey] = useState<DateRangeKey>("thisMonth");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const range = useMemo(() => {
    if (rangeKey === "custom") {
      return {
        key: "custom" as const,
        from: customFrom ? new Date(customFrom) : new Date(0),
        to: customTo ? new Date(customTo + "T23:59:59") : new Date(),
      };
    }
    return getRange(rangeKey);
  }, [rangeKey, customFrom, customTo]);

  const completed = useMemo(
    () => transactions.filter((t) => t.status === "COMPLETED"),
    [transactions],
  );

  const filtered = useMemo(
    () =>
      completed.filter((t) => {
        const time = new Date(t.createdAt).getTime();
        return time >= range.from.getTime() && time <= range.to.getTime();
      }),
    [completed, range],
  );

  const salesStats = useMemo(() => {
    const totalSales = filtered.reduce((s, t) => s + t.total, 0);
    const totalTx = filtered.length;
    const itemsSold = filtered.reduce(
      (s, t) => s + t.items.reduce((x, i) => x + i.quantity, 0),
      0,
    );
    const avg = totalTx ? Math.round(totalSales / totalTx) : 0;
    return { totalSales, totalTx, itemsSold, avg };
  }, [filtered]);

  const reportsQuery = useReports(range.from, range.to);
  const serverTotals = reportsQuery.data?.totals;
  const totalSales = serverTotals?.totalSales ?? salesStats.totalSales;
  const totalTx = serverTotals?.totalTransactions ?? salesStats.totalTx;
  const itemsSold = serverTotals?.totalItemsSold ?? salesStats.itemsSold;
  const avg = serverTotals?.averageTransactionValue ?? salesStats.avg;

  const productReport = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const t of filtered) {
      for (const it of t.items) {
        const cur = map.get(it.productName) ?? { name: it.productName, qty: 0, revenue: 0 };
        cur.qty += it.quantity;
        cur.revenue += it.subtotal;
        map.set(it.productName, cur);
      }
    }
    return [...map.values()].sort((a, b) => b.qty - a.qty);
  }, [filtered]);

  const paymentReport = useMemo(() => {
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

  const [productSort, setProductSort] = useState<"qty" | "revenue">("qty");
  const sortedProducts = useMemo(() => {
    return [...productReport].sort((a, b) =>
      productSort === "qty" ? b.qty - a.qty : b.revenue - a.revenue,
    );
  }, [productReport, productSort]);

  const handleExport = () => {
    const prefix = `${formatDate(range.from.toISOString())}_${formatDate(range.to.toISOString())}`;
    const tabLabel = tab === "sales" ? "sales" : tab === "products" ? "produk" : "pembayaran";
    exportReportExcel(tab, filtered, sortedProducts, paymentReport, `laporan-${tabLabel}-${prefix}`);
  };

  return (
    <div className="space-y-5">
      {!dataLoaded ? <ReportsSkeleton /> : <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Laporan</h2>
          <p className="text-sm text-text-muted">Sales, produk, dan pembayaran berdasarkan periode.</p>
        </div>
        <Button variant="secondary" onClick={handleExport}>
          <Download size={16} />
          Export Excel
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          tabs={[
            { value: "sales" as const, label: "Sales" },
            { value: "products" as const, label: "Produk" },
            { value: "payments" as const, label: "Pembayaran" },
          ]}
          value={tab}
          onChange={setTab}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Badge>{dateRangePresets.find((p) => p.key === rangeKey)?.label}</Badge>
          <Tabs
            tabs={dateRangePresets.map((p) => ({ value: p.key, label: p.label }))}
            value={rangeKey}
            onChange={(k) => setRangeKey(k)}
          />
          {rangeKey === "custom" ? (
            <DateRangePickerInline
              value={customFrom && customTo ? { from: customFrom, to: customTo } : null}
              onChange={(r) => { setCustomFrom(r.from); setCustomTo(r.to); }}
            />
          ) : null}
        </div>
      </div>

      {tab === "sales" ? (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <ReportCard icon={<BarChart3 size={18} />} label="Total Sales" value={formatRupiah(totalSales)} />
            <ReportCard icon={<ReceiptText size={18} />} label="Total Transaksi" value={String(totalTx)} />
            <ReportCard icon={<Package size={18} />} label="Produk Terjual" value={String(itemsSold)} />
            <ReportCard icon={<Wallet size={18} />} label="Rata-rata Transaksi" value={formatRupiah(avg)} />
          </div>
          <Card>
            <CardHeader title="Ringkasan Sales" description="Hanya transaksi COMPLETED yang dihitung." />
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Total transaksi completed</span>
                <span className="font-semibold text-text-primary">{totalTx}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Total pendapatan</span>
                <span className="font-semibold text-text-primary">{formatRupiah(totalSales)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Jumlah produk terjual</span>
                <span className="font-semibold text-text-primary">{itemsSold}</span>
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      {tab === "products" ? (
        <Card>
          <CardHeader
            title="Laporan Produk"
            description="Jumlah terjual dan pendapatan per produk dari transaksi completed."
            action={
              <div className="flex items-center gap-1 rounded-lg bg-slate-50 p-1">
                {(["qty", "revenue"] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => setProductSort(k)}
                    className={cn(
                      "cursor-pointer rounded-md px-3 py-1 text-xs font-medium transition-colors",
                      productSort === k ? "bg-primary-500 text-white" : "text-text-primary",
                    )}
                  >
                    {k === "qty" ? "Qty" : "Revenue"}
                  </button>
                ))}
              </div>
            }
          />
          {sortedProducts.length === 0 ? (
            <EmptyState
              icon={<Package size={20} />}
              title="Belum ada data"
              description="Belum ada penjualan pada periode ini."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-text-muted">
                    <th className="pb-2 pr-4 font-medium">Produk</th>
                    <th className="pb-2 pr-4 text-right font-medium">Quantity Terjual</th>
                    <th className="pb-2 text-right font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedProducts.map((p) => {
                    const product = products.find((x) => x.name === p.name);
                    return (
                      <tr key={p.name} className="border-b border-border-light last:border-0">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-50 text-sm">
                              {product?.emoji ?? "🍽️"}
                            </span>
                            <span className="font-medium text-text-primary">{p.name}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-right text-text-secondary">{p.qty}</td>
                        <td className="py-3 text-right font-semibold text-text-primary">
                          {formatRupiah(p.revenue)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : null}

      {tab === "payments" ? (
        <Card>
          <CardHeader title="Laporan Pembayaran" description="Distribusi transaksi dan nominal per metode pembayaran." />
          <div className="space-y-4">
            {(["CASH", "BANK_TRANSFER", "QRIS"] as PaymentMethod[]).map((m) => (
              <div
                key={m}
                className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-text-primary">{paymentMethodLabels[m]}</p>
                  <p className="text-xs text-text-muted">{paymentReport[m].count} transaksi</p>
                </div>
                <p className="text-base font-semibold text-text-primary">
                  {formatRupiah(paymentReport[m].total)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
      </>}
    </div>
  );
}

function ReportCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
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
      </div>
    </Card>
  );
}