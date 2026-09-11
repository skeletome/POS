/*
 * /api/transactions/[id]
 *
 * GET   -> Ambil detail satu transaksi lengkap dengan item-nya.
 *   Alur: cek auth -> cari transaksi by transaction_no & store -> ambil item -> mapping -> return.
 *
 * PATCH -> Ubah status transaksi (mis. batalkan).
 *   Alur: cek auth -> validasi status (Zod) -> hanya Owner yang boleh CANCELLED ->
 *         update status di Supabase -> return { id, status }.
 */
import { NextResponse } from "next/server";
import { requireStoreContext, isOwner } from "@/lib/api/session";
import { transactionStatusUpdateSchema } from "@/lib/schemas";
import type { Transaction, TransactionItem, PaymentInfo } from "@/lib/types/order";
import { createClient } from "@/lib/supabase/server";
import { jsonError, parseJsonBody } from "@/lib/api/utilities";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStoreContext();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Cari transaksi berdasarkan nomornya milik store ini.
    const { data: txn, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("transaction_no", id)
      .eq("store_id", auth.ctx.store.id)
      .maybeSingle();

    if (error) return jsonError("Gagal memuat transaksi.", 500);
    if (!txn) return jsonError("Transaksi tidak ditemukan.", 404);

    // 2. Ambil daftar item transaksi tsb.
    const { data: itemRows, error: iErr } = await supabase
      .from("transaction_items")
      .select("*")
      .eq("transaction_id", txn.id);

    if (iErr) return jsonError("Gagal memuat item transaksi.", 500);

    // 3. Mapping item ke bentuk frontend.
    const items: TransactionItem[] = (itemRows ?? []).map((it) => ({
      productId: it.product_id ?? "",
      productName: it.product_name,
      unitPrice: it.unit_price,
      quantity: it.quantity,
      options: (it.selected_options ?? []).map((o: ItemSnapshot) => ({
        groupId: o.optionId,
        groupName: "",
        optionId: o.optionId,
        optionName: o.optionName,
        price: o.additionalPrice,
      })),
      subtotal: it.subtotal,
    }));

    // 4. Rangkai objek transaksi lengkap.
    const transaction: Transaction = {
      id: txn.transaction_no,
      cashier: txn.cashier_name,
      orderType: txn.order_type as Transaction["orderType"],
      items,
      subtotal: txn.subtotal,
      discountAmount: txn.discount_amount ?? 0,
      voucherCode: txn.voucher_code ?? null,
      taxRate: Number(txn.tax_rate),
      taxAmount: txn.tax_amount,
      total: txn.total,
      payment: mapPayment(txn.payment_method, txn.payment_info),
      status: txn.status as Transaction["status"],
      createdAt: txn.created_at,
    };

    return NextResponse.json({ data: { transaction } });
  } catch {
    return jsonError("Gagal memuat transaksi.", 500);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStoreContext();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const parsedBody = await parseJsonBody<unknown>(request);
  if (!parsedBody.ok) return parsedBody.response;

  const parsed = transactionStatusUpdateSchema.safeParse(parsedBody.data);
  if (!parsed.success) {
    return jsonError("Status tidak valid.", 422);
  }

  // Hanya OWNER yang boleh membatalkan (CANCELLED) transaksi.
  if (parsed.data.status === "CANCELLED" && !isOwner(auth.ctx)) {
    return jsonError("Hanya Owner yang dapat membatalkan transaksi.", 403, "FORBIDDEN");
  }

  try {
    const supabase = await createClient();
    const { data: txn, error } = await supabase
      .from("transactions")
      .update({ status: parsed.data.status })
      .eq("transaction_no", id)
      .eq("store_id", auth.ctx.store.id)
      .select("id, status")
      .maybeSingle();

    if (error) return jsonError("Gagal mengubah status transaksi.", 500);
    if (!txn) return jsonError("Transaksi tidak ditemukan.", 404);

    return NextResponse.json({ data: { id, status: txn.status } });
  } catch {
    return jsonError("Gagal mengubah status transaksi.", 500);
  }
}

interface ItemSnapshot {
  optionId: string;
  optionName: string;
  additionalPrice: number;
}

function mapPayment(method: string, info: Record<string, unknown>): PaymentInfo {
  if (method === "CASH") {
    return {
      method: "CASH",
      amountPaid: Number(info.amountPaid) || 0,
      change: Number(info.change) || 0,
    };
  }
  if (method === "BANK_TRANSFER") {
    return {
      method: "BANK_TRANSFER",
      bankId: String(info.bankId ?? ""),
      bankName: String(info.bankName ?? ""),
    };
  }
  return { method: "QRIS", qrisName: String(info.qrisName ?? "QRIS") };
}
