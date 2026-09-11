/*
 * /api/stock
 *
 * POST -> Mutasi stok manual (hanya Owner): PURCHASE / ADJUST / OPNAME.
 *   Alur: cek auth & role Owner -> validasi body (Zod) ->
 *         panggil RPC `stock_mutation` (cek lock baris, hitung delta, tulis ledger) -> return.
 */
import { NextResponse } from "next/server";
import { requireStoreContext, isOwner } from "@/lib/api/session";
import { stockMutationSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";
import { jsonError, parseJsonBody } from "@/lib/api/utilities";

export async function POST(request: Request) {
  const auth = await requireStoreContext();
  if (!auth.ok) return auth.response;

  if (!isOwner(auth.ctx)) {
    return jsonError("Hanya Owner yang dapat mengubah stok.", 403, "FORBIDDEN");
  }

  const parsedBody = await parseJsonBody<unknown>(request);
  if (!parsedBody.ok) return parsedBody.response;

  const parsed = stockMutationSchema.safeParse(parsedBody.data);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Data mutasi stok tidak valid.", 422);
  }

  try {
    const supabase = await createClient();
    const { productId, type, quantity, newStock, note } = parsed.data;

    const { data, error } = await supabase.rpc("stock_mutation", {
      p_product_id: productId,
      p_store_id: auth.ctx.store.id,
      p_type: type,
      p_quantity: quantity ?? 0,
      p_new_stock: newStock ?? null,
      p_note: note ?? "",
    });

    if (error) {
      const raw = String(error.message ?? "");
      let message = raw;
      try {
        const parsedErr = JSON.parse(raw) as { message?: string };
        if (parsedErr.message) message = parsedErr.message;
      } catch {
        // message bukan JSON -> pakai apa adanya
      }
      return jsonError(message || "Gagal mengubah stok.", 500);
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return jsonError("Gagal mengubah stok.", 500);
  }
}