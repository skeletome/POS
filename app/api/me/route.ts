/*
 * GET /api/me
 *
 * Alur (flow):
 *   1. Baca sesi user yang sedang login (dari cookie Supabase).
 *   2. Ambil konteks store (profil, membership, store, & settings-nya).
 *   3. Jika tidak terautentikasi -> balas 401.
 *   4. Jika sukses -> kembalikan data profil + membership + store + settings.
 */
import { NextResponse } from "next/server";
import { getMyContext } from "@/lib/api/session";
import { jsonError } from "@/lib/auth";
import { storesToSettings } from "@/lib/api/products";

export async function GET() {
  try {
    const ctx = await getMyContext();
    if (!ctx) {
      return jsonError("Tidak terautentikasi.", 401, "UNAUTHENTICATED");
    }

    return NextResponse.json({
      data: {
        profile: ctx.profile,
        membership: ctx.membership,
        store: ctx.store,
        ...storesToSettings(ctx.store),
      },
    });
  } catch {
    return jsonError("Gagal memuat data user.", 500);
  }
}
