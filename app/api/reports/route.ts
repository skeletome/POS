/*
 * GET /api/reports
 *
 * Alur (flow):
 *   1. Cek user sudah login & punya store.
 *   2. Ambil transaksi (bukan CANCELLED) dalam rentang tanggal (opsional).
 *   3. Ambil item transaksi utk agregasi produk.
 *   4. Hitung ringkasan: total penjualan, jumlah transaksi, item terjual, rata-rata.
 *   5. Hitung produk terlaris & breakdown metode pembayaran.
 *   6. Return lapornya.
 */
import { NextResponse } from "next/server";
import { requireStoreContext } from "@/lib/api/session";
import { createClient } from "@/lib/supabase/server";
import { jsonError, getDateRangeParam } from "@/lib/api/utilities";

export async function GET(request: Request) {
  const auth = await requireStoreContext();
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(request.url);
    const { from, to } = getDateRangeParam(url);
    const supabase = await createClient();

    // 1. Ambil transaksi (tidak termasuk yang dibatalkan) dalam rentang tanggal.
    let q = supabase
      .from("transactions")
      .select("id, transaction_no, total, payment_method, created_at")
      .eq("store_id", auth.ctx.store.id)
      .neq("status", "CANCELLED");

    if (from) q = q.gte("created_at", from);
    if (to) q = q.lte("created_at", to);

    const { data: txns, error } = await q;
    if (error) return jsonError("Gagal memuat laporan.", 500);

    // 2. Ambil seluruh item dari transaksi tsb.
    const txnIds = (txns ?? []).map((t) => t.id);
    const { data: items } = txnIds.length
      ? await supabase
          .from("transaction_items")
          .select("transaction_id, product_name, quantity, subtotal")
          .in("transaction_id", txnIds)
      : { data: [] };

    // 3. Hitung ringkasan total.
    const totalSales = (txns ?? []).reduce((acc, t) => acc + t.total, 0);
    const totalTransactions = (txns ?? []).length;
    const totalItemsSold = (items ?? []).reduce((acc, i) => acc + i.quantity, 0);
    const averageTransactionValue =
      totalTransactions > 0 ? Math.round(totalSales / totalTransactions) : 0;

    // 4. Agregasi produk terlaris (berdasarkan jumlah & revenue).
    const productMap = new Map<string, { quantity: number; revenue: number }>();
    for (const i of items ?? []) {
      const cur = productMap.get(i.product_name) ?? { quantity: 0, revenue: 0 };
      cur.quantity += i.quantity;
      cur.revenue += i.subtotal;
      productMap.set(i.product_name, cur);
    }
    const topProducts = Array.from(productMap.entries())
      .map(([name, v]) => ({ name, quantity: v.quantity, revenue: v.revenue }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // 5. Breakdown penjualan per metode pembayaran.
    const paymentMap = new Map<string, number>();
    for (const t of txns ?? []) {
      paymentMap.set(t.payment_method, (paymentMap.get(t.payment_method) ?? 0) + t.total);
    }
    const paymentBreakdown = Array.from(paymentMap.entries()).map(([method, total]) => ({
      method,
      total,
    }));

    return NextResponse.json({
      data: {
        totals: {
          totalSales,
          totalTransactions,
          totalItemsSold,
          averageTransactionValue,
        },
        topProducts,
        paymentBreakdown,
      },
    });
  } catch {
    return jsonError("Gagal memuat laporan.", 500);
  }
}
