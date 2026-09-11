/*
 * /api/transactions
 *
 * GET  -> Ambil daftar transaksi milik store (bisa difilter rentang tanggal & batas jumlah).
 *   Alur: cek auth -> parse query (from/to/limit) -> ambil transaksi + item-nya dari Supabase ->
 *         mapping ke bentuk frontend -> return.
 *
 * POST -> Buat transaksi baru (di-rate-limit).
 *   Alur: cek auth -> rate limit -> validasi body (Zod) ->
 *         hitung ulang subtotal/pajak/total SERVER-SIDE (jangan percaya client) ->
 *         validasi nominal pembayaran -> panggil RPC create_transaction -> return transaksi.
 */
import { NextResponse } from "next/server";
import { requireStoreContext } from "@/lib/api/session";
import { transactionCreateSchema } from "@/lib/schemas";
import type { Transaction, TransactionItem, PaymentInfo } from "@/lib/types/order";
import { createClient } from "@/lib/supabase/server";
import { jsonError, parseJsonBody, getDateRangeParam } from "@/lib/api/utilities";
import { writeLimiter, rateLimit } from "@/lib/rate-limit";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

export async function GET(request: Request) {
  const auth = await requireStoreContext();
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(request.url);
    const { from, to } = getDateRangeParam(url);

    const pageParam = Number(url.searchParams.get("page") ?? "1");
    const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;

    // dukung param `limit` lama sebagai ukuran halaman (backward-compat)
    const pageSizeParam = url.searchParams.get("pageSize") ?? url.searchParams.get("limit");
    const pageSizeRaw = Number(pageSizeParam ?? String(DEFAULT_PAGE_SIZE));
    const pageSize = Number.isFinite(pageSizeRaw) && pageSizeRaw > 0
      ? Math.min(Math.floor(pageSizeRaw), MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;

    const search = url.searchParams.get("search")?.trim() ?? "";
    const status = url.searchParams.get("status")?.trim() ?? "";
    const payment = url.searchParams.get("payment")?.trim() ?? "";
    const orderType = url.searchParams.get("orderType")?.trim() ?? "";
    const cashier = url.searchParams.get("cashier")?.trim() ?? "";
    const sortBy = url.searchParams.get("sortBy") === "total" ? "total" : "created_at";
    const sortDir = url.searchParams.get("sortDir") === "asc" ? "asc" : "desc";

    const supabase = await createClient();

    type TransactionsQuery = ReturnType<ReturnType<typeof supabase.from>["select"]>;

    const withFilters = (q: TransactionsQuery): TransactionsQuery => {
      let query = q;
      if (from) query = query.gte("created_at", from);
      if (to) query = query.lte("created_at", to);
      if (search) query = query.ilike("transaction_no", `%${search}%`);
      if (status) query = query.eq("status", status);
      if (payment) query = query.eq("payment_method", payment);
      if (orderType) query = query.eq("order_type", orderType);
      if (cashier) query = query.eq("cashier_name", cashier);
      return query;
    };

    // total untuk pagination (head: hanya count, tanpa body)
    const countQuery = withFilters(
      supabase.from("transactions").select("id", { count: "exact", head: true }),
    ).eq("store_id", auth.ctx.store.id);
    const { count: total, error: countError } = await countQuery;
    if (countError) return jsonError("Gagal memuat transaksi.", 500);

    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    // ambil data halaman: filter + urutkan -> range
    const { data: rows, error } = await withFilters(
      supabase
        .from("transactions")
        .select("*")
        .eq("store_id", auth.ctx.store.id)
        .order(sortBy, { ascending: sortDir === "asc" })
        .order("created_at", { ascending: false }),
    ).range(start, end);
    if (error) return jsonError("Gagal memuat transaksi.", 500);

    // Ambil item untuk seluruh transaksi sekaligus (efisien, 1 query).
    const txnIds = ((rows ?? []) as TrxRow[]).map((t) => t.id);
    const { data: itemRows } = txnIds.length
      ? await supabase.from("transaction_items").select("*").in("transaction_id", txnIds)
      : { data: [] };

    interface TxnItemDbRow extends ItemRow {
      transaction_id: string;
    }

    const itemsByTxn = new Map<string, TxnItemDbRow[]>();
    for (const it of (itemRows ?? []) as TxnItemDbRow[]) {
      const list = itemsByTxn.get(it.transaction_id) ?? [];
      list.push(it);
      itemsByTxn.set(it.transaction_id, list);
    }

    const transactions: Transaction[] = ((rows ?? []) as TrxRow[]).map((t) =>
      toFrontendTransaction(t, (itemsByTxn.get(t.id) ?? []) as ItemRow[]),
    );

    return NextResponse.json({
      data: { transactions, total: total ?? 0, page, pageSize },
    });
  } catch {
    return jsonError("Gagal memuat transaksi.", 500);
  }
}

