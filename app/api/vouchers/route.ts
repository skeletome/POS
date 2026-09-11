/*
 * /api/vouchers
 *
 * GET  -> Ambil daftar voucher milik store (read oleh member, dipakai untuk validasi live di POS).
 * POST -> Buat voucher baru (hanya Owner). Kode otomatis di-uppercase.
 */
import { NextResponse } from "next/server";
import { requireStoreContext, isOwner } from "@/lib/api/session";
import { voucherCreateSchema, type Voucher } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";
import { jsonError, parseJsonBody } from "@/lib/api/utilities";

export async function GET() {
  const auth = await requireStoreContext();
  if (!auth.ok) return auth.response;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("vouchers")
      .select("*")
      .eq("store_id", auth.ctx.store.id)
      .order("created_at", { ascending: false });

    if (error) return jsonError("Gagal memuat voucher.", 500);

    const vouchers: Voucher[] = (data ?? []).map((v) => ({
      id: v.id,
      code: v.code,
      discountType: v.discount_type,
      discountValue: Number(v.discount_value),
      minSubtotal: v.min_subtotal != null ? Number(v.min_subtotal) : null,
      maxDiscount: v.max_discount != null ? Number(v.max_discount) : null,
      usageLimit: v.usage_limit,
      usedCount: v.used_count,
      validFrom: v.valid_from,
      validUntil: v.valid_until,
      active: v.active,
      createdAt: v.created_at,
    }));

    return NextResponse.json({ data: { vouchers } });
  } catch {
    return jsonError("Gagal memuat voucher.", 500);
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

  const parsed = voucherCreateSchema.safeParse(parsedBody.data);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Data voucher tidak valid.", 422);
  }

  try {
    const supabase = await createClient();
    const { code, ...rest } = parsed.data;
    const normalized = code.trim().toUpperCase();

    const { data: dup } = await supabase
      .from("vouchers")
      .select("id")
      .eq("store_id", auth.ctx.store.id)
      .eq("code", normalized)
      .maybeSingle();
    if (dup) {
      return jsonError(`Kode voucher "${normalized}" sudah ada.`, 409, "CONFLICT");
    }

    const { data: voucher, error } = await supabase
      .from("vouchers")
      .insert({
        store_id: auth.ctx.store.id,
        code: normalized,
        discount_type: rest.discountType,
        discount_value: rest.discountValue,
        min_subtotal: rest.minSubtotal ?? null,
        max_discount: rest.maxDiscount ?? null,
        usage_limit: rest.usageLimit ?? null,
        valid_from: rest.validFrom || null,
        valid_until: rest.validUntil || null,
        active: rest.active,
      })
      .select("*")
      .single();
    if (error) return jsonError("Gagal menambah voucher.", 500);

    return NextResponse.json(
      {
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
      },
      { status: 201 },
    );
  } catch {
    return jsonError("Gagal menambah voucher.", 500);
  }
}