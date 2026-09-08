"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import { loadTransactions } from "@/lib/data";
import { formatDateTime, formatIDR } from "@/lib/format";
import { orderTypeLabel, paymentLabel, statusLabel } from "@/lib/labels";
import type { PaymentMethod, TransactionStatus } from "@/lib/types";
import { Badge, statusBadgeVariant } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export default function TransactionsPage() {
  const transactions = useMemo(() => loadTransactions(), []);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | TransactionStatus>("ALL");
  const [payment, setPayment] = useState<"ALL" | PaymentMethod>("ALL");
  const [orderType, setOrderType] = useState<"ALL" | "DINE_IN" | "TAKEAWAY">("ALL");
  const [cashier, setCashier] = useState("ALL");

  const cashiers = useMemo(() => [...new Set(transactions.map((t) => t.cashier))], [transactions]);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (search.trim() && !t.id.toLowerCase().includes(search.toLowerCase())) return false;
      if (status !== "ALL" && t.status !== status) return false;
      if (payment !== "ALL" && t.paymentMethod !== payment) return false;
      if (orderType !== "ALL" && t.orderType !== orderType) return false;
      if (cashier !== "ALL" && t.cashier !== cashier) return false;
      return true;
    });
  }, [transactions, search, status, payment, orderType, cashier]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative lg:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari Transaction ID…"
            className="pl-9"
          />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          <option value="ALL">Semua status</option>
          <option value="COMPLETED">Completed</option>
          <option value="PENDING">Pending</option>
          <option value="CANCELLED">Dibatalkan</option>
        </Select>
        <Select value={payment} onChange={(e) => setPayment(e.target.value as typeof payment)}>
          <option value="ALL">Semua pembayaran</option>
          <option value="CASH">Cash</option>
          <option value="BANK_TRANSFER">Bank Transfer</option>
          <option value="QRIS">QRIS</option>
        </Select>
        <Select value={orderType} onChange={(e) => setOrderType(e.target.value as typeof orderType)}>
          <option value="ALL">Dine-in & Takeaway</option>
          <option value="DINE_IN">Dine-in</option>
          <option value="TAKEAWAY">Takeaway</option>
        </Select>
        <Select value={cashier} onChange={(e) => setCashier(e.target.value)}>
          <option value="ALL">Semua kasir</option>
          {cashiers.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <Table>
          <THead>
            <TR>
              <TH>Transaction ID</TH>
              <TH>Tanggal / Waktu</TH>
              <TH>Kasir</TH>
              <TH>Order Type</TH>
              <TH>Pembayaran</TH>
              <TH className="text-right">Total</TH>
              <TH>Status</TH>
              <TH />
            </TR>
          </THead>
          <TBody>
            {filtered.map((t) => (
              <TR key={t.id} className="transition-colors hover:bg-slate-50">
                <TD className="font-medium text-blue-600">{t.id}</TD>
                <TD className="text-sm text-gray-600">{formatDateTime(t.createdAt)}</TD>
                <TD className="text-sm">{t.cashier}</TD>
                <TD className="text-sm">{orderTypeLabel(t.orderType)}</TD>
                <TD className="text-sm">{paymentLabel(t.paymentMethod)}</TD>
                <TD className="text-right text-sm font-semibold">{formatIDR(t.total)}</TD>
                <TD>
                  <Badge variant={statusBadgeVariant(t.status)}>{statusLabel(t.status)}</Badge>
                </TD>
                <TD>
                  <Link
                    href={`/transactions/${t.id}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-slate-100 hover:text-gray-600"
                    aria-label="Lihat detail"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
        {filtered.length === 0 && (
          <div className="py-16 text-center text-sm text-gray-400">
            Tidak ada transaksi yang cocok dengan filter.
          </div>
        )}
      </div>
    </div>
  );
}