export async function POST(request: Request) {
  const auth = await requireStoreContext();
  if (!auth.ok) return auth.response;

  // Rate limit pembuatan transaksi berdasarkan user.
  const limited = await rateLimit(writeLimiter, `transaction:${auth.ctx.profile.id}`);
  if (limited) return limited;

  const parsedBody = await parseJsonBody<unknown>(request);
  if (!parsedBody.ok) return parsedBody.response;

  const parsed = transactionCreateSchema.safeParse(parsedBody.data);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Data transaksi tidak valid.", 422);
  }

  try {
    const { orderType, payment, items, voucherCode } = parsed.data;

    // SECURITY: Do NOT compute totals server-side from client values.
    // The RPC create_transaction looks up canonical prices from the products table
    // based on order_type, ignoring any client-supplied unitPrice.

    // 1. Siapkan bentuk data untuk RPC — only send quantity & product metadata, NOT prices.
    const p_items = items.map((it) => ({
      product_id: it.productId,
      product_name: it.productName,
      quantity: it.quantity,
      selected_options: it.options.map((o) => ({
        optionId: o.optionId,
        optionName: o.optionName,
      })),
    }));

    const p_payment_info =
      payment.method === "CASH"
        ? { amountPaid: payment.amountPaid, change: payment.change }
        : payment.method === "BANK_TRANSFER"
          ? { bankId: payment.bankId, bankName: payment.bankName }
          : { qrisName: payment.qrisName };

    // 2. Simpan transaksi lewat RPC di Supabase (RPC computes prices from DB).
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("create_transaction", {
      p_store_id: auth.ctx.store.id,
      p_cashier_id: auth.ctx.profile.id,
      p_cashier_name: auth.ctx.profile.name,
      p_order_type: orderType,
      p_payment_method: payment.method,
      p_payment_info,
      p_items,
      p_voucher_code: voucherCode ? voucherCode.trim().toUpperCase() : null,
    });

    if (error) {
      const msg = error.message ?? "Gagal menyimpan transaksi.";
      if (/voucher|minimum/i.test(msg)) {
        return jsonError(msg, 422, "INVALID_VOUCHER");
      }
      return jsonError(msg, 500);
    }

    // 3. After RPC returns, validate payment against the DB-computed total.
    if (data && payment.method === "CASH" && payment.amountPaid < Number(data.total)) {
      return jsonError(
        `Nominal pembayaran kurang. Total: Rp ${Number(data.total).toLocaleString("id-ID")}.`,
        422,
        "INSUFFICIENT_PAYMENT",
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return jsonError("Gagal menyimpan transaksi.", 500);
  }
}

interface TrxRow {
  id: string;
  transaction_no: string;
  cashier_name: string;
  order_type: string;
  subtotal: number;
  discount_amount: number;
  voucher_code: string | null;
  tax_rate: number | string;
  tax_amount: number;
  total: number;
  payment_method: string;
  payment_info: Record<string, unknown>;
  status: string;
  created_at: string;
}

interface ItemRow {
  product_id: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  selected_options: { optionId: string; optionName: string; additionalPrice: number }[];
}

function toFrontendTransaction(t: TrxRow, items: ItemRow[]): Transaction {
  const payment: PaymentInfo = mapPayment(t);
  const transactionItems: TransactionItem[] = items.map((it) => ({
    productId: it.product_id ?? "",
    productName: it.product_name,
    unitPrice: it.unit_price,
    quantity: it.quantity,
    options: (it.selected_options ?? []).map((o) => ({
      groupId: o.optionId,
      groupName: itemOptionGroupName(o),
      optionId: o.optionId,
      optionName: o.optionName,
      price: o.additionalPrice,
    })),
    subtotal: it.subtotal,
  }));

  return {
    id: t.transaction_no,
    cashier: t.cashier_name,
    orderType: t.order_type as Transaction["orderType"],
    items: transactionItems,
    subtotal: t.subtotal,
    discountAmount: t.discount_amount ?? 0,
    voucherCode: t.voucher_code ?? null,
    taxRate: Number(t.tax_rate),
    taxAmount: t.tax_amount,
    total: t.total,
    payment,
    status: t.status as Transaction["status"],
    createdAt: t.created_at,
  };
}

function mapPayment(t: TrxRow): PaymentInfo {
  const info = t.payment_info ?? {};
  if (t.payment_method === "CASH") {
    return {
      method: "CASH",
      amountPaid: Number(info.amountPaid) || 0,
      change: Number(info.change) || 0,
    };
  }
  if (t.payment_method === "BANK_TRANSFER") {
    return {
      method: "BANK_TRANSFER",
      bankId: String(info.bankId ?? ""),
      bankName: String(info.bankName ?? ""),
    };
  }
  return { method: "QRIS", qrisName: String(info.qrisName ?? "QRIS") };
}

function itemOptionGroupName(o: { optionId: string; optionName: string }) {
  return o.optionId ? o.optionName : o.optionName;
}
