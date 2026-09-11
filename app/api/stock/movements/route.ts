/*
 * /api/stock/movements
 *
 * GET -> Riwayat mutasi stok (ledger) untuk store yang login.
 *   Alur: cek auth (member) -> query stock_movements + nama produk (join) ->
 *         filter opsional: productId, type, from, to, limit -> mapping -> return.
 */
import { NextResponse } from "next/server";
import { requireStoreContext } from "@/lib/api/session";
import { movementTypeSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/api/utilities";

export async function GET(request: Request) {
  const auth = await requireStoreContext();
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const productId = url.searchParams.get("productId")?.trim() || undefined;
  const rawType = url.searchParams.get("type")?.trim() || undefined;
  const from = url.searchParams.get("from")?.trim() || undefined;
  const to = url.searchParams.get("to")?.trim() || undefined;
  const rawLimit = Number.parseInt(url.searchParams.get("limit") ?? "100", 10);

  const type =
    rawType && movementTypeSchema.safeParse(rawType).success ? (rawType as string) : undefined;

  const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 500) : 100;

  try {
    const supabase = await createClient();

    let query = supabase
      .from("stock_movements")
      .select(
        "id, product_id, movement_type, quantity, balance_after, transaction_id, note, created_at, products(name)",
      )
      .eq("store_id", auth.ctx.store.id);

    if (productId) query = query.eq("product_id", productId);
    if (type) query = query.eq("movement_type", type);
    if (from) query = query.gte("created_at", from);
    if (to) query = query.lte("created_at", to);

    query = query.order("created_at", { ascending: false }).limit(limit);

    const { data, error } = await query;

    if (error) return jsonError("Gagal memuat riwayat stok.", 500);

    const movements = (data ?? []).map((row: Record<string, unknown>) => ({
      id: String(row.id),
      productId: String(row.product_id),
      productName: (row.products as { name?: string } | undefined)?.name ?? "—",
      type: String(row.movement_type),
      quantity: Number(row.quantity),
      balanceAfter: Number(row.balance_after),
      transactionId: row.transaction_id ? String(row.transaction_id) : null,
      createdAt: String(row.created_at),
      note: row.note ? String(row.note) : null,
    }));

    return NextResponse.json({ data: { movements } });
  } catch {
    return jsonError("Gagal memuat riwayat stok.", 500);
  }
}