/*
 * /api/discounts
 *
 * GET  -> Ambil daftar promo diskon produk milik store (dibaca oleh member, dipakai di POS).
 * POST -> Buat promo diskon baru (hanya Owner).
 */
import { NextResponse } from "next/server";
import { requireStoreContext, isOwner } from "@/lib/api/session";
import { productDiscountCreateSchema, type ProductDiscount } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";
import { jsonError, parseJsonBody } from "@/lib/api/utilities";

export async function GET() {
  const auth = await requireStoreContext();
  if (!auth.ok) return auth.response;

  try {
    const supabase = await createClient();
    const { data: rows, error } = await supabase
      .from("product_discounts")
      .select("*, product_discount_items(product_id)")
      .eq("store_id", auth.ctx.store.id)
      .order("created_at", { ascending: false });

    if (error) return jsonError("Gagal memuat promo.", 500);

    const discounts: ProductDiscount[] = (rows ?? []).map((d) => ({
      id: d.id,
      name: d.name,
      discountType: d.discount_type,
      discountValue: Number(d.discount_value),
      startDate: d.start_date,
      endDate: d.end_date,
      active: d.active,
      productIds: (d.product_discount_items ?? []).map((i: { product_id: string }) => i.product_id),
      createdAt: d.created_at,
    }));

    return NextResponse.json({ data: { discounts } });
  } catch {
    return jsonError("Gagal memuat promo.", 500);
  }
}

export async function POST(request: Request) {
  const auth = await requireStoreContext();
  if (!auth.ok) return auth.response;
  if (!isOwner(auth.ctx)) {
    return jsonError("Aksi hanya untuk Owner.", 403, "FORBIDDEN");
  }

  const parsedBody = await parseJsonBody<unknown>(request);
  if (!parsedBody.ok) return parsedBody.response;

  const parsed = productDiscountCreateSchema.safeParse(parsedBody.data);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Data promo tidak valid.", 422);
  }

  try {
    const supabase = await createClient();
    const { discountType, discountValue, productIds, ...rest } = parsed.data;

    // semua produk harus milik store ini
    const { data: validProducts, error: prodError } = await supabase
      .from("products")
      .select("id")
      .eq("store_id", auth.ctx.store.id)
      .in("id", productIds);
    if (prodError) return jsonError("Gagal memvalidasi produk.", 500);
    if ((validProducts ?? []).length !== productIds.length) {
      return jsonError("Salah satu produk tidak valid untuk store ini.", 422);
    }

    const { data: discount, error } = await supabase
      .from("product_discounts")
      .insert({
        store_id: auth.ctx.store.id,
        name: rest.name.trim(),
        discount_type: discountType,
        discount_value: discountValue,
        start_date: rest.startDate || null,
        end_date: rest.endDate || null,
        active: rest.active,
      })
      .select("*")
      .single();
    if (error) return jsonError("Gagal menambah promo.", 500);

    const { error: itemsError } = await supabase.from("product_discount_items").insert(
      productIds.map((productId) => ({
        store_id: auth.ctx.store.id,
        discount_id: discount.id,
        product_id: productId,
      })),
    );
    if (itemsError) {
      await supabase.from("product_discounts").delete().eq("id", discount.id);
      return jsonError("Gagal menambah produk pada promo.", 500);
    }

    return NextResponse.json(
      {
        data: {
          discount: {
            id: discount.id,
            name: discount.name,
            discountType: discount.discount_type,
            discountValue: Number(discount.discount_value),
            startDate: discount.start_date,
            endDate: discount.end_date,
            active: discount.active,
            productIds,
          },
        },
      },
      { status: 201 },
    );
  } catch {
    return jsonError("Gagal menambah promo.", 500);
  }
}