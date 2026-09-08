"use client";

import { useMemo, useState } from "react";
import { Banknote, CheckCircle2, Landmark, QrCode } from "lucide-react";
import { formatIDR } from "@/lib/format";
import type { Bank, OrderType, PaymentMethod, StoreSettings, Transaction, TransactionItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";

type Step = "method" | "cash" | "bank" | "qris";

export interface CheckoutData {
  items: TransactionItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  orderType: OrderType;
}

function FakeQr({ seed = 7, size = 140 }: { seed?: number; size?: number }) {
  const cells = useMemo(() => {
    let s = seed;
    const rnd = () => {
      s = (s * 16807) % 2147483647;
      return (s % 100) / 100;
    };
    const n = 21;
    const grid: boolean[][] = Array.from({ length: n }, () =>
      Array.from({ length: n }, () => rnd() > 0.55),
    );
    const drawFinder = (ox: number, oy: number) => {
      for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 7; x++) {
          const border = x === 0 || y === 0 || x === 6 || y === 6;
          const center = x >= 2 && x <= 4 && y >= 2 && y <= 4;
          if (ox + x < n && oy + y < n) grid[oy + y][ox + x] = border || center;
        }
      }
    };
    drawFinder(0, 0);
    drawFinder(n - 7, 0);
    drawFinder(0, n - 7);
    return grid;
  }, [seed]);

  const cell = size / 21;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-lg border border-slate-200">
      {cells.flatMap((row, y) =>
        row
          .map((on, x) => (on ? <rect key={`${x}-${y}`} x={x * cell} y={y * cell} width={cell} height={cell} fill="#0f172a" /> : null))
          .filter(Boolean),
      )}
    </svg>
  );
}

