"use client";

import { Check, Plus, Search, UtensilsCrossed } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { formatRupiah } from "@/lib/format";
import { orderTypeLabels } from "@/lib/dummy-data";
import { usePosStore } from "@/lib/use-pos-store";
import type { OrderType, Product } from "@/lib/types";

export function ProductGrid({
  onOpen,
}: {
  onOpen: (p: Product) => void;
}) {
  const products = usePosStore((s) => s.products);
  const categories = usePosStore((s) => s.categories);
  const orderType = usePosStore((s) => s.orderType);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const visibleCategories = categories.filter((c) => c.active);
  const activeProducts = useMemo(() => products.filter((p) => p.active), [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activeProducts
      .filter((p) => activeCategory === "all" || p.categoryId === activeCategory)
      .filter((p) => !q || p.name.toLowerCase().includes(q))
      .filter((p) =>
        orderType === "DINE_IN" ? p.dineInAvailable : p.takeawayAvailable,
      );
  }, [activeProducts, activeCategory, search, orderType]);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 shrink-0 space-y-3">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-text-primary placeholder:text-text-placeholder focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            placeholder="Cari produk…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <CategoryChip
            active={activeCategory === "all"}
            onClick={() => setActiveCategory("all")}
            label="Semua"
          />
          {visibleCategories.map((c) => (
            <CategoryChip
              key={c.id}
              active={activeCategory === c.id}
              onClick={() => setActiveCategory(c.id)}
              label={c.name}
            />
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-500">
              <UtensilsCrossed size={20} />
            </div>
            <p className="text-sm font-medium text-text-primary">Produk tidak ditemukan</p>
            <p className="max-w-xs text-xs text-text-muted">
              Tidak ada produk aktif yang tersedia untuk tipe {orderTypeLabels[orderType]}. Coba
              ubah pencarian, kategori, atau tipe order.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} orderType={orderType} onOpen={onOpen} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors duration-150",
        active
          ? "border-primary-500 bg-primary-500 text-white"
          : "border-border bg-surface text-text-secondary hover:bg-surface-secondary",
      )}
    >
      {label}
    </button>
  );
}

function ProductCard({
  product,
  orderType,
  onOpen,
}: {
  product: Product;
  orderType: OrderType;
  onOpen: (p: Product) => void;
}) {
  const quickAdd = usePosStore((s) => s.quickAdd);
  const [added, setAdded] = useState(false);
  const price =
    orderType === "DINE_IN" ? product.dineInPrice : product.takeawayPrice;

  const fastAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    quickAdd(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 900);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(product)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(product);
        }
      }}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-border bg-surface text-left shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
    >
      <button
        type="button"
        onClick={fastAdd}
        aria-label={`Tambah ${product.name} ke keranjang`}
        className={cn(
          "absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full shadow-elevated transition-all duration-150",
          added
            ? "bg-success-500 text-white"
            : "bg-white text-primary-600 hover:scale-110 hover:bg-primary-500 hover:text-white",
        )}
      >
        {added ? <Check size={15} /> : <Plus size={15} />}
      </button>
      <div className="flex h-24 items-center justify-center bg-primary-50 text-4xl">
        {product.emoji ?? "🍽️"}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-1 text-sm font-medium text-text-primary">{product.name}</p>
        <p className="mt-auto text-sm font-semibold text-text-primary">{formatRupiah(price)}</p>
        <p className="text-[11px] text-text-muted">{orderTypeLabels[orderType]}</p>
      </div>
    </div>
  );
}

export function OrderTypeToggle({
  orderType,
  onChange,
}: {
  orderType: OrderType;
  onChange: (t: OrderType) => void;
}) {
  return (
    <div className="mb-3 grid grid-cols-2 gap-1 rounded-lg bg-slate-50 p-1">
      {(["DINE_IN", "TAKEAWAY"] as OrderType[]).map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={cn(
            "cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150",
            orderType === t
              ? "bg-primary-500 text-white"
              : "text-text-primary hover:bg-white",
          )}
        >
          {orderTypeLabels[t]}
        </button>
      ))}
    </div>
  );
}