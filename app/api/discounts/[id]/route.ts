/*
 * /api/discounts/[id]
 *
 * PATCH  -> Ubah promo diskon (hanya Owner). Mendukung update sebagian (mis. toggle aktif).
 * DELETE -> Hapus promo diskon (hanya Owner).
 */
import { NextResponse } from "next/server";
import { requireStoreContext, isOwner } from "@/lib/api/session";
import { productDiscountUpdateSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";
import { jsonError, parseJsonBody } from "@/lib/api/utilities";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStoreContext();
  if (!auth.ok) return auth.response;
  if (!isOwner(auth.ctx)) {
    return jsonError("Aksi hanya untuk Owner.", 403, "FORBIDDEN");
  }

  const { id } = await params;

  const parsedBody = await parseJsonBody<unknown>(request);
  if (!parsedBody.ok) return parsedBody.response;

  const parsed = productDiscountUpdateSchema.safeParse(parsedBody.data);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Data promo tidak valid.", 422);
  }
  const data = parsed.data;

  try {
    const supabase = await createClient();

    if (Object.keys(data).length === 0) {
      return jsonError("Tidak ada perubahan yang dikirim.", 422);
    }

    const update: Record<string, unknown> = {};
    if (data.name !== undefined) update.name = data.name.trim();
    if (data.discountType !== undefined) update.discount_type = data.discountType;
    if (data.discountValue !== undefined) update.discount_value = data.discountValue;
    if (data.startDate !== undefined) update.start_date = data.startDate || null;
    if (data.endDate !== undefined) update.end_date = data.endDate || null;
    if (data.active !== undefined) update.active = data.active;

    const { data: discount, error } = await supabase
      .from("product_discounts")
      .update(update)
      .eq("id", id)
      .eq("store_id", auth.ctx.store.id)
      .select("*")
      .maybeSingle();
    if (error) return jsonError("Gagal mengubah promo.", 500);
    if (!discount) return jsonError("Promo tidak ditemukan.", 404);

    if (data.productIds !== undefined) {
      const { data: validProducts, error: prodError } = await supabase
        .from("products")
        .select("id")
        .eq("store_id", auth.ctx.store.id)
        .in("id", data.productIds);
      if (prodError) return jsonError("Gagal memvalidasi produk.", 500);
      if ((validProducts ?? []).length !== data.productIds.length) {
        return jsonError("Salah satu produk tidak valid untuk store ini.", 422);
      }

      const { error: delItemsError } = await supabase
        .from("product_discount_items")
        .delete()
        .eq("discount_id", id);
      if (delItemsError) return jsonError("Gagal memperbarui daftar produk.", 500);

      const { error: insItemsError } = await supabase.from("product_discount_items").insert(
        data.productIds.map((productId) => ({
          store_id: auth.ctx.store.id,
          discount_id: id,
          product_id: productId,
        })),
      );
      if (insItemsError) return jsonError("Gagal memperbarui daftar produk.", 500);
    }

    const { data: items, error: itemsError } = await supabase
      .from("product_discount_items")
      .select("product_id")
      .eq("discount_id", id);
    if (itemsError) return jsonError("Gagal memuat produk promo.", 500);

    return NextResponse.json({
      data: {
        discount: {
          id: discount.id,
          name: discount.name,
          discountType: discount.discount_type,
          discountValue: Number(discount.discount_value),
          startDate: discount.start_date,
          endDate: discount.end_date,
          active: discount.active,
          productIds: (items ?? []).map((i: { product_id: string }) => i.product_id),
        },
      },
    });
  } catch {
    return jsonError("Gagal mengubah promo.", 500);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStoreContext();
  if (!auth.ok) return auth.response;
  if (!isOwner(auth.ctx)) {
    return jsonError("Aksi hanya untuk Owner.", 403, "FORBIDDEN");
  }

  const { id } = await params;

  try {
    const supabase = await createClient();
    const { data: discount, error } = await supabase
      .from("product_discounts")
      .delete()
      .eq("id", id)
      .eq("store_id", auth.ctx.store.id)
      .select("id")
      .maybeSingle();
    if (error) return jsonError("Gagal menghapus promo.", 500);
    if (!discount) return jsonError("Promo tidak ditemukan.", 404);

    return NextResponse.json({ data: { ok: true } });
  } catch {
    return jsonError("Gagal menghapus promo.", 500);
  }
}