export function CheckoutModal({
  open,
  onClose,
  data,
  settings,
  banks,
  cashierName,
  onComplete,
}: {
  open: boolean;
  onClose: () => void;
  data: CheckoutData;
  settings: StoreSettings;
  banks: Bank[];
  cashierName: string;
  onComplete: (method: PaymentMethod, payment: Transaction["payment"]) => void;
}) {
  const [step, setStep] = useState<Step>("method");
  const [amount, setAmount] = useState("");
  const [bankId, setBankId] = useState<string>(banks.find((b) => b.active)?.id ?? "");

  const amountNum = Number(amount) || 0;
  const change = amountNum - data.total;
  const cashInvalid = data.total > 0 && amountNum < data.total;

  const reset = () => {
    setStep("method");
    setAmount("");
  };

  const methodOptions: { value: PaymentMethod; label: string; desc: string; icon: typeof Banknote; enabled: boolean }[] = [
    { value: "CASH", label: "Cash", desc: "Pembayaran tunai", icon: Banknote, enabled: settings.payment.cash },
    { value: "BANK_TRANSFER", label: "Bank Transfer", desc: "Konfirmasi manual", icon: Landmark, enabled: settings.payment.bankTransfer },
    { value: "QRIS", label: "QRIS", desc: "Scan & konfirmasi", icon: QrCode, enabled: settings.payment.qris },
  ];

  const totalSteps = data.total > 0 ? (
    <div className="rounded-lg bg-gray-50 p-3">
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>Subtotal</span>
        <span className="font-medium text-gray-900">{formatIDR(data.subtotal)}</span>
      </div>
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>Pajak ({data.taxRate}%)</span>
        <span className="font-medium text-gray-900">{formatIDR(data.taxAmount)}</span>
      </div>
      <div className="mt-1 flex items-center justify-between border-t border-slate-200 pt-2">
        <span className="font-semibold text-gray-900">Total</span>
        <span className="text-lg font-semibold text-gray-900">{formatIDR(data.total)}</span>
      </div>
    </div>
  ) : null;

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title={step === "method" ? "Checkout" : step === "cash" ? "Pembayaran Cash" : step === "bank" ? "Pembayaran Bank Transfer" : "Pembayaran QRIS"}
      description={`${data.orderType === "DINE_IN" ? "Dine-in" : "Takeaway"} · ${data.items.reduce((s, i) => s + i.quantity, 0)} item`}
    >
      {step === "method" && (
        <div className="space-y-4">
          {totalSteps}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {methodOptions.map((m) => (
              <button
                key={m.value}
                disabled={!m.enabled}
                onClick={() => setStep(m.value === "BANK_TRANSFER" ? "bank" : m.value.toLowerCase() as Step)}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all duration-150",
                  m.enabled
                    ? "border-slate-200 bg-white hover:border-blue-300 hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)]"
                    : "cursor-not-allowed border-slate-100 bg-slate-50 opacity-50",
                )}
              >
                <m.icon className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{m.label}</p>
                  <p className="text-xs text-gray-500">{m.enabled ? m.desc : "Nonaktif"}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "cash" && (
        <div className="space-y-4">
          {totalSteps}
          <div>
            <Label htmlFor="amount">Uang Diterima (Rp)</Label>
            <Input
              id="amount"
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Nominal uang customer"
            />
            {cashInvalid ? (
              <p className="mt-1.5 text-xs text-red-600">Nominal belum mencukupi total transaksi.</p>
            ) : (
              <p className="mt-1.5 text-xs text-gray-500">
                Kembalian:{" "}
                <span className="font-semibold text-gray-900">
                  {amount ? formatIDR(Math.max(change, 0)) : "—"}
                </span>
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setStep("method")}>
              Kembali
            </Button>
            <Button
              disabled={!amount || cashInvalid}
              onClick={() =>
                onComplete("CASH", {
                  amountPaid: amountNum,
                  change: Math.max(change, 0),
                })
              }
            >
              Konfirmasi Cash
            </Button>
          </div>
        </div>
      )}

      {step === "bank" && (
        <div className="space-y-4">
          {totalSteps}
          <div>
            <Label>Pilih Bank</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {banks.map((bank) => (
                <button
                  key={bank.id}
                  disabled={!bank.active}
                  onClick={() => setBankId(bank.id)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl border p-3 text-sm transition-colors duration-150",
                    bankId === bank.id
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : bank.active
                        ? "border-slate-200 bg-white text-gray-700 hover:border-slate-300"
                        : "cursor-not-allowed border-slate-100 bg-slate-50 opacity-50 text-gray-400",
                  )}
                >
                  <span className="text-xl">{bank.logo}</span>
                  {bank.name}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Kasir memeriksa transfer secara manual sebelum konfirmasi.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setStep("method")}>
              Kembali
            </Button>
            <Button
              disabled={!bankId}
              onClick={() => {
                const bank = banks.find((b) => b.id === bankId);
                onComplete("BANK_TRANSFER", {
                  bankId: bank?.id,
                  bankName: bank?.name,
                  bankLogo: bank?.logo,
                });
              }}
            >
              Konfirmasi Transfer
            </Button>
          </div>
        </div>
      )}

      {step === "qris" && (
        <div className="space-y-4">
          {totalSteps}
          <div className="flex flex-col items-center gap-3 py-2">
            <FakeQr />
            <p className="text-sm font-medium text-gray-700">QRIS {settings.name}</p>
            <p className="max-w-xs text-center text-xs text-gray-500">
              Customer scan QRIS di atas untuk membayar. Kasir konfirmasi setelah pembayaran diterima.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setStep("method")}>
              Kembali
            </Button>
            <Button
              onClick={() =>
                onComplete("QRIS", {
                  qrisImage: settings.qrisImage,
                })
              }
            >
              Konfirmasi QRIS
            </Button>
          </div>
        </div>
      )}

      <p className="mt-4 flex items-center gap-1.5 text-xs text-gray-400">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Kasir: {cashierName}
      </p>
    </Modal>
  );
}