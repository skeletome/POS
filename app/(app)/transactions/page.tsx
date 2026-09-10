"use client";

import { CalendarRange, ReceiptText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Button,
  Card,
  CardHeader,
  Input,
  Select,
  StatusBadge,
  Tabs,
} from "@/components/ui";
import { DataTable, DataTableColumnHeader } from "@/components/data-table";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { dateRangePresets, getRange, type DateRangeKey } from "@/lib/date-range";
import { formatDateTime, formatRupiah } from "@/lib/format";
import { orderTypeLabels, paymentMethodLabels } from "@/lib/dummy-data";
import { usePosStore } from "@/lib/use-pos-store";
import { useTransactionsPage, type TransactionsPageParams } from "@/lib/api/hooks";
import type { OrderType, PaymentMethod, Transaction, TransactionStatus } from "@/lib/types";

export default function TransactionsPage() {
  const cashiers = usePosStore((s) => s.cashiers);

  const [rangeKey, setRangeKey] = useState<DateRangeKey>("thisMonth");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [payment, setPayment] = useState<"ALL" | PaymentMethod>("ALL");
  const [orderType, setOrderType] = useState<"ALL" | OrderType>("ALL");
  const [status, setStatus] = useState<"ALL" | TransactionStatus>("ALL");
  const [cashier, setCashier] = useState<"ALL" | string>("ALL");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [pageMeta, setPageMeta] = useState({ page: 1, pageSize: 30 });
  const [sortBy, setSortBy] = useState<"createdAt" | "total">("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filterVersion, setFilterVersion] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setFilterVersion((v) => v + 1);
  }, [search]);

  const bumpFilters = () => setFilterVersion((v) => v + 1);

  const rangeParams = useMemo(() => {
    if (rangeKey === "custom") {
      return {
        from: customFrom ? `${customFrom}T00:00:00` : undefined,
        to: customTo ? `${customTo}T23:59:59` : undefined,
      };
    }
    const r = getRange(rangeKey);
    return { from: r.from.toISOString(), to: r.to.toISOString() };
  }, [rangeKey, customFrom, customTo]);

  const params = useMemo<TransactionsPageParams>(
    () => ({
      page: pageMeta.page,
      pageSize: pageMeta.pageSize,
      from: rangeParams.from,
      to: rangeParams.to,
      search: search || undefined,
      status: status === "ALL" ? undefined : status,
      payment: payment === "ALL" ? undefined : payment,
      orderType: orderType === "ALL" ? undefined : orderType,
      cashier: cashier === "ALL" ? undefined : cashier,
      sortBy,
      sortDir,
    }),
    [pageMeta, rangeParams, search, status, payment, orderType, cashier, sortBy, sortDir],
  );

  const { data, isLoading, isFetching, isError, refetch } = useTransactionsPage(params);

  const columns = useMemo<ColumnDef<Transaction, unknown>[]>(
    () => [
      {
        id: "id",
        accessorKey: "id",
        header: "ID Transaksi",
        enableSorting: false,
        cell: ({ row }) => (
          <Link
            href={`/transactions/${row.original.id}`}
            className="font-medium text-primary-600 hover:underline"
          >
            {row.original.id}
          </Link>
        ),
      },
      {
        id: "createdAt",
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Tanggal" />
        ),
        cell: ({ row }) => (
          <span className="text-text-secondary">{formatDateTime(row.original.createdAt)}</span>
        ),
      },
      {
        id: "cashier",
        accessorKey: "cashier",
        header: "Kasir",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-text-secondary">{row.original.cashier}</span>
        ),
      },
      {
        id: "orderType",
        accessorKey: "orderType",
        header: "Tipe Order",
        enableSorting: false,
        cell: ({ row }) => orderTypeLabels[row.original.orderType],
      },
      {
        id: "payment",
        accessorKey: "payment.method",
        header: "Pembayaran",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-text-secondary">
            {paymentMethodLabels[row.original.payment.method]}
          </span>
        ),
      },
      {
        id: "total",
        accessorKey: "total",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Total" />
        ),
        cell: ({ row }) => (
          <span className="font-semibold text-text-primary">
            {formatRupiah(row.original.total)}
          </span>
        ),
      },
      {
        id: "status",
        accessorKey: "status",
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <Link href={`/transactions/${row.original.id}`}>
            <span className="text-sm font-medium text-primary-600 hover:underline">Detail</span>
          </Link>
        ),
      },
    ],
    [],
  );

  const handleSortingChange = (sorting: SortingState) => {
    const s = sorting[0];
    setSortBy(s && s.id === "total" ? "total" : "createdAt");
    setSortDir(s ? (s.desc ? "desc" : "asc") : "desc");
  };

  return (
    <div className="space-y-5">
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
          <Select
            value={payment}
            onChange={(e) => {
              setPayment(e.target.value as "ALL" | PaymentMethod);
              bumpFilters();
            }}
          >
            <option value="ALL">Semua Pembayaran</option>
            <option value="CASH">Cash</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="QRIS">QRIS</option>
          </Select>
          <Select
            value={orderType}
            onChange={(e) => {
              setOrderType(e.target.value as "ALL" | OrderType);
              bumpFilters();
            }}
          >
            <option value="ALL">Semua Tipe Order</option>
            <option value="DINE_IN">Dine-in</option>
            <option value="TAKEAWAY">Takeaway</option>
          </Select>
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as "ALL" | TransactionStatus);
              bumpFilters();
            }}
          >
            <option value="ALL">Semua Status</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
          <Select
            value={cashier}
            onChange={(e) => {
              setCashier(e.target.value);
              bumpFilters();
            }}
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
            onChange={(k) => {
              setRangeKey(k);
              bumpFilters();
            }}
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
                  onChange={(e) => {
                    setCustomFrom(e.target.value);
                    bumpFilters();
                  }}
                />
              </div>
              <span className="text-xs text-text-muted">sampai</span>
              <Input
                type="date"
                className="w-40"
                value={customTo}
                onChange={(e) => {
                  setCustomTo(e.target.value);
                  bumpFilters();
                }}
              />
            </div>
          ) : null}
        </div>
      </Card>

      <Card>
        {isError ? (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-error-light bg-error-soft px-3 py-3">
            <p className="text-sm font-medium text-error-strong">
              Gagal memuat data transaksi. Periksa koneksi lalu coba lagi.
            </p>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Coba lagi
            </Button>
          </div>
        ) : null}
        <DataTable
          columns={columns}
          data={data?.transactions ?? []}
          loading={isLoading}
          fetching={isFetching}
          searchPlaceholder="Cari ID transaksi…"
          controlledSearch
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          emptyTitle="Tidak ada transaksi"
          emptyDescription="Tidak ada transaksi yang cocok dengan filter Anda."
          emptyIcon={<ReceiptText size={20} />}
          initialSorting={[{ id: "createdAt", desc: true }]}
          manualPagination
          rowCount={data?.total ?? 0}
          onPaginationChange={(pageIndex, pageSize) =>
            setPageMeta({ page: pageIndex + 1, pageSize })
          }
          resetKey={filterVersion}
          manualSorting
          onSortingChange={handleSortingChange}
        />
      </Card>
    </div>
  );
}