"use client";

import { ArrowLeft, Ban, CreditCard, Printer, QrCode, ReceiptText, Wallet } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button, Card, EmptyState, Modal, StatusBadge } from "@/components/ui";
import { formatDateTime, formatRupiah } from "@/lib/format";
import { orderTypeLabels, paymentMethodLabels } from "@/lib/dummy-data";
import { usePosStore } from "@/lib/use-pos-store";
import { useTransaction, useUpdateTransactionStatus } from "@/lib/api/hooks";
import type { Transaction } from "@/lib/types";

const PDFPreview = dynamic(
  () => import("@/components/pos/pdf-preview"),
  { ssr: false },
);

type PrintTrx = { transaction: Transaction; url: string } | null;

export default function TransactionDetailPage() {
  const params = useParams<{ id: string }>();
  const fromStore = usePosStore((s) => s.transactions.find((t) => t.id === params.id));
  const user = usePosStore((s) => s.user);
  const storeSettings = usePosStore((s) => s.storeSettings);
  const { data: fetched, isLoading: detailLoading } = useTransaction(params.id);
  const transaction = fromStore ?? fetched;
  const updateStatus = useUpdateTransactionStatus(transaction?.id ?? "");
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [printTrx, setPrintTrx] = useState<PrintTrx>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    return () => {
      if (printTrx) URL.revokeObjectURL(printTrx.url);
    };
  }, [printTrx]);

  const handlePrint = async (trx: Transaction) => {
    setPrinting(true);
    setPrintTrx(null);
    try {
      const { generateReceiptUrl } = await import("@/lib/receipt-pdf");
      const url = await generateReceiptUrl(
        trx,
        storeSettings.storeName,
        storeSettings.information,
      );
      setPrintTrx({ transaction: trx, url });
    } catch {
      setPrintTrx(null);
    } finally {
      setPrinting(false);
      setPreviewOpen(true);
    }
  };

  if (!transaction && detailLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-sm text-text-muted">Memuat transaksi…</div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="py-10">
        <EmptyState
          icon={<ReceiptText size={20} />}
          title="Transaksi tidak ditemukan"
          description="Transaksi yang Anda cari tidak tersedia."
          action={
            <Link href="/transactions">
              <Button variant="secondary">Kembali ke Riwayat</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const cancelable =
    user?.role === "OWNER" &&
    (transaction.status === "COMPLETED" || transaction.status === "PENDING");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/transactions"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-text-secondary hover:bg-surface-secondary"
            aria-label="Kembali"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              Transaksi {transaction.id}
            </h2>
            <p className="text-sm text-text-muted">
              {formatDateTime(transaction.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            disabled={printing}
            onClick={() => void handlePrint(transaction)}
          >
            <Printer size={16} />
            {printing ? "Menyiapkan…" : "Cetak Struk"}
          </Button>
          <StatusBadge status={transaction.status} />
          {cancelable ? (
            <Button
              variant="danger"
              disabled={updateStatus.isPending}
              onClick={() => {
                setCancelError(null);
                updateStatus.mutate("CANCELLED", {
                  onError: (e) => setCancelError(e.message),
                });
              }}
            >
              <Ban size={16} />
              {updateStatus.isPending ? "Membatalkan…" : "Batalkan Transaksi"}
            </Button>
          ) : null}
          {cancelError ? (
            <p className="text-xs font-medium text-error-strong">{cancelError}</p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <h3 className="mb-4 text-base font-semibold text-text-primary">Item</h3>
          <div className="space-y-3">
            {transaction.items.map((item, i) => (
              <div key={i} className="flex items-start gap-3 border-b border-border-light pb-3 last:border-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-sm">
                  🍽️
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary">{item.productName}</p>
                  {item.options.length > 0 ? (
                    <p className="mt-0.5 text-xs text-text-muted">
                      {item.options.map((o) => `${o.optionName}${o.price > 0 ? ` +${formatRupiah(o.price).replace("Rp", "")}` : ""}`).join(" · ")}
                    </p>
                  ) : null}
                  <p className="mt-0.5 text-xs text-text-muted">
                    {formatRupiah(item.unitPrice)} × {item.quantity}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-text-primary">
                  {formatRupiah(item.subtotal)}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-5">
          <Card>
            <h3 className="mb-3 text-base font-semibold text-text-primary">Ringkasan</h3>
            <Row label="Subtotal" value={formatRupiah(transaction.subtotal)} />
            {transaction.discountAmount > 0 ? (
              <Row
                label={transaction.voucherCode ? `Diskon (${transaction.voucherCode})` : "Diskon Produk"}
                value={`-${formatRupiah(transaction.discountAmount)}`}
              />
            ) : null}
            <Row
              label="Pajak"
              value={`${formatRupiah(transaction.taxAmount)} (${Math.round(transaction.taxRate * 100)}%)`}
            />
            <div className="my-3 border-t border-dashed border-border-strong" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-text-primary">Total</span>
              <span className="text-xl font-semibold text-text-primary">
                {formatRupiah(transaction.total)}
              </span>
            </div>
          </Card>

          <Card>
            <h3 className="mb-3 text-base font-semibold text-text-primary">Pembayaran</h3>
            <Row label="Metode" value={paymentMethodLabels[transaction.payment.method]} />
            <Row label="Tipe Order" value={orderTypeLabels[transaction.orderType]} />
            <Row label="Kasir" value={transaction.cashier} />

            <div className="mt-3 flex items-center gap-2 rounded-lg bg-surface-secondary px-3 py-2.5">
              {transaction.payment.method === "CASH" ? (
                <Wallet size={16} className="shrink-0 text-success-500" />
              ) : transaction.payment.method === "BANK_TRANSFER" ? (
                <CreditCard size={16} className="shrink-0 text-primary-500" />
              ) : (
                <QrCode size={16} className="shrink-0 text-warning-500" />
              )}
              <div className="text-sm">
                {transaction.payment.method === "CASH" ? (
                  <>
                    <p className="text-text-muted">Dibayar {formatRupiah(transaction.payment.amountPaid)}</p>
                    <p className="font-medium text-text-primary">
                      Kembalian {formatRupiah(transaction.payment.change)}
                    </p>
                  </>
                ) : transaction.payment.method === "BANK_TRANSFER" ? (
                  <p className="font-medium text-text-primary">
                    Transfer ke {transaction.payment.bankName}
                  </p>
                ) : (
                  <p className="font-medium text-text-primary">{transaction.payment.qrisName}</p>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Cetak Struk"
        width="max-w-3xl"
      >
        {printTrx ? (
          <div>
            <PDFPreview url={printTrx.url} />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setPreviewOpen(false)}>
                Tutup
              </Button>
              <a
                href={printTrx.url}
                download={`struk-${printTrx.transaction.id}.pdf`}
              >
                <Button type="button">
                  <Printer size={16} />
                  Unduh / Cetak PDF
                </Button>
              </a>
            </div>
          </div>
        ) : (
          <p className="text-sm text-error-strong">
            Gagal membuat struk PDF. Coba lagi.
          </p>
        )}
      </Modal>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5 text-sm">
      <span className="text-text-muted">{label}</span>
      <span className="font-medium text-text-primary">{value}</span>
    </div>
  );
}