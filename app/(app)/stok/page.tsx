"use client";

import { Minus, Package, Plus, RefreshCw, ShoppingBag, ClipboardList } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Input,
  Label,
  Modal,
  Select,
  Textarea,
} from "@/components/ui";
import { TableSkeleton } from "@/components/skeletons";
import { useStockMovements, useStockMutation, type StockMovementsParams } from "@/lib/api/hooks";
import { usePosStore } from "@/lib/use-pos-store";
import { formatRupiah } from "@/lib/format";
import type { Product } from "@/lib/types";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";

const MOVEMENT_LABELS: Record<string, string> = {
  SALE: "Penjualan",
  RETURN: "Retur / Batal",
  PURCHASE: "Pembelian barang",
  ADJUSTMENT: "Penyesuaian",
  OPNAME: "Opname fisik",
};

const MOVEMENT_STYLES: Record<string, string> = {
  SALE: "bg-error-soft text-error-strong",
  RETURN: "bg-success-soft text-success-strong",
  PURCHASE: "bg-success-soft text-success-strong",
  ADJUSTMENT: "bg-muted text-text-muted",
  OPNAME: "bg-warning-soft text-warning-strong",
};

type MutationType = "PURCHASE" | "ADJUST" | "OPNAME";

export default function StockPage() {
  const products = usePosStore((s) => s.products);
  const user = usePosStore((s) => s.user);
  const dataLoaded = usePosStore((s) => s.dataLoaded);

  const [actionTarget, setActionTarget] = useState<Product | null>(null);
  const [historyProduct, setHistoryProduct] = useState("ALL");
  const [historyType, setHistoryType] = useState("ALL");
  const [addMode, setAddMode] = useState(false);

  const isOwner = user?.role === "OWNER";
  const tracked = useMemo(() => products.filter((p) => p.trackStock), [products]);

  const summary = useMemo(() => {
    const out = tracked.filter((p) => p.stock <= 0).length;
    const low = tracked.filter((p) => p.stock > 0 && p.stock <= p.lowStockThreshold).length;
    const totalUnits = tracked.reduce((s, p) => s + p.stock, 0);
    return { total: tracked.length, totalUnits, out, low };
  }, [tracked]);

  const movementFilters = useMemo<StockMovementsParams>(() => {
    const filters: StockMovementsParams = { limit: 200 };
    if (historyProduct !== "ALL") filters.productId = historyProduct;
    if (historyType !== "ALL") filters.type = historyType;
    return filters;
  }, [historyProduct, historyType]);

  const { data: movements, isLoading } = useStockMovements(movementFilters);
  const movementQueryKey = JSON.stringify(movementFilters);

  const productColumns: ColumnDef<Product, unknown>[] = useMemo(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: "Produk",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-base">
              {row.original.emoji ?? "🍽️"}
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium text-text-primary">{row.original.name}</p>
              {row.original.categoryId ? (
                <p className="text-xs text-text-muted">
                  {products.find((c) => c.id === row.original.categoryId)?.name ?? ""}
                </p>
              ) : null}
            </div>
          </div>
        ),
      },
      {
        id: "stock",
        accessorKey: "stock",
        header: () => <div className="text-right">Stok</div>,
        cell: ({ row }) => {
          const p = row.original;
          const isOut = p.stock <= 0;
          const isLow = p.stock <= p.lowStockThreshold;
          return (
            <div className="text-right">
              <Badge
                className={
                  isOut
                    ? "bg-error-soft text-error-strong"
                    : isLow
                      ? "bg-warning-soft text-warning-strong"
                      : "bg-success-soft text-success-strong"
                }
              >
                {isOut ? "Habis" : isLow ? `Menipis (${p.stock})` : `${p.stock}`}
              </Badge>
            </div>
          );
        },
      },
      {
        id: "threshold",
        header: () => <div className="text-right">Ambang</div>,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="text-right text-text-secondary">{row.original.lowStockThreshold}</div>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            {isOwner ? (
              <>
                <button
                  onClick={() => setActionTarget(row.original)}
                  className="cursor-pointer rounded-lg p-2 text-text-muted transition-colors hover:bg-muted hover:text-primary-500"
                  aria-label={`Tambah stok ${row.original.name}`}
                  title="Tambah stok"
                >
                  <Plus size={16} />
                </button>
                <button
                  onClick={() => setActionTarget(row.original)}
                  className="cursor-pointer rounded-lg p-2 text-text-muted transition-colors hover:bg-muted hover:text-primary-500"
                  aria-label={`Sesuaikan stok ${row.original.name}`}
                  title="Sesuaikan / opname"
                >
                  <RefreshCw size={15} />
                </button>
              </>
            ) : null}
          </div>
        ),
      },
    ],
    [products, isOwner],
  );

  const movementColumns: ColumnDef<Record<string, unknown>, unknown>[] = useMemo(
    () => [
      {
        id: "productName",
        accessorKey: "productName",
        header: "Produk",
        cell: ({ row }) => (
          <span className="font-medium text-text-primary">{String(row.getValue("productName"))}</span>
        ),
      },
      {
        id: "type",
        accessorKey: "type",
        header: "Jenis",
        enableSorting: false,
        cell: ({ row }) => (
          <Badge className={MOVEMENT_STYLES[String(row.getValue("type"))] ?? "bg-muted text-text-muted"}>
            {MOVEMENT_LABELS[String(row.getValue("type"))] ?? String(row.getValue("type"))}
          </Badge>
        ),
      },
      {
        id: "quantity",
        accessorKey: "quantity",
        header: () => <div className="text-right">Perubahan</div>,
        cell: ({ row }) => {
          const q = Number(row.getValue("quantity"));
          const positive = q > 0;
          return (
            <div
              className={`text-right font-semibold ${
                positive ? "text-success-strong" : "text-error-strong"
              }`}
            >
              {positive ? `+${q}` : q}
            </div>
          );
        },
      },
      {
        id: "balanceAfter",
        accessorKey: "balanceAfter",
        header: () => <div className="text-right">Sisa</div>,
        cell: ({ row }) => (
          <div className="text-right text-text-secondary">{Number(row.getValue("balanceAfter"))}</div>
        ),
      },
      {
        id: "note",
        accessorKey: "note",
        header: "Catatan",
        enableSorting: false,
        cell: ({ row }) => {
          const note = row.getValue("note") as string | null;
          return note ? (
            <span className="line-clamp-1 text-xs text-text-muted" title={note}>
              {note}
            </span>
          ) : (
            <span className="text-xs text-text-placeholder">—</span>
          );
        },
      },
      {
        id: "createdAt",
        accessorKey: "createdAt",
        header: () => <div className="text-right">Waktu</div>,
        cell: ({ row }) => (
          <div className="text-right text-xs text-text-muted">
            {new Date(String(row.getValue("createdAt"))).toLocaleString("id-ID", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-text-primary">Manajemen Stok</h2>
        <p className="text-sm text-text-muted">
          Stok per produk jadi — berkurang otomatis saat transaksi, kembali saat dibatalkan.
        </p>
      </div>

      {!dataLoaded ? <TableSkeleton rows={4} /> : (
        <>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <SummaryStat label="Produk Dilacak" value={`${summary.total}`} icon={<Package size={18} />} />
            <SummaryStat label="Total Unit Stok" value={`${summary.totalUnits}`} icon={<ShoppingBag size={18} />} />
            <SummaryStat label="Menipis" value={`${summary.low}`} icon={<Minus size={18} />} accent="warning" />
            <SummaryStat label="Stok Habis" value={`${summary.out}`} icon={<ClipboardList size={18} />} accent="danger" />
          </div>

          <Card>
            <CardHeader
              title={`Stok Produk (${tracked.length})`}
              description="Produk tanpa pelacakan stok tidak tampil di sini."
              action={
                isOwner ? (
                  <Button size="sm" onClick={() => setAddMode(true)}>
                    <Plus size={15} />
                    Tambah Stok
                  </Button>
                ) : undefined
              }
            />
            {tracked.length === 0 ? (
              <EmptyState
                icon={<Package size={20} />}
                title="Belum ada produk yang melacak stok"
                description='Aktifkan "Lacak stok produk ini" saat menambah/mengedit produk di Menu & Produk.'
              />
            ) : (
              <DataTable
                columns={productColumns}
                data={tracked}
                loading={false}
                searchPlaceholder="Cari produk…"
                emptyTitle="Tidak ada produk"
                emptyDescription="Belum ada produk yang melacak stok."
                emptyIcon={<Package size={20} />}
                initialSorting={[{ id: "name", desc: false }]}
              />
            )}
          </Card>

          <Card>
            <CardHeader
              title="Riwayat Mutasi Stok"
              description="Ledger mutasi (penjualan, pembelian, penyesuaian, opname, retur)."
              action={
                <div className="flex items-center gap-2">
                  <Select
                    className="w-40"
                    value={historyProduct}
                    onChange={(e) => setHistoryProduct(e.target.value)}
                  >
                    <option value="ALL">Semua Produk</option>
                    {tracked.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </Select>
                  <Select
                    className="w-36"
                    value={historyType}
                    onChange={(e) => setHistoryType(e.target.value)}
                  >
                    <option value="ALL">Semua Jenis</option>
                    {Object.entries(MOVEMENT_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </div>
              }
            />
            {isLoading ? (
              <TableSkeleton rows={4} />
            ) : (
              <DataTable
                key={movementQueryKey}
                resetKey={movementQueryKey}
                columns={movementColumns}
                data={(movements ?? []) as unknown as Record<string, unknown>[]}
                loading={false}
                searchable={false}
                emptyTitle="Belum ada mutasi stok"
                emptyDescription="Mutasi akan tercatat saat produk terjual, ditambah, atau disesuaikan."
                emptyIcon={<ClipboardList size={20} />}
              />
            )}
          </Card>
        </>
      )}

      {actionTarget ? (
        <StockMutationModal product={actionTarget} products={tracked} onClose={() => setActionTarget(null)} />
      ) : null}
      {addMode && !actionTarget ? (
        <StockMutationModal product={null} products={tracked} onClose={() => setAddMode(false)} />
      ) : null}
    </div>
  );
}

function SummaryStat({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: "warning" | "danger";
}) {
  const tone =
    accent === "warning"
      ? "bg-warning-soft text-warning-strong"
      : accent === "danger"
        ? "bg-error-soft text-error-strong"
        : "bg-primary-50 text-primary-500";
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 shadow-card">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-text-muted">{label}</p>
        <p className="mt-0.5 text-xl font-semibold tracking-tight text-text-primary">{value}</p>
      </div>
    </div>
  );
}

function StockMutationModal({
  product,
  products,
  onClose,
}: {
  product: Product | null;
  products: Product[];
  onClose: () => void;
}) {
  const mutation = useStockMutation();
  const [selectedId, setSelectedId] = useState<string>(product?.id ?? "");
  const [type, setType] = useState<MutationType>("PURCHASE");
  const [quantity, setQuantity] = useState("");
  const [newStock, setNewStock] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const target = product ?? products.find((p) => p.id === selectedId) ?? null;

  useEffect(() => {
    if (product) {
      setSelectedId(product.id);
      setNewStock(String(product.stock));
    } else {
      const first = products[0];
      setSelectedId(first?.id ?? "");
      setNewStock(first ? String(first.stock) : "");
    }
    setQuantity("");
    setNote("");
    setType("PURCHASE");
    setError(null);
  }, [product, products]);

  const selectProduct = (id: string) => {
    setSelectedId(id);
    const p = products.find((x) => x.id === id);
    setNewStock(p ? String(p.stock) : "");
    setError(null);
  };

  if (!target) {
    return (
      <Modal open onClose={onClose} title="Mutasi Stok" width="max-w-md">
        <p className="text-sm text-text-secondary">
          Belum ada produk yang melacak stok. Aktifkan "Lacak stok produk ini" pada produk di
          Menu & Produk terlebih dahulu.
        </p>
        <div className="mt-5 flex justify-end">
          <Button variant="secondary" onClick={onClose} type="button">
            Tutup
          </Button>
        </div>
      </Modal>
    );
  }

  const submit = () => {
    setError(null);
    const payload =
      type === "PURCHASE"
        ? { productId: target.id, type, quantity: Number(quantity) }
        : { productId: target.id, type, newStock: Number(newStock), note: note.trim() };
    if (type === "PURCHASE" && (!quantity || Number(quantity) <= 0)) {
      setError("Jumlah tambahan stok harus lebih dari 0.");
      return;
    }
    mutation.mutate(payload as Parameters<typeof mutation.mutate>[0], {
      onSuccess: () => onClose(),
      onError: (e) => setError(e.message),
    });
  };

  return (
    <Modal open onClose={onClose} title="Mutasi Stok" width="max-w-md">
      <div className="space-y-4">
        {!product ? (
          <div>
            <Label>Produk</Label>
            <Select value={selectedId} onChange={(e) => selectProduct(e.target.value)}>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
        <div className="flex items-center gap-3 rounded-lg bg-surface-secondary px-3 py-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-base">
            {target.emoji ?? "🍽️"}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-text-primary">{target.name}</p>
            <p className="text-xs text-text-muted">Stok saat ini: {target.stock}</p>
          </div>
        </div>

        <div>
          <Label>Jenis Mutasi</Label>
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
            {(
              [
                ["PURCHASE", "Tambah Stok", <ShoppingBag key="p" size={14} />],
                ["ADJUST", "Sesuaikan", <RefreshCw key="a" size={14} />],
                ["OPNAME", "Opname", <ClipboardList key="o" size={14} />],
              ] as const
            ).map(([key, label, icon]) => (
              <button
                key={key}
                type="button"
                onClick={() => setType(key)}
                className={`cursor-pointer flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors duration-150 ${
                  type === key ? "bg-primary-500 text-white" : "text-text-primary hover:bg-surface"
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
        </div>

        {type === "PURCHASE" ? (
          <div>
            <Label>Jumlah Tambahan</Label>
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Contoh: 10"
            />
            <p className="mt-1 text-xs text-text-muted">
              Stok akhir setelah penambahan: {target.stock + (Number(quantity) || 0)} unit.
            </p>
          </div>
        ) : (
          <>
            <div>
              <Label>Stok Akhir (Hasil Hitung)</Label>
              <Input type="number" min={0} value={newStock} onChange={(e) => setNewStock(e.target.value)} />
              <p className="mt-1 text-xs text-text-muted">
                Selisih terhadap stok saat ini akan dicatat:{" "}
                {type === "OPNAME"
                  ? "selisih hasil opname fisik"
                  : `${Number(newStock) - target.stock >= 0 ? "+" : ""}${Number(newStock) - target.stock} unit`}
                .
              </p>
            </div>
            <div>
              <Label>Catatan / Alasan (wajib)</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={type === "OPNAME" ? "Contoh: opname fisik akhir bulan" : "Contoh: produk rusak / salah input"}
              />
            </div>
          </>
        )}

        {error ? <p className="text-xs font-medium text-error-strong">{error}</p> : null}

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="secondary" onClick={onClose} type="button">
            Batal
          </Button>
          <Button onClick={submit} disabled={mutation.isPending}>
            {mutation.isPending ? "Menyimpan…" : "Simpan Mutasi"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}