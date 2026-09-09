import * as XLSX from "xlsx";
import { formatRupiah } from "@/lib/format";
import { formatDateTime } from "@/lib/format";
import { orderTypeLabels, paymentMethodLabels } from "@/lib/dummy-data";
import type { Transaction, PaymentMethod } from "@/lib/types";

type ExportTab = "sales" | "products" | "payments";

function rupiah(n: number): string {
  return formatRupiah(n);
}

export function exportReportExcel(
  tab: ExportTab,
  transactions: Transaction[],
  products: { name: string; qty: number; revenue: number }[],
  payments: Record<PaymentMethod, { count: number; total: number }>,
  filenameBase: string,
) {
  const wb = XLSX.utils.book_new();

  if (tab === "sales") {
    const rows = transactions.map((t) => ({
      "No. Struk": t.id,
      Tanggal: formatDateTime(t.createdAt),
      Kasir: t.cashier,
      "Tipe Order": orderTypeLabels[t.orderType],
      "Metode Bayar": paymentMethodLabels[t.payment.method],
      Subtotal: t.subtotal,
      Pajak: t.taxAmount,
      Total: t.total,
      "Subtotal (Rp)": rupiah(t.subtotal),
      "Total (Rp)": rupiah(t.total),
    }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, sheet, "Sales");
  }

  if (tab === "products") {
    const rows = products.map((p) => ({
      Produk: p.name,
      "Qty Terjual": p.qty,
      Revenue: p.revenue,
      "Revenue (Rp)": rupiah(p.revenue),
    }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, sheet, "Produk");
  }

  if (tab === "payments") {
    const rows = (["CASH", "BANK_TRANSFER", "QRIS"] as PaymentMethod[]).map((m) => ({
      Metode: paymentMethodLabels[m],
      Transaksi: payments[m].count,
      Total: payments[m].total,
      "Total (Rp)": rupiah(payments[m].total),
    }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, sheet, "Pembayaran");
  }

  XLSX.writeFile(wb, `${filenameBase}.xlsx`);
}
