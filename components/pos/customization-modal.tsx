"use client";

import { useMemo, useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { computeItemPrice } from "@/lib/data";
import { formatIDR } from "@/lib/format";
import type { CartItem, OrderType, Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";

export function CustomizationModal({
  product,
  orderType,
  onAdd,
  onClose,
}: {
  product: Product | null;
  orderType: OrderType;
  onAdd: (item: CartItem) => void;
  onClose: () => void;
}) {
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState(1);

  const basePrice = useMemo(() => (product ? computeItemPrice(product, orderType) : 0), [product, orderType]);
  const optionCharge = useMemo(() => {
    if (!product) return 0;
    return product.optionGroups.reduce((sum, g) => {
      const sel = selections[g.id] ?? [];
      return sum + g.options.filter((o) => sel.includes(o.id)).reduce((s, o) => s + o.price, 0);
    }, 0);
  }, [product, selections]);

  const unitPrice = basePrice + optionCharge;
  const subtotal = unitPrice * quantity;

  const toggleOption = (groupId: string, optionId: string, multiple: boolean) => {
    setSelections((prev) => {
      const current = prev[groupId] ?? [];
      if (multiple) {
        return {
          ...prev,
          [groupId]: current.includes(optionId)
            ? current.filter((id) => id !== optionId)
            : [...current, optionId],
        };
      }
      return { ...prev, [groupId]: current.includes(optionId) ? [] : [optionId] };
    });
  };

  const handleAdd = () => {
    if (!product) return;
    const selectedOptions = product.optionGroups.flatMap((g) => {
      const sel = selections[g.id] ?? [];
      return g.options
        .filter((o) => sel.includes(o.id))
        .map((o) => ({ groupName: g.name, optionName: o.name, price: o.price }));
    });
    const key = [
      product.id,
      orderType,
      ...selectedOptions.map((s) => `${s.groupName}:${s.optionName}`),
    ].join("|");
    onAdd({
      key,
      productId: product.id,
      name: product.name,
      emoji: product.emoji,
      unitPrice,
      quantity,
      orderType,
      selectedOptions,
      subtotal,
    });
    setSelections({});
    setQuantity(1);
    onClose();
  };

  return (
    <Modal
      open={product !== null}
      onClose={() => {
        setSelections({});
        setQuantity(1);
        onClose();
      }}
      title={product?.name}
      description={product?.description}
    >
      {product && (
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-50 text-4xl">
              {product.emoji}
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{formatIDR(unitPrice)}</p>
              <p className="text-xs text-gray-500">
                {orderType === "DINE_IN" ? "Harga dine-in" : "Harga takeaway"}
                {optionCharge > 0 && " · sudah termasuk opsi"}
              </p>
            </div>
          </div>

          {product.optionGroups.map((group) => (
            <div key={group.id}>
              <p className="mb-2 text-sm font-medium text-gray-900">{group.name}</p>
              {group.multiple ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {group.options.map((option) => {
                    const active = (selections[group.id] ?? []).includes(option.id);
                    return (
                      <button
                        key={option.id}
                        onClick={() => toggleOption(group.id, option.id, true)}
                        className={cn(
                          "flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors duration-150",
                          active
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-white text-gray-700 hover:border-slate-300",
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={cn(
                              "flex h-4 w-4 items-center justify-center rounded border",
                              active ? "border-blue-500 bg-blue-500" : "border-slate-300",
                            )}
                          >
                            {active && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                          </span>
                          {option.name}
                        </span>
                        {option.price > 0 && (
                          <span className="text-xs text-gray-500">+{formatIDR(option.price)}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {group.options.map((option) => {
                    const active = (selections[group.id] ?? []).includes(option.id);
                    return (
                      <button
                        key={option.id}
                        onClick={() => toggleOption(group.id, option.id, false)}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors duration-150",
                          active
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-white text-gray-700 hover:border-slate-300",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded-full border",
                            active ? "border-blue-500" : "border-slate-300",
                          )}
                        >
                          {active && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                        </span>
                        {option.name}
                        {option.price > 0 && (
                          <span className="text-xs text-gray-500">+{formatIDR(option.price)}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <div className="flex items-center gap-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-2 text-gray-500 hover:text-gray-700"
                aria-label="Kurangi"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center text-sm font-medium text-gray-900">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                className="p-2 text-gray-500 hover:text-gray-700"
                aria-label="Tambah"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Subtotal</p>
              <p className="text-lg font-semibold text-gray-900">{formatIDR(subtotal)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-2 flex justify-end">
        <Button onClick={handleAdd} disabled={!product}>
          Tambah ke Cart
        </Button>
      </div>
    </Modal>
  );
}