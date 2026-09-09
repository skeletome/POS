/*
 * /api/store
 *
 * GET   -> Ambil setting store milik user yang login.
 *   Alur: cek auth -> mapping store -> settings -> return.
 *
 * PATCH -> Perbarui setting store (hanya Owner; di-rate-limit).
 *   Alur: cek auth & role Owner -> rate limit -> validasi tiap blok setting (store/tax/payment/qris) ->
 *         gabungkan update -> simpan ke Supabase -> return setting terbaru.
 */
import { NextResponse } from "next/server";
import { requireStoreContext, isOwner } from "@/lib/api/session";
import { storesToSettings } from "@/lib/api/products";
import { storeSettingsSchema, taxSettingsSchema, paymentSettingsSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";
import { jsonError, parseJsonBody, isAllowedImageUrl } from "@/lib/api/utilities";
import { writeLimiter, rateLimit } from "@/lib/rate-limit";

export async function GET() {
  const auth = await requireStoreContext();
  if (!auth.ok) return auth.response;

  try {
    return NextResponse.json({ data: storesToSettings(auth.ctx.store) });
  } catch {
    return jsonError("Gagal memuat pengaturan.", 500);
  }
}

export async function PATCH(request: Request) {
  const auth = await requireStoreContext();
  if (!auth.ok) return auth.response;
  if (!isOwner(auth.ctx)) {
    return jsonError("Aksi hanya untuk Owner.", 403, "FORBIDDEN");
  }

  const limited = await rateLimit(writeLimiter, `store:${auth.ctx.profile.id}`);
  if (limited) return limited;

  const parsedBody = await parseJsonBody<Record<string, unknown>>(request);
  if (!parsedBody.ok) return parsedBody.response;
  const payload = parsedBody.data;

  try {
    const supabase = await createClient();
    let update: Record<string, unknown> = {};

    // Store settings (nama & informasi toko).
    if (payload.storeSettings !== undefined) {
      const parsed = storeSettingsSchema.safeParse(payload.storeSettings);
      if (!parsed.success) {
        return jsonError(parsed.error.issues[0]?.message ?? "Data toko tidak valid.", 422);
      }
      update = { ...update, name: parsed.data.storeName.trim(), information: parsed.data.information.trim() };
    }

    // Tax settings (pajak dine-in & takeaway).
    if (payload.taxSettings !== undefined) {
      const parsed = taxSettingsSchema.safeParse(payload.taxSettings);
      if (!parsed.success) {
        return jsonError(parsed.error.issues[0]?.message ?? "Data pajak tidak valid.", 422);
      }
      update = {
        ...update,
        tax_enabled: parsed.data.enabled,
        dine_in_tax: parsed.data.dineInRate,
        takeaway_tax: parsed.data.takeawayRate,
      };
    }

    // Payment settings (jenis pembayaran yang aktif).
    if (payload.paymentSettings !== undefined) {
      const parsed = paymentSettingsSchema.safeParse(payload.paymentSettings);
      if (!parsed.success) {
        return jsonError(parsed.error.issues[0]?.message ?? "Data pembayaran tidak valid.", 422);
      }
      update = {
        ...update,
        cash_enabled: parsed.data.cashEnabled,
        bank_enabled: parsed.data.bankEnabled,
        qris_enabled: parsed.data.qrisEnabled,
      };
    }

    // QRIS settings (nama & gambar QRIS).
    if (payload.qrisSettings !== undefined) {
      const q = payload.qrisSettings as Record<string, unknown>;
      if (typeof q.qrisName === "string") update.qris_name = q.qrisName;
      if (typeof q.qrisEnabled === "boolean") update.qris_enabled = q.qrisEnabled;
      if (q.qrisImageUrl !== undefined) {
        if (!isAllowedImageUrl(q.qrisImageUrl as string)) {
          return jsonError("URL gambar QRIS tidak diizinkan.", 422);
        }
        update.qris_image_url = (q.qrisImageUrl as string) || null;
      }
    }

    // Store settings: validasi logo URL jika dikirim.
    if (payload.storeSettings !== undefined) {
      const s = payload.storeSettings as Record<string, unknown>;
      if (s.logoUrl !== undefined && !isAllowedImageUrl(s.logoUrl as string)) {
        return jsonError("URL logo tidak diizinkan.", 422);
      }
    }

    if (Object.keys(update).length === 0) {
      return jsonError("Tidak ada setting yang dikirim.");
    }

    const { data: store, error } = await supabase
      .from("stores")
      .update(update)
      .eq("id", auth.ctx.store.id)
      .select("*")
      .maybeSingle();

    if (error) return jsonError("Gagal menyimpan pengaturan.", 500);
    if (!store) return jsonError("Store tidak ditemukan.", 404);

    return NextResponse.json({ data: storesToSettings(store) });
  } catch {
    return jsonError("Gagal menyimpan pengaturan.", 500);
  }
}
