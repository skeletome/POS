"use client";

import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { formatIDR } from "@/lib/format";
import type { CartItem, OrderType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export interface CartTotals {
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export function CartPanel({
  items,
  orderType,
  onOrderTypeChange,
  onChangeQuantity,
  onRemoveItem,
  totals,
  onCheckout,
  emptyCart = "Keranjang masih kosong. Pilih produk untuk memulai transaksi.",
}: {
  items: CartItem[];
  orderType: OrderType;
  onOrderTypeChange: (t: OrderType) => void;
  onChangeQuantity: (key: string, delta: number) => void;
  onRemoveItem: (key: string) => void;
  totals: CartTotals;
  onCheckout: () => void;
  emptyCart?: string;
}) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center gap-1 rounded-t-xl border-b border-slate-100 bg-gray-50 p-2">
        {(
          [
            { value: "DINE_IN", label: "Dine-in" },
            { value: "TAKEAWAY", label: "Takeaway" },
          ] as { value: OrderType; label: string }[]
        ).map((t) => (
          <button
            key={t.value}
            onClick={() => onOrderTypeChange(t.value)}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
              orderType === t.value
                ? "bg-blue-500 text-white"
                : "text-gray-600 hover:bg-white",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center">
            <ShoppingCart className="h-8 w-8 text-slate-300" />
            <p className="max-w-[220px] text-xs text-gray-400">{emptyCart}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map((item) => (
              <div key={item.key} className="flex gap-3 rounded-lg border border-slate-100 p-2.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-2xl">
                  {item.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-medium text-gray-900">{item.name}</p>
                    <button
                      onClick={() => onRemoveItem(item.key)}
                      className="text-gray-300 transition-colors hover:text-red-500"
                      aria-label="Hapus item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {item.selectedOptions.length > 0 && (
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      {item.selectedOptions.map((o) => o.optionName).join(", ")}
                    </p>
                  )}
                  <div className="mt-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-1 rounded-md border border-slate-200">
                      <button
                        onClick={() => onChangeQuantity(item.key, -1)}
                        className="px-1.5 py-0.5 text-gray-500 hover:text-gray-700"
                        aria-label="Kurangi quantity"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-6 text-center text-xs font-medium text-gray-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onChangeQuantity(item.key, 1)}
                        className="px-1.5 py-0.5 text-gray-500 hover:text-gray-700"
                        aria-label="Tambah quantity"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{formatIDR(item.subtotal)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-1.5 border-t border-slate-100 p-4">
        <SummaryRow label={`Subtotal (${items.reduce((s, i) => s + i.quantity, 0)} item)`} value={formatIDR(totals.subtotal)} />
        <SummaryRow label={`Pajak (${totals.taxRate}%)`} value={formatIDR(totals.taxAmount)} />
        <div className="flex items-center justify-between border-t border-slate-100 pt-2">
          <span className="text-sm font-semibold text-gray-900">Total</span>
          <span className="text-xl font-semibold text-gray-900">{formatIDR(totals.total)}</span>
        </div>
        <Button className="mt-2 w-full" disabled={items.length === 0} onClick={onCheckout}>
          Checkout
        </Button>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm text-gray-500">
      <span>{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}