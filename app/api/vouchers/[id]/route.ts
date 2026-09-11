/*
 * /api/vouchers/[id]
 *
 * PATCH  -> Ubah voucher (hanya Owner), termasuk toggle aktif & lalu-lintas kuota.
 * DELETE -> Hapus voucher (hanya Owner).
 */
import { NextResponse } from "next/server";
import { requireStoreContext, isOwner } from "@/lib/api/session";
import { voucherUpdateSchema } from "@/lib/schemas";
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

  const parsed = voucherUpdateSchema.safeParse(parsedBody.data);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Data voucher tidak valid.", 422);
  }
  const data = parsed.data;

  if (Object.keys(data).length === 0) {
    return jsonError("Tidak ada perubahan yang dikirim.", 422);
  }

  try {
    const supabase = await createClient();

    if (data.code !== undefined) {
      const normalized = data.code.trim().toUpperCase();
      const { data: dup } = await supabase
        .from("vouchers")
        .select("id")
        .eq("store_id", auth.ctx.store.id)
        .eq("code", normalized)
        .neq("id", id)
        .maybeSingle();
      if (dup) {
        return jsonError(`Kode voucher "${normalized}" sudah digunakan voucher lain.`, 409, "CONFLICT");
      }
    }

    const update: Record<string, unknown> = {};
    if (data.code !== undefined) update.code = data.code.trim().toUpperCase();
    if (data.discountType !== undefined) update.discount_type = data.discountType;
    if (data.discountValue !== undefined) update.discount_value = data.discountValue;
    if (data.minSubtotal !== undefined) update.min_subtotal = data.minSubtotal ?? null;
    if (data.maxDiscount !== undefined) update.max_discount = data.maxDiscount ?? null;
    if (data.usageLimit !== undefined) update.usage_limit = data.usageLimit ?? null;
    if (data.validFrom !== undefined) update.valid_from = data.validFrom || null;
    if (data.validUntil !== undefined) update.valid_until = data.validUntil || null;
    if (data.active !== undefined) update.active = data.active;

    const { data: voucher, error } = await supabase
      .from("vouchers")
      .update(update)
      .eq("id", id)
      .eq("store_id", auth.ctx.store.id)
      .select("*")
      .maybeSingle();
    if (error) return jsonError("Gagal mengubah voucher.", 500);
    if (!voucher) return jsonError("Voucher tidak ditemukan.", 404);

    return NextResponse.json({
      data: {
        voucher: {
          id: voucher.id,
          code: voucher.code,
          discountType: voucher.discount_type,
          discountValue: Number(voucher.discount_value),
          minSubtotal: voucher.min_subtotal != null ? Number(voucher.min_subtotal) : null,
          maxDiscount: voucher.max_discount != null ? Number(voucher.max_discount) : null,
          usageLimit: voucher.usage_limit,
          usedCount: voucher.used_count,
          validFrom: voucher.valid_from,
          validUntil: voucher.valid_until,
          active: voucher.active,
        },
      },
    });
  } catch {
    return jsonError("Gagal mengubah voucher.", 500);
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
    const { data: voucher, error } = await supabase
      .from("vouchers")
      .delete()
      .eq("id", id)
      .eq("store_id", auth.ctx.store.id)
      .select("id")
      .maybeSingle();
    if (error) return jsonError("Gagal menghapus voucher.", 500);
    if (!voucher) return jsonError("Voucher tidak ditemukan.", 404);

    return NextResponse.json({ data: { ok: true } });
  } catch {
    return jsonError("Gagal menghapus voucher.", 500);
  }
}