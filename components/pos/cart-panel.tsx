"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  Landmark,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
  Printer,
  QrCode,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { BankLogo } from "@/components/bank-logo";
import { Button, EmptyState, Input, Modal } from "@/components/ui";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";
import { formatRupiah } from "@/lib/format";
import { paymentMethodLabels } from "@/lib/dummy-data";
import { playSuccessSound, unlockAudio } from "@/lib/sound";
import { computePricing, validateVoucher } from "@/lib/pricing";
import { usePosStore, type PaymentSettings } from "@/lib/use-pos-store";
import type { Bank, PaymentInfo, PaymentMethod, Transaction, Voucher } from "@/lib/types";

export function CartPanel({ onPrint }: { onPrint?: (transaction: Transaction) => void }) {
  const cart = usePosStore((s) => s.cart);
  const orderType = usePosStore((s) => s.orderType);
  const changeQuantity = usePosStore((s) => s.changeQuantity);
  const removeFromCart = usePosStore((s) => s.removeFromCart);
  const clearCart = usePosStore((s) => s.clearCart);
  const taxSettings = usePosStore((s) => s.taxSettings);
  const paymentSettings = usePosStore((s) => s.paymentSettings);
  const banks = usePosStore((s) => s.banks);
  const discounts = usePosStore((s) => s.discounts);
  const vouchers = usePosStore((s) => s.vouchers);
  const user = usePosStore((s) => s.user);
  const qrisName = usePosStore((s) => s.storeSettings.storeName);

  const [view, setView] = useState<"expanded" | "compact">("expanded");
  const [payOpen, setPayOpen] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [paid, setPaid] = useState("");
  const [bankId, setBankId] = useState("");
  const [error, setError] = useState("");
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [pendingBankId, setPendingBankId] = useState("");
  const [processing, setProcessing] = useState(false);
  const [voucherInput, setVoucherInput] = useState("");
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    id: string;
    transaction: Transaction;
  } | null>(null);

  const taxRate = taxSettings.enabled
    ? orderType === "DINE_IN"
      ? taxSettings.dineInRate
      : taxSettings.takeawayRate
    : 0;

  const pricingItems = cart.map((c) => ({
    id: c.id,
    productId: c.productId,
    unitPrice: c.unitPrice,
    quantity: c.quantity,
  }));

  const baseSubtotal = useMemo(
    () => cart.reduce((acc, c) => acc + c.unitPrice * c.quantity, 0),
    [cart],
  );

  const appliedVoucher = useMemo(() => {
    const code = voucherInput.trim().toUpperCase();
    if (!code) return null;
    return vouchers.find((v) => v.code === code) ?? null;
  }, [vouchers, voucherInput]);

  useEffect(() => {
    const code = voucherInput.trim().toUpperCase();
    if (!code) {
      setVoucherError(null);
      return;
    }
    const v = vouchers.find((x) => x.code === code);
    if (!v) {
      setVoucherError("Kode voucher tidak ditemukan");
      return;
    }
    setVoucherError(validateVoucher(v, baseSubtotal));
  }, [vouchers, voucherInput, baseSubtotal]);

  const activeVoucher = useMemo(
    () => (appliedVoucher && validateVoucher(appliedVoucher, baseSubtotal) === null ? appliedVoucher : null),
    [appliedVoucher, baseSubtotal],
  );

  const pricing = useMemo(
    () => computePricing(pricingItems, discounts, activeVoucher, taxRate ?? 0),
    [pricingItems, discounts, activeVoucher, taxRate],
  );

  const { baseSubtotal: subtotal, taxAmount, total } = pricing;

  const amountPaid = Number(paid) || 0;
  const change = amountPaid - total;
  const showCashError = method === "CASH" && amountPaid > 0 && amountPaid < total;
  const canConfirm =
    cart.length > 0 &&
    (method === "CASH"
      ? amountPaid >= total
      : method === "BANK_TRANSFER"
        ? !!bankId
        : true);

  const activeBanks = banks.filter((b) => b.active);
  const selectedBank = activeBanks.find((b) => b.id === bankId);

  const confirm = async () => {
    if (!canConfirm) {
      setError(
        method === "CASH"
          ? "Nominal pembayaran belum mencukupi total"
          : method === "BANK_TRANSFER"
            ? "Pilih bank tujuan transfer"
            : "Lengkapi data pembayaran",
      );
      return;
    }
    unlockAudio();
    setError("");
    setProcessing(true);
    try {
      const totalSnapshot = total;
      const payment: PaymentInfo =
        method === "CASH"
          ? { method: "CASH", amountPaid, change }
          : method === "BANK_TRANSFER"
            ? { method: "BANK_TRANSFER", bankId: selectedBank!.id, bankName: selectedBank!.name }
            : { method: "QRIS", qrisName };

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderType,
          payment,
          cashierName: user?.name ?? "Kasir",
          ...(activeVoucher ? { voucherCode: activeVoucher.code } : {}),
          items: cart.map((c) => ({
            productId: c.productId,
            productName: c.productName,
            unitPrice: c.unitPrice,
            quantity: c.quantity,
            options: c.options,
          })),
        }),
      });

      const body = (await res.json()) as {
        data?: { transactionNo?: string; id?: string; total?: number };
        error?: { message: string };
      };

      if (!res.ok) {
        setError(body.error?.message ?? "Gagal menyimpan transaksi.");
        return;
      }

      const id = body.data?.transactionNo ?? body.data?.id ?? "";
      if (id || body.data) {
        const no = id || `TRX-${new Date().getTime()}`;
        const transaction: Transaction = {
          id: no,
          cashier: user?.name ?? "Kasir",
          orderType,
          items: cart.map((c) => ({
            productId: c.productId,
            productName: c.productName,
            unitPrice: c.unitPrice,
            quantity: c.quantity,
            options: c.options,
            subtotal: c.unitPrice * c.quantity,
          })),
          subtotal: pricing.baseSubtotal,
          discountAmount: pricing.totalDiscount,
          voucherCode: activeVoucher?.code ?? null,
          taxRate: taxSettings.enabled ? taxRate ?? 0 : 0,
          taxAmount,
          total: totalSnapshot,
          payment,
          status: "COMPLETED",
          createdAt: new Date().toISOString(),
        };
        setSuccess({ id: no, transaction });
        playSuccessSound();
        setPayOpen(false);
        setPaid("");
        setBankId("");
        setMethod("CASH");
      }
    } catch {
      setError("Gagal terhubung ke server.");
    } finally {
      setProcessing(false);
    }
  };

  const openBankPicker = () => {
    setPendingBankId(bankId);
    setBankModalOpen(true);
  };

  const finish = () => {
    setSuccess(null);
    clearCart();
  };

  if (success) {
    return (
      <SuccessView
        transactionId={success.id}
        total={success.transaction.total}
        paymentLabel={paymentMethodLabels[success.transaction.payment.method]}
        onDone={finish}
        onPrint={() => onPrint?.(success.transaction)}
      />
    );
  }

  const paymentPanelProps = {
    subtotal: subtotal,
    productDiscount: pricing.productDiscount,
    voucherDiscount: pricing.voucherDiscount,
    totalDiscount: pricing.totalDiscount,
    voucherLabel: activeVoucher?.code ?? null,
    taxAmount,
    taxRate: taxRate ?? 0,
    taxEnabled: taxSettings.enabled,
    total,
    voucherInput,
    setVoucherInput,
    voucherError,
    method,
    setMethod,
    paid,
    setPaid,
    amountPaid,
    change,
    showCashError,
    paymentSettings,
    selectedBank,
    onPickBank: openBankPicker,
    error,
    clearError: () => setError(""),
    qrisName,
    canConfirm,
    onConfirm: confirm,
    processing,
  };

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-text-primary">Keranjang</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setView((v) => (v === "expanded" ? "compact" : "expanded"))}
            className="cursor-pointer flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-text-muted transition-colors duration-150 hover:bg-surface-secondary hover:text-text-primary"
            title={view === "expanded" ? "Tampilkan ringkas" : "Tampilkan daftar besar"}
          >
            {view === "expanded" ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            {view === "expanded" ? "Ringkas" : "Besar"}
          </button>
          {cart.length > 0 ? (
            <button
              onClick={clearCart}
              className="cursor-pointer text-xs font-medium text-text-muted hover:text-error-strong"
            >
              Kosongkan
            </button>
          ) : null}
        </div>
      </div>

      {cart.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart size={20} />}
          title="Keranjang kosong"
          description="Pilih produk dari menu untuk memulai transaksi."
        />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {cart.map((item) => (
            <div
              key={item.id}
              className="flex gap-3 border-b border-border-light py-4 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text-primary">{item.productName}</p>
                {item.options.length > 0 ? (
                  <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-text-muted">
                    {item.options.map((o) => o.optionName).join(", ")}
                  </p>
                ) : null}
                <p className="mt-1 text-xs text-text-secondary">
                  {formatRupiah(item.unitPrice)} × {item.quantity}
                </p>
                {pricing.itemDiscounts[item.id] > 0 ? (
                  <p className="mt-0.5 text-xs font-medium text-error-600">
                    Diskon -{formatRupiah(pricing.itemDiscounts[item.id])}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col items-end justify-between">
                <p className="text-sm font-semibold text-text-primary">
                  {formatRupiah(item.unitPrice * item.quantity)}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => changeQuantity(item.id, -1)}
                    className="cursor-pointer flex h-7 w-7 items-center justify-center rounded border border-border text-text-secondary hover:bg-surface-secondary"
                    aria-label="Kurangi"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="w-7 text-center text-sm font-medium text-text-primary">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => changeQuantity(item.id, 1)}
                    className="cursor-pointer flex h-7 w-7 items-center justify-center rounded border border-border text-text-secondary hover:bg-surface-secondary"
                    aria-label="Tambah"
                  >
                    <Plus size={13} />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="cursor-pointer ml-0.5 flex h-7 w-7 items-center justify-center rounded text-text-muted hover:bg-error-soft hover:text-error-strong"
                    aria-label="Hapus"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "expanded" ? (
        <div className="border-t border-border p-3">
          <VoucherField code={voucherInput} setCode={setVoucherInput} error={voucherError} />
          <SummaryRow label="Subtotal" value={formatRupiah(pricing.baseSubtotal)} />
          {pricing.productDiscount > 0 && (
            <SummaryRow label="Diskon Produk" value={`-${formatRupiah(pricing.productDiscount)}`} />
          )}
          {activeVoucher && pricing.voucherDiscount > 0 && (
            <SummaryRow label={`Voucher ${activeVoucher.code}`} value={`-${formatRupiah(pricing.voucherDiscount)}`} />
          )}
          <SummaryRow
            label="Pajak"
            value={
              taxSettings.enabled
                ? `${formatRupiah(pricing.taxAmount)} (${Math.round((taxRate ?? 0) * 100)}%)`
                : "Nonaktif"
            }
          />
          <div className="my-2 border-t border-dashed border-border-strong" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-text-primary">Total</span>
            <span className="text-xl font-semibold text-text-primary">{formatRupiah(pricing.total)}</span>
          </div>
          <Button
            className="mt-3 w-full"
            size="lg"
            onClick={() => setPayOpen(true)}
            disabled={cart.length === 0}
          >
            Konfirmasi Pembayaran · {formatRupiah(pricing.total)}
          </Button>
        </div>
      ) : (
        <div className="min-h-0 overflow-y-auto border-t border-border p-4">
          <PaymentPanel {...paymentPanelProps} />
        </div>
      )}

      <Modal
        open={bankModalOpen}
        onClose={() => setBankModalOpen(false)}
        title="Pilih Bank Tujuan"
        width="max-w-md"
        zIndex={60}
      >
        <div className="space-y-2">
          {activeBanks.length === 0 ? (
            <EmptyState
              icon={<Landmark size={20} />}
              title="Tidak ada bank aktif"
              description="Aktifkan bank terlebih dahulu pada Pengaturan."
            />
          ) : (
            activeBanks.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setPendingBankId(b.id)}
                className={cn(
                  "cursor-pointer flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors duration-150",
                  pendingBankId === b.id
                    ? "border-primary-500 bg-primary-50"
                    : "border-border bg-surface hover:bg-surface-secondary",
                )}
              >
                <BankLogo bank={b} />
                <span className="flex-1 text-sm font-medium text-text-primary">{b.name}</span>
                <span
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-full border",
                    pendingBankId === b.id
                      ? "border-primary-500 bg-primary-500"
                      : "border-border-strong",
                  )}
                >
                  {pendingBankId === b.id ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
                </span>
              </button>
            ))
          )}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setBankModalOpen(false)}>
            Batal
          </Button>
          <Button
            disabled={!pendingBankId}
            onClick={() => {
              setBankId(pendingBankId);
              setError("");
              setBankModalOpen(false);
            }}
          >
            Konfirmasi
          </Button>
        </div>
      </Modal>

      <Modal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        title="Konfirmasi Pembayaran"
        width="max-w-md"
      >
        <PaymentPanel {...paymentPanelProps} />
      </Modal>
    </div>
  );
}

