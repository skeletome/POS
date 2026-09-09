"use client";

import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button, Modal } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatRupiah } from "@/lib/format";
import { usePosStore } from "@/lib/use-pos-store";
import type { CartItem, OptionGroup, Product } from "@/lib/types";

export function ProductModal({
  product,
  open,
  onClose,
}: {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}) {
  const orderType = usePosStore((s) => s.orderType);
  const addMerged = usePosStore((s) => s.addMerged);

  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (product) {
      const initial: Record<string, string[]> = {};
      for (const g of product.optionGroups) {
        initial[g.id] = g.multiple ? [] : [];
      }
      setSelections(initial);
      setQuantity(1);
    }
  }, [product]);

  const basePrice = product
    ? orderType === "DINE_IN"
      ? product.dineInPrice
      : product.takeawayPrice
    : 0;

  const optionCharge = useMemo(() => {
    if (!product) return 0;
    let total = 0;
    for (const g of product.optionGroups) {
      const sel = selections[g.id] ?? [];
      for (const id of sel) {
        const opt = g.options.find((o) => o.id === id);
        if (opt) total += opt.additionalPrice;
      }
    }
    return total;
  }, [product, selections]);

  const unitPrice = basePrice + optionCharge;

  const toggleSingle = (groupId: string, optionId: string) => {
    setSelections((prev) => ({ ...prev, [groupId]: [optionId] }));
  };

  const toggleMultiple = (groupId: string, optionId: string) => {
    setSelections((prev) => {
      const cur = prev[groupId] ?? [];
      const next = cur.includes(optionId)
        ? cur.filter((id) => id !== optionId)
        : [...cur, optionId];
      return { ...prev, [groupId]: next };
    });
  };

  const add = () => {
    if (!product) return;
    const options = ([] as CartItem["options"]).concat(
      ...product.optionGroups.map((g) =>
        (selections[g.id] ?? []).map((optId) => {
          const opt = g.options.find((o) => o.id === optId)!;
          return {
            groupId: g.id,
            groupName: g.name,
            optionId: opt.id,
            optionName: opt.name,
            price: opt.additionalPrice,
          };
        }),
      ),
    );

    const item: CartItem = {
      id: crypto.randomUUID(),
      productId: product.id,
      productName: product.name,
      orderType,
      unitPrice,
      quantity,
      options,
    };
    addMerged(item);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Customisasi Produk">
      {product ? (
        <div>
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-3xl">
              {product.emoji ?? "🍽️"}
            </div>
            <div>
              <h3 className="text-base font-semibold text-text-primary">{product.name}</h3>
              <p className="text-sm font-semibold text-primary-600">{formatRupiah(basePrice)}</p>
              {product.description ? (
                <p className="mt-0.5 text-xs text-text-muted">{product.description}</p>
              ) : null}
            </div>
          </div>

          {product.optionGroups.length > 0 ? (
            <div className="space-y-4">
              {product.optionGroups.map((g) => (
                <OptionGroupPicker
                  key={g.id}
                  group={g}
                  selected={selections[g.id] ?? []}
                  onToggleSingle={toggleSingle}
                  onToggleMultiple={toggleMultiple}
                />
              ))}
            </div>
          ) : (
            <p className="rounded-lg bg-surface-secondary px-3 py-2.5 text-xs text-text-muted">
              Produk ini tidak memiliki pilihan tambahan.
            </p>
          )}

          <div className="mt-5 flex items-center justify-between gap-4 border-t border-border pt-4">
            <div>
              <p className="text-xs text-text-muted">Harga per item</p>
              <p className="text-base font-semibold text-text-primary">
                {formatRupiah(unitPrice)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-secondary hover:bg-surface-secondary"
                aria-label="Kurangi jumlah"
              >
                <Minus size={16} />
              </button>
              <span className="w-8 text-center text-base font-semibold text-text-primary">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-secondary hover:bg-surface-secondary"
                aria-label="Tambah jumlah"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <Button className="mt-4 w-full" size="lg" onClick={add}>
            <ShoppingCart size={18} />
            Tambah ke Keranjang · {formatRupiah(unitPrice * quantity)}
          </Button>
        </div>
      ) : null}
    </Modal>
  );
}

function OptionGroupPicker({
  group,
  selected,
  onToggleSingle,
  onToggleMultiple,
}: {
  group: OptionGroup;
  selected: string[];
  onToggleSingle: (groupId: string, optionId: string) => void;
  onToggleMultiple: (groupId: string, optionId: string) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-text-primary">
        {group.name}
        <span className="ml-1 text-xs font-normal text-text-muted">
          {group.multiple ? "· bisa lebih dari satu" : ""}
        </span>
      </p>
      <div className={cn("grid gap-2", group.multiple ? "sm:grid-cols-2" : "grid-cols-1")}>
        {group.options.map((o) => {
          const isSel = selected.includes(o.id);
          return (
            <button
              key={o.id}
              onClick={() =>
                group.multiple
                  ? onToggleMultiple(group.id, o.id)
                  : onToggleSingle(group.id, o.id)
              }
              className={cn(
                "cursor-pointer flex items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition-colors duration-150",
                isSel
                  ? "border-primary-500 bg-primary-50"
                  : "border-border bg-surface hover:bg-surface-secondary",
              )}
            >
              <span className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center border",
                    group.multiple ? "rounded" : "rounded-full",
                    isSel ? "border-primary-500 bg-primary-500" : "border-border-strong",
                  )}
                >
                  {isSel ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  ) : null}
                </span>
                {o.name}
              </span>
              {o.additionalPrice > 0 ? (
                <span className="text-xs font-medium text-text-secondary">
                  +{formatRupiah(o.additionalPrice)}
                </span>
              ) : (
                <span className="text-xs text-text-placeholder">Gratis</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}