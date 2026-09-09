"use client";

import { CalendarRange, ReceiptText, Search } from "lucide-react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Button, Card, CardHeader, EmptyState, Input, Select, StatusBadge, Tabs } from "@/components/ui";
import { TransactionsSkeleton } from "@/components/skeletons";
import { cn } from "@/lib/cn";
import { dateRangePresets, getRange, isWithin, type DateRangeKey } from "@/lib/date-range";
import { formatDateTime, formatRupiah } from "@/lib/format";
import { orderTypeLabels, paymentMethodLabels } from "@/lib/dummy-data";
import { usePosStore } from "@/lib/use-pos-store";
import type { OrderType, PaymentMethod, TransactionStatus } from "@/lib/types";

export default function TransactionsPage() {
  const transactions = usePosStore((s) => s.transactions);
  const cashiers = usePosStore((s) => s.cashiers);
  const dataLoaded = usePosStore((s) => s.dataLoaded);

  const [query, setQuery] = useState("");
  const [rangeKey, setRangeKey] = useState<DateRangeKey>("thisMonth");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [payment, setPayment] = useState<"ALL" | PaymentMethod>("ALL");
  const [orderType, setOrderType] = useState<"ALL" | OrderType>("ALL");
  const [status, setStatus] = useState<"ALL" | TransactionStatus>("ALL");
  const [cashier, setCashier] = useState<"ALL" | string>("ALL");

  const filtered = useMemo(() => {
    const range =
      rangeKey === "custom"
        ? {
            key: "custom" as const,
            from: customFrom ? new Date(customFrom) : new Date(0),
            to: customTo ? new Date(customTo + "T23:59:59") : new Date(),
          }
        : getRange(rangeKey);

    const q = query.trim().toLowerCase();
    return transactions.filter((t) => {
      if (q && !t.id.toLowerCase().includes(q)) return false;
      if (rangeKey !== "custom" && !isWithin(t.createdAt, range)) return false;
      if (rangeKey === "custom") {
        const time = new Date(t.createdAt).getTime();
        if (time < range.from.getTime() || time > range.to.getTime()) return false;
      }
      if (payment !== "ALL" && t.payment.method !== payment) return false;
      if (orderType !== "ALL" && t.orderType !== orderType) return false;
      if (status !== "ALL" && t.status !== status) return false;
      if (cashier !== "ALL" && t.cashier !== cashier) return false;
      return true;
    });
  }, [transactions, query, rangeKey, customFrom, customTo, payment, orderType, status, cashier]);

  return (
    <div className="space-y-5">
      {!dataLoaded ? <TransactionsSkeleton /> : <>
      <div>
        <h2 className="text-xl font-semibold text-text-primary">Riwayat Transaksi</h2>
        <p className="text-sm text-text-muted">Cari dan saring seluruh transaksi toko.</p>
      </div>

      <Card>
        <CardHeader
          title="Filter"
          description="Saring riwayat berdasarkan periode, pembayaran, dan status"
        />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <Input
              className="pl-9"
              placeholder="Cari ID transaksi…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Select
            value={payment}
            onChange={(e) => setPayment(e.target.value as "ALL" | PaymentMethod)}
          >
            <option value="ALL">Semua Pembayaran</option>
            <option value="CASH">Cash</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="QRIS">QRIS</option>
          </Select>
          <Select
            value={orderType}
            onChange={(e) => setOrderType(e.target.value as "ALL" | OrderType)}
          >
            <option value="ALL">Semua Tipe Order</option>
            <option value="DINE_IN">Dine-in</option>
            <option value="TAKEAWAY">Takeaway</option>
          </Select>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as "ALL" | TransactionStatus)}
          >
            <option value="ALL">Semua Status</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
          <Select
            value={cashier}
            onChange={(e) => setCashier(e.target.value)}
          >
            <option value="ALL">Semua Kasir</option>
            {cashiers.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Tabs
            tabs={dateRangePresets.map((p) => ({ value: p.key, label: p.label }))}
            value={rangeKey}
            onChange={(k) => setRangeKey(k)}
          />
          {rangeKey === "custom" ? (
            <div className="flex items-center gap-2">
              <div className="relative">
                <CalendarRange
                  size={14}
                  className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <Input
                  type="date"
                  className="w-40 pl-8"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                />
              </div>
              <span className="text-xs text-text-muted">sampai</span>
              <Input
                type="date"
                className="w-40"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </div>
          ) : null}
        </div>
      </Card>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<ReceiptText size={20} />}
            title="Tidak ada transaksi"
            description="Tidak ada transaksi yang cocok dengan filter Anda."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-text-muted">
                  <th className="pb-2 pr-4 font-medium">ID Transaksi</th>
                  <th className="pb-2 pr-4 font-medium">Tanggal</th>
                  <th className="pb-2 pr-4 font-medium">Kasir</th>
                  <th className="pb-2 pr-4 font-medium">Tipe Order</th>
                  <th className="pb-2 pr-4 font-medium">Pembayaran</th>
                  <th className="pb-2 pr-4 font-medium">Total</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr
                    key={t.id}
                    className={cn(
                      "border-b border-border-light transition-colors last:border-0 hover:bg-slate-50",
                      t.status === "CANCELLED" && "opacity-60",
                    )}
                  >
                    <td className="py-3 pr-4 font-medium text-primary-600">
                      <Link href={`/transactions/${t.id}`} className="hover:underline">
                        {t.id}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-text-secondary">{formatDateTime(t.createdAt)}</td>
                    <td className="py-3 pr-4 text-text-secondary">{t.cashier}</td>
                    <td className="py-3 pr-4">{orderTypeLabels[t.orderType]}</td>
                    <td className="py-3 pr-4 text-text-secondary">
                      {paymentMethodLabels[t.payment.method]}
                    </td>
                    <td className="py-3 pr-4 font-semibold text-text-primary">
                      {formatRupiah(t.total)}
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="py-3 text-right">
                      <Link href={`/transactions/${t.id}`}>
                        <Button variant="secondary" size="sm">
                          Detail
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      </>}
    </div>
  );
}