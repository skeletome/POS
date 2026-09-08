"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { formatIDR } from "@/lib/format";
import type { Category, OrderType, Product } from "@/lib/types";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";

export function ProductGrid({
  products,
  categories,
  orderType,
  onOpen,
}: {
  products: Product[];
  categories: Category[];
  orderType: OrderType;
  onOpen: (product: Product) => void;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (!p.active) return false;
      if (category !== "all" && p.categoryId !== category) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [products, search, category]);

  const activeCategories = categories.filter((c) => c.active);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari menu…"
          className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm placeholder:text-gray-400 outline-none transition-colors duration-150 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        <CategoryPill label="Semua" active={category === "all"} onClick={() => setCategory("all")} />
        {activeCategories.map((c) => (
          <CategoryPill
            key={c.id}
            label={c.name}
            active={category === c.id}
            onClick={() => setCategory(c.id)}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <p className="text-3xl">🔍</p>
          <p className="text-sm text-gray-400">Tidak ada produk yang cocok dengan pencarian.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {filtered.map((p) => {
            const available =
              p[orderType === "DINE_IN" ? "dineInAvailable" : "takeawayAvailable"];
            const price =
              orderType === "DINE_IN" ? p.dineInPrice : p.takeawayPrice;
            return (
              <button
                key={p.id}
                onClick={() => onOpen(p)}
                disabled={!available}
                className={cn(
                  "group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-left transition-colors duration-150",
                  available
                    ? "hover:border-blue-300 hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)]"
                    : "cursor-not-allowed opacity-60",
                )}
              >
                <div className="flex h-24 items-center justify-center bg-blue-50/60 text-5xl">
                  {p.emoji}
                </div>
                <div className="flex flex-1 flex-col gap-1 p-3">
                  <p className="text-sm font-medium leading-tight text-gray-900">{p.name}</p>
                  {available ? (
                    <p className="text-sm font-semibold text-blue-600">{formatIDR(price)}</p>
                  ) : (
                    <Badge variant="neutral" className="self-start">
                      {orderType === "DINE_IN" ? "Takeaway" : "Dine-in"} only
                    </Badge>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CategoryPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors duration-150",
        active ? "bg-blue-500 text-white" : "bg-white text-gray-600 border border-slate-200 hover:bg-slate-50",
      )}
    >
      {label}
    </button>
  );
}