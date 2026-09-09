/*
 * POST /api/auth/logout
 *
 * Alur (flow):
 *   1. Panggil method signOut milik Supabase (menghapus session di server).
 *   2. Jika gagal -> balas 500.
 *   3. Jika sukses -> kembalikan { ok: true } (client juga membersihkan state lokal).
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/auth";

export async function POST() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return jsonError(error.message, 500, "SIGN_OUT_FAILED");
    }

    return NextResponse.json({ data: { ok: true } });
  } catch {
    return jsonError("Gagal melakukan logout.", 500);
  }
}
