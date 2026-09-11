"use client";

import { ArrowUpDown, Check, Plus, Search, UtensilsCrossed } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { formatRupiah } from "@/lib/format";
import { orderTypeLabels } from "@/lib/dummy-data";
import { usePosStore } from "@/lib/use-pos-store";
import { bestProductDiscount, discountedUnitPrice } from "@/lib/pricing";
import type { OrderType, Product } from "@/lib/types";

const sortOptions: { value: SortBy; label: string }[] = [
  { value: "default", label: "Urutan default" },
  { value: "name", label: "Nama A–Z" },
  { value: "price_asc", label: "Harga termurah" },
  { value: "price_desc", label: "Harga termahal" },
];

type SortBy = "default" | "name" | "price_asc" | "price_desc";

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
  const [sortBy, setSortBy] = useState<SortBy>("default");

  const visibleCategories = categories.filter((c) => c.active);
  const activeProducts = useMemo(() => products.filter((p) => p.active), [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = activeProducts
      .filter((p) => activeCategory === "all" || p.categoryId === activeCategory)
      .filter((p) => !q || p.name.toLowerCase().includes(q))
      .filter((p) =>
        orderType === "DINE_IN" ? p.dineInAvailable : p.takeawayAvailable,
      );
    if (sortBy === "default") return list;
    const priceOf = (p: Product) =>
      orderType === "DINE_IN" ? p.dineInPrice : p.takeawayPrice;
    const copy = [...list];
    if (sortBy === "name") copy.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "price_asc") copy.sort((a, b) => priceOf(a) - priceOf(b));
    if (sortBy === "price_desc") copy.sort((a, b) => priceOf(b) - priceOf(a));
    return copy;
  }, [activeProducts, activeCategory, search, orderType, sortBy]);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 shrink-0 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
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
          <div className="relative shrink-0">
            <ArrowUpDown
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="h-10 cursor-pointer rounded-lg border border-border bg-surface pl-8 pr-3 text-sm text-text-secondary transition-colors duration-150 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              aria-label="Urutkan produk"
            >
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
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
  const discounts = usePosStore((s) => s.discounts);
  const [added, setAdded] = useState(false);
  const price = orderType === "DINE_IN" ? product.dineInPrice : product.takeawayPrice;

  const promo = useMemo(() => bestProductDiscount(product.id, price, discounts), [product.id, price, discounts]);
  const displayPrice = promo ? discountedUnitPrice(price, promo) : price;

  const outOfStock = product.trackStock && product.stock <= 0;
  const lowStock = product.trackStock && !outOfStock && product.stock <= product.lowStockThreshold;

  const fastAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (outOfStock) return;
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
          outOfStock
            ? "hidden"
            : added
              ? "bg-success-500 text-white"
              : "bg-surface text-primary-600 hover:scale-110 hover:bg-primary-500 hover:text-white",
        )}
      >
        {added ? <Check size={15} /> : <Plus size={15} />}
      </button>
      <div
        className={cn(
          "flex h-24 items-center justify-center bg-primary-50 text-4xl",
          outOfStock && "grayscale opacity-50",
        )}
      >
        {product.emoji ?? "🍽️"}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
{promo ? (
        <span className="absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded-md bg-error-500 px-1.5 py-0.5 text-[11px] font-bold text-white shadow-elevated">
          {promo.discountType === "PERCENT" ? `DISKON ${promo.discountValue}%` : `${formatRupiah(promo.discountValue)} OFF`}
        </span>
      ) : null}
        <p className="line-clamp-1 text-sm font-medium text-text-primary">{product.name}</p>
        <div className="mt-auto">
          {promo ? (
            <>
              <p className="text-[11px] text-text-muted line-through">{formatRupiah(price)}</p>
              <p className="text-sm font-semibold text-error-600">{formatRupiah(displayPrice)}</p>
            </>
          ) : (
            <p className="text-sm font-semibold text-text-primary">{formatRupiah(price)}</p>
          )}
        </div>
        <p className="text-[11px] text-text-muted">{orderTypeLabels[orderType]}</p>
        {product.trackStock ? (
          <p className="text-[11px] font-medium text-text-muted">
            {outOfStock ? (
              <span className="text-error-600">Stok habis</span>
            ) : lowStock ? (
              <span className="text-warning-strong">Menipis · sisa {product.stock}</span>
            ) : (
              <span>Stok: {product.stock}</span>
            )}
          </p>
        ) : null}
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
    <div className="mb-3 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
      {(["DINE_IN", "TAKEAWAY"] as OrderType[]).map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={cn(
            "cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150",
            orderType === t
              ? "bg-primary-500 text-white"
              : "text-text-primary hover:bg-surface",
          )}
        >
          {orderTypeLabels[t]}
        </button>
      ))}
    </div>
  );
}