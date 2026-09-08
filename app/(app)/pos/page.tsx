"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ReceiptText } from "lucide-react";
import {
  computeItemPrice,
  loadCategories,
  loadProducts,
  loadSettings,
  loadTransactions,
  prependTransaction,
  seedBanks,
  taxRateFor,
} from "@/lib/data";
import { getSession } from "@/lib/session";
import { formatDateTime, formatIDR } from "@/lib/format";
import type {
  CartItem,
  OrderType,
  PaymentMethod,
  Product,
  Transaction,
  TransactionItem,
} from "@/lib/types";
import { ProductGrid } from "@/components/pos/product-grid";
import { CustomizationModal } from "@/components/pos/customization-modal";
import { CartPanel, type CartTotals } from "@/components/pos/cart-panel";
import { CheckoutModal, type CheckoutData } from "@/components/pos/checkout-modal";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";

export default function PosPage() {
  const [products] = useState<Product[]>(() => loadProducts());
  const [categories] = useState(() => loadCategories());
  const [settings] = useState(() => loadSettings());
  const [orderType, setOrderType] = useState<OrderType>("DINE_IN");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [lastTx, setLastTx] = useState<Transaction | null>(null);
  const [cashierName, setCashierName] = useState("Rina Kartika");

  useEffect(() => {
    setCashierName(getSession()?.name ?? "Rina Kartika");
  }, []);

  const loadedCount = useMemo(() => loadTransactions().length, []);

  const totals: CartTotals = useMemo(() => {
    const subtotal = cart.reduce((s, i) => s + i.subtotal, 0);
    const rate = settings.tax.enabled
      ? taxRateFor(orderType, settings.tax.dineInRate, settings.tax.takeawayRate)
      : 0;
    const taxAmount = (subtotal * rate) / 100;
    return { subtotal, taxRate: rate, taxAmount, total: subtotal + taxAmount };
  }, [cart, orderType, settings.tax]);

  const handleOrderTypeChange = (newType: OrderType) => {
    if (newType === orderType) return;
    setOrderType(newType);
    setCart((prev) =>
      prev
        .map((item) => {
          const product = products.find((p) => p.id === item.productId);
          if (!product) return item;
          const available = product[newType === "DINE_IN" ? "dineInAvailable" : "takeawayAvailable"];
          if (!available) return null;
          const optionCharge = item.selectedOptions.reduce((s, o) => s + o.price, 0);
          const unitPrice = computeItemPrice(product, newType) + optionCharge;
          return { ...item, orderType: newType, unitPrice, subtotal: unitPrice * item.quantity };
        })
        .filter(Boolean) as CartItem[],
    );
  };

  const handleAdd = (item: CartItem) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.key === item.key);
      if (idx === -1) return [...prev, item];
      const next = [...prev];
      const cur = next[idx];
      next[idx] = { ...cur, quantity: cur.quantity + item.quantity, subtotal: cur.unitPrice * (cur.quantity + item.quantity) };
      return next;
    });
  };

  const handleQuantity = (key: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.key !== key) return item;
          const quantity = item.quantity + delta;
          return { ...item, quantity, subtotal: item.unitPrice * quantity };
        })
        .filter((item) => item.quantity > 0),
    );
  };

  const handleRemove = (key: string) => {
    setCart((prev) => prev.filter((item) => item.key !== key));
  };

  const handleComplete = (method: PaymentMethod, payment: Transaction["payment"]) => {
    const items: TransactionItem[] = cart.map((i) => ({
      productId: i.productId,
      name: i.name,
      emoji: i.emoji,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      orderType: i.orderType,
      selectedOptions: i.selectedOptions,
      subtotal: i.subtotal,
    }));

    const tx: Transaction = {
      id: `TRX-${String(loadedCount + 1).padStart(4, "0")}`,
      storeId: "store-1",
      cashier: cashierName,
      orderType,
      items,
      subtotal: totals.subtotal,
      taxRate: totals.taxRate,
      taxAmount: totals.taxAmount,
      total: totals.total,
      status: "COMPLETED",
      paymentMethod: method,
      payment,
      createdAt: new Date().toISOString(),
    };

    prependTransaction(tx);
    setLastTx(tx);
    setCart([]);
    setCheckoutOpen(false);
  };

  const checkoutData: CheckoutData = {
    items: cart.map((i) => ({
      productId: i.productId,
      name: i.name,
      emoji: i.emoji,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      orderType: i.orderType,
      selectedOptions: i.selectedOptions,
      subtotal: i.subtotal,
    })),
    subtotal: totals.subtotal,
    taxRate: totals.taxRate,
    taxAmount: totals.taxAmount,
    total: totals.total,
    orderType,
  };

  const paymentLabel = (m: PaymentMethod) =>
    m === "CASH" ? "Cash" : m === "BANK_TRANSFER" ? "Bank Transfer" : "QRIS";

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0">
        <ProductGrid
          products={products}
          categories={categories}
          orderType={orderType}
          onOpen={setModalProduct}
        />
      </div>

      <div className="lg:sticky lg:top-[calc(4rem+24px)] lg:h-[calc(100vh-8rem)]">
        <CartPanel
          items={cart}
          orderType={orderType}
          onOrderTypeChange={handleOrderTypeChange}
          onChangeQuantity={handleQuantity}
          onRemoveItem={handleRemove}
          totals={totals}
          onCheckout={() => setCheckoutOpen(true)}
        />
      </div>

      <CustomizationModal
        product={modalProduct}
        orderType={orderType}
        onAdd={handleAdd}
        onClose={() => setModalProduct(null)}
      />

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        data={checkoutData}
        settings={settings}
        banks={seedBanks}
        cashierName={cashierName}
        onComplete={handleComplete}
      />

      <Modal
        open={lastTx !== null}
        onClose={() => setLastTx(null)}
        title="Transaksi Selesai"
        size="sm"
      >
        {lastTx && (
          <div className="flex flex-col items-center gap-4 py-2 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-7 w-7 text-green-600" />
            </div>
            <div>
              <p className="flex items-center justify-center gap-1.5 text-sm font-medium text-gray-900">
                <ReceiptText className="h-4 w-4 text-gray-500" />
                {lastTx.id}
              </p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{formatIDR(lastTx.total)}</p>
              <Badge variant="info" className="mt-2">
                {paymentLabel(lastTx.paymentMethod)}
              </Badge>
            </div>
            <div className="w-full rounded-lg bg-gray-50 p-3 text-left text-xs text-gray-600">
              <p>{lastTx.items.length} item · {lastTx.orderType === "DINE_IN" ? "Dine-in" : "Takeaway"}</p>
              <p>Kasir: {lastTx.cashier}</p>
              <p>{formatDateTime(lastTx.createdAt)}</p>
            </div>
          </div>
        )}
        <div className="mt-2 flex justify-center">
          <Button onClick={() => setLastTx(null)}>Transaksi Baru</Button>
        </div>
      </Modal>
    </div>
  );
}