/*
 * PATCH /api/banks/[id]
 *
 * Alur (flow):
 *   1. Cek auth & role Owner.
 *   2. Baca body JSON, ambil field opsional: name, active, logo.
 *   3. Jika tidak ada field yang dikirim -> tolak.
 *   4. Update bank di Supabase (hanya milik store ini).
 *   5. Jika tidak ditemukan -> 404; jika sukses -> return bank terbaru.
 */
import { NextResponse } from "next/server";
import { requireStoreContext, isOwner } from "@/lib/api/session";
import { createClient } from "@/lib/supabase/server";
import { jsonError, parseJsonBody, isAllowedImageUrl } from "@/lib/api/utilities";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStoreContext();
  if (!auth.ok) return auth.response;
  if (!isOwner(auth.ctx)) {
    return jsonError("Aksi hanya untuk Owner.", 403, "FORBIDDEN");
  }

  const { id } = await params;

  const parsedBody = await parseJsonBody<Record<string, unknown>>(request);
  if (!parsedBody.ok) return parsedBody.response;
  const payload = parsedBody.data;

  // Kumpulkan hanya field yang benar-benar dikirim & valid.
  const update: Record<string, unknown> = {};
  if (typeof payload.name === "string" && payload.name.trim()) {
    update.name = payload.name.trim();
  }
  if (typeof payload.active === "boolean") {
    update.active = payload.active;
  }
  if (payload.logo !== undefined) {
    if (!isAllowedImageUrl(payload.logo as string)) {
      return jsonError("URL logo tidak diizinkan.", 422);
    }
    update.logo_url = (payload.logo as string) || null;
  }

  try {
    const supabase = await createClient();
    const { data: bank, error } = await supabase
      .from("banks")
      .update(update)
      .eq("id", id)
      .eq("store_id", auth.ctx.store.id)
      .select("*")
      .maybeSingle();

    if (error) return jsonError("Gagal mengubah bank.", 500);
    if (!bank) return jsonError("Bank tidak ditemukan.", 404);

    return NextResponse.json({
      data: { bank: { id: bank.id, name: bank.name, active: bank.active, logo: bank.logo_url ?? undefined } },
    });
  } catch {
    return jsonError("Gagal mengubah bank.", 500);
  }
}