interface PaymentPanelProps {
  subtotal: number;
  productDiscount: number;
  voucherDiscount: number;
  totalDiscount: number;
  voucherLabel?: string | null;
  taxAmount: number;
  taxRate: number;
  taxEnabled: boolean;
  total: number;
  voucherInput: string;
  setVoucherInput: (v: string) => void;
  voucherError: string | null;
  method: PaymentMethod;
  setMethod: (m: PaymentMethod) => void;
  paid: string;
  setPaid: (v: string) => void;
  amountPaid: number;
  change: number;
  showCashError: boolean;
  paymentSettings: PaymentSettings;
  selectedBank?: Bank;
  onPickBank: () => void;
  error: string;
  clearError: () => void;
  qrisName: string;
  canConfirm: boolean;
  onConfirm: () => void;
  processing: boolean;
}

function PaymentPanel({
  subtotal,
  productDiscount,
  voucherDiscount,
  totalDiscount,
  voucherLabel,
  taxAmount,
  taxRate,
  taxEnabled,
  total,
  voucherInput,
  setVoucherInput,
  voucherError,
  method,
  setMethod,
  paid,
  setPaid,
  amountPaid,
  change,
  showCashError,
  paymentSettings,
  selectedBank,
  onPickBank,
  error,
  clearError,
  qrisName,
  canConfirm,
  onConfirm,
  processing,
}: PaymentPanelProps) {
  return (
    <div className="space-y-3">
      <div>
        <VoucherField code={voucherInput} setCode={setVoucherInput} error={voucherError} />
        <SummaryRow label="Subtotal" value={formatRupiah(subtotal)} />
        {productDiscount > 0 && (
          <SummaryRow label="Diskon Produk" value={`-${formatRupiah(productDiscount)}`} />
        )}
        {voucherLabel && voucherDiscount > 0 && (
          <SummaryRow label={`Voucher ${voucherLabel}`} value={`-${formatRupiah(voucherDiscount)}`} />
        )}
        <SummaryRow
          label="Pajak"
          value={
            taxEnabled
              ? `${formatRupiah(taxAmount)} (${Math.round(taxRate * 100)}%)`
              : "Nonaktif"
          }
        />
        <div className="my-3 border-t border-dashed border-border-strong" />
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-text-primary">Total</span>
          <span className="text-xl font-semibold text-text-primary">{formatRupiah(total)}</span>
        </div>
      </div>

      <PaymentMethodSelector current={method} onChange={setMethod} enabled={paymentSettings} />

      {method === "CASH" ? (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-primary">Uang Diterima</label>
          <input
            inputMode="numeric"
            className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-placeholder focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            placeholder="Masukkan nominal"
            value={paid}
            onChange={(e) => {
              setPaid(e.target.value.replace(/[^\d]/g, ""));
              clearError();
            }}
          />
          {amountPaid > 0 ? (
            <div
              className={cn(
                "mt-2 flex items-center justify-between rounded-lg px-3 py-2 text-sm",
                showCashError ? "bg-error-soft text-error-strong" : "bg-success-soft text-success-strong",
              )}
            >
              <span>Kembalian</span>
              <span className="font-semibold">{formatRupiah(change)}</span>
            </div>
          ) : null}
        </div>
      ) : null}

      {method === "BANK_TRANSFER" ? (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-primary">Bank Tujuan</label>
          {selectedBank ? (
            <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <BankLogo bank={selectedBank} />
                <span className="text-sm font-medium text-text-primary">{selectedBank.name}</span>
              </div>
              <button type="button" onClick={onPickBank} className="cursor-pointer text-xs font-medium text-primary-600 hover:underline">
                Ganti
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onPickBank}
              className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors duration-150 hover:border-primary-400 hover:text-primary-600"
            >
              <Landmark size={16} />
              Pilih Bank
            </button>
          )}
        </div>
      ) : null}

      {method === "QRIS" ? (
        <div className="flex flex-col items-center rounded-lg border border-border bg-surface-secondary p-4 text-center">
          <div className="flex h-28 w-28 items-center justify-center rounded-lg bg-white p-2">
            <div className="grid h-full w-full grid-cols-5 gap-0.5">
              {Array.from({ length: 25 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-[2px]",
                    Math.sin(i * 12.9898) > 0.1 ? "bg-slate-900" : "bg-white",
                  )}
                />
              ))}
            </div>
          </div>
          <p className="mt-3 text-xs text-text-muted">Pelanggan memindai QRIS lalu membayar</p>
          <p className="text-sm font-medium text-text-primary">{qrisName}</p>
        </div>
      ) : null}

      {error ? <p className="text-xs font-medium text-error-strong">{error}</p> : null}

      <Button className="w-full" size="lg" onClick={onConfirm} disabled={!canConfirm || processing}>
        {processing ? (
          <><Spinner /> Memproses…</>
        ) : (
          `Konfirmasi Pembayaran · ${formatRupiah(total)}`
        )}
      </Button>
      <p className="text-center text-[11px] text-text-muted">
        Konfirmasi manual — aplikasi tidak memverifikasi pembayaran secara otomatis.
      </p>
    </div>
  );
}

