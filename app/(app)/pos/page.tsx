"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { OrderTypeToggle, ProductGrid } from "@/components/pos/product-grid";
import { ProductModal } from "@/components/pos/product-modal";
import { CartPanel } from "@/components/pos/cart-panel";
import { Button, Modal } from "@/components/ui";
import { Printer } from "lucide-react";
import { ProductGridSkeleton, CartSkeleton } from "@/components/skeletons";
import { usePosStore } from "@/lib/use-pos-store";
import type { Product, Transaction } from "@/lib/types";

const PDFPreview = dynamic(
  () => import("@/components/pos/pdf-preview"),
  { ssr: false },
);

type PrintTrx = { transaction: Transaction; url: string } | null;

export default function PosPage() {
  const orderType = usePosStore((s) => s.orderType);
  const setOrderType = usePosStore((s) => s.setOrderType);
  const cartCount = usePosStore((s) => s.cart.reduce((a, c) => a + c.quantity, 0));
  const storeSettings = usePosStore((s) => s.storeSettings);
  const dataLoaded = usePosStore((s) => s.dataLoaded);
  const [selected, setSelected] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [printTrx, setPrintTrx] = useState<PrintTrx>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const open = (p: Product) => {
    setSelected(p);
    setModalOpen(true);
  };

  const handlePrint = async (trx: Transaction) => {
    try {
      const { generateReceiptUrl } = await import("@/lib/receipt-pdf");
      const url = await generateReceiptUrl(
        trx,
        storeSettings.storeName,
        storeSettings.information,
      );
      setPrintTrx({ transaction: trx, url });
      setPreviewOpen(true);
    } catch {
      setPreviewOpen(true);
      setPrintTrx(null);
    }
  };

  useEffect(() => {
    return () => {
      if (printTrx) URL.revokeObjectURL(printTrx.url);
    };
  }, [printTrx]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (usePosStore.getState().cart.length > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 lg:h-[calc(100vh-8.5rem)] lg:min-h-[560px] lg:grid-cols-[1fr_400px]">
        <div className="flex min-h-[540px] flex-col rounded-xl border border-border bg-surface p-4 lg:min-h-0">
          <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
            <OrderTypeToggle orderType={orderType} onChange={setOrderType} />
            <span className="hidden shrink-0 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-600 sm:block">
              {cartCount} item di keranjang
            </span>
          </div>
          <div className="min-h-0 flex-1">
            {!dataLoaded ? <ProductGridSkeleton /> : <ProductGrid onOpen={open} />}
          </div>
        </div>

        <div className="min-h-0">
          {!dataLoaded ? <CartSkeleton /> : <CartPanel onPrint={handlePrint} />}
        </div>

        <ProductModal
          product={selected}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
        />
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