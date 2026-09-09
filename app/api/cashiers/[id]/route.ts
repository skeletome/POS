/*
 * PATCH /api/cashiers/[id]
 *
 * Alur (flow):
 *   1. Cek auth & role Owner.
 *   2. Baca body JSON; field opsional: active, name.
 *   3. Jika tidak ada field yang dikirim -> tolak.
 *   4. Pastikan kasir tersebut milik store ini (role CASHIER).
 *   5. Update store_members -> return status kasir yang baru.
 */
import { NextResponse } from "next/server";
import { requireStoreContext, isOwner } from "@/lib/api/session";
import { createClient } from "@/lib/supabase/server";
import { jsonError, parseJsonBody } from "@/lib/api/utilities";

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

  const update: Record<string, unknown> = {};
  if (typeof payload.active === "boolean") {
    update.active = payload.active;
  }
  if (typeof payload.name === "string" && payload.name.trim()) {
    update.name = payload.name.trim();
  }

  if (Object.keys(update).length === 0) {
    return jsonError("Tidak ada data yang dikirim.");
  }

  try {
    const supabase = await createClient();

    // Pastikan kasir terdaftar sebagai CASHIER di store ini.
    const { data: member } = await supabase
      .from("store_members")
      .select("user_id")
      .eq("store_id", auth.ctx.store.id)
      .eq("user_id", id)
      .eq("role", "CASHIER")
      .maybeSingle();

    if (!member) {
      return jsonError("Kasir tidak ditemukan.", 404);
    }

    const { data: updated, error } = await supabase
      .from("store_members")
      .update(update)
      .eq("store_id", auth.ctx.store.id)
      .eq("user_id", id)
      .select("user_id, active")
      .single();

    if (error) return jsonError("Gagal mengubah kasir.", 500);

    return NextResponse.json({
      data: { cashier: { id: updated.user_id, active: updated.active } },
    });
  } catch {
    return jsonError("Gagal mengubah kasir.", 500);
  }
}