function PaymentMethodSelector({
  current,
  onChange,
  enabled,
}: {
  current: PaymentMethod;
  onChange: (m: PaymentMethod) => void;
  enabled: PaymentSettings;
}) {
  const methods: { key: PaymentMethod; label: string; icon: React.ReactNode }[] = [
    { key: "CASH", label: "Cash", icon: <Banknote size={16} /> },
    { key: "BANK_TRANSFER", label: "Transfer", icon: <CreditCard size={16} /> },
    { key: "QRIS", label: "QRIS", icon: <QrCode size={16} /> },
  ];
  const available = methods.filter((m) =>
    m.key === "CASH"
      ? enabled.cashEnabled
      : m.key === "BANK_TRANSFER"
        ? enabled.bankEnabled
        : enabled.qrisEnabled,
  );

  return (
    <div className="grid grid-cols-3 gap-2">
      {available.map((m) => (
        <button
          key={m.key}
          onClick={() => onChange(m.key)}
          className={cn(
            "cursor-pointer flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-xs font-medium transition-colors duration-150",
            current === m.key
              ? "border-primary-500 bg-primary-50 text-primary-600"
              : "border-border bg-surface text-text-secondary hover:bg-surface-secondary",
          )}
        >
          {m.icon}
          {m.label}
        </button>
      ))}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5 text-sm">
      <span className="text-text-muted">{label}</span>
      <span className="font-medium text-text-primary">{value}</span>
    </div>
  );
}

function VoucherField({
  code,
  setCode,
  error,
}: {
  code: string;
  setCode: (v: string) => void;
  error: string | null;
}) {
  return (
    <div className="mb-3">
      <label className="mb-1 block text-xs font-medium text-text-secondary">Kode Voucher (opsional)</label>
      <Input
        placeholder="Masukkan kode voucher"
        className="uppercase font-semibold tracking-wide"
        value={code.toUpperCase()}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
      />
      {error ? (
        <p className="mt-1 text-xs font-medium text-error-strong">{error}</p>
      ) : null}
    </div>
  );
}

function SuccessView({
  transactionId,
  total,
  paymentLabel,
  onDone,
  onPrint,
}: {
  transactionId: string;
  total: number;
  paymentLabel: string;
  onDone: () => void;
  onPrint: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-full flex-col items-center justify-center gap-3 rounded-xl border border-border bg-surface p-6 text-center"
    >
      <AnimatePresence>
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success-500"
        >
          <CheckCircle2 size={32} />
        </motion.div>
      </AnimatePresence>
      <h3 className="text-base font-semibold text-text-primary">Transaksi Berhasil</h3>
      <p className="text-sm text-text-muted">
        {transactionId} · {formatRupiah(total)} · {paymentLabel}
      </p>
      <Button onClick={onPrint} className="mt-2 w-full">
        <Printer size={16} />
        Cetak Struk
      </Button>
      <Button variant="secondary" onClick={onDone} className="w-full">
        Transaksi Baru
      </Button>
    </motion.div>
  );
}