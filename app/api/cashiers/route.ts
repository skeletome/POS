/*
 * /api/cashiers
 *
 * GET  -> Ambil daftar kasir milik store yang login (hanya Owner).
 *   Alur: cek auth & role Owner -> panggil RPC get_store_cashiers -> mapping ke bentuk frontend -> return.
 *
 * POST -> Buat akun kasir baru (hanya Owner; di-rate-limit).
 *   Alur: cek auth & role Owner -> rate limit -> validasi body (Zod) & password ->
 *         buat auth user via admin -> buat profile -> tautkan ke store -> return kasir baru.
 *         Jika gagal di tengah, akun yang tadi dibuat di-rollback (dihapus).
 */
import { NextResponse } from "next/server";
import { requireStoreContext, isOwner } from "@/lib/api/session";
import { cashierCreateSchema, type Cashier } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import { jsonError, parseJsonBody } from "@/lib/api/utilities";
import { writeLimiter, rateLimit } from "@/lib/rate-limit";

export async function GET() {
  const auth = await requireStoreContext();
  if (!auth.ok) return auth.response;
  if (!isOwner(auth.ctx)) {
    return jsonError("Aksi hanya untuk Owner.", 403, "FORBIDDEN");
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_store_cashiers", {
      _store_id: auth.ctx.store.id,
    });

    if (error) return jsonError("Gagal memuat daftar kasir.", 500);

    const rows = (data as CashierRow[]) ?? [];
    const cashiers: Cashier[] = rows
      .filter((r) => r.role === "CASHIER")
      .map((r) => ({
        id: r.user_id,
        name: r.name,
        email: r.email,
        active: r.active,
      }));

    return NextResponse.json({ data: { cashiers } });
  } catch {
    return jsonError("Gagal memuat daftar kasir.", 500);
  }
}

export async function POST(request: Request) {
  const auth = await requireStoreContext();
  if (!auth.ok) return auth.response;
  if (!isOwner(auth.ctx)) {
    return jsonError("Aksi hanya untuk Owner.", 403, "FORBIDDEN");
  }

  // Rate limit operasi tulis (membuat akun) berdasarkan user owner.
  const limited = await rateLimit(writeLimiter, `cashier:${auth.ctx.profile.id}`);
  if (limited) return limited;

  const parsedBody = await parseJsonBody<unknown>(request);
  if (!parsedBody.ok) return parsedBody.response;

  const parsed = cashierCreateSchema.safeParse(parsedBody.data);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Data kasir tidak valid.", 422);
  }

  const password = typeof parsedBody.data === "object" && parsedBody.data !== null
    ? (parsedBody.data as { password?: string }).password
    : undefined;
  if (!password || String(password).length < 6) {
    return jsonError("Password minimal 6 karakter.", 422);
  }

  try {
    const admin = createAdminClient();
    let userId: string;

    // 1. Buat auth user baru.
    const { data: authUser, error: aErr } = await admin.auth.admin.createUser({
      email: parsed.data.email,
      password: String(password),
      email_confirm: true,
    });

    if (aErr) {
      if (aErr.code === "email_exists" || aErr.message.includes("already registered")) {
        return jsonError("Email sudah terdaftar.", 409, "EMAIL_EXISTS");
      }
      return jsonError("Gagal membuat akun kasir.", 500);
    }

    userId = authUser!.user!.id;

    // 2. Buat profile kasir (bypass RLS via admin, hanya untuk store owner ini).
    const { error: pErr } = await admin
      .from("profiles")
      .insert({ id: userId, email: parsed.data.email, name: parsed.data.name.trim() });
    if (pErr) {
      await cleanupUser(admin, userId);
      return jsonError("Gagal menyimpan profil kasir.", 500);
    }

    // 3. Tautkan kasir ke store ini.
    const { error: mErr } = await admin
      .from("store_members")
      .insert({ store_id: auth.ctx.store.id, user_id: userId, role: "CASHIER", active: true });
    if (mErr) {
      await cleanupUser(admin, userId);
      return jsonError("Gagal menautkan kasir ke store.", 500);
    }

    return NextResponse.json(
      { data: { cashier: { id: userId, name: parsed.data.name.trim(), email: parsed.data.email, active: true } } },
      { status: 201 },
    );
  } catch {
    return jsonError("Gagal membuat akun kasir.", 500);
  }
}

/** Membatalkan pembuatan akun (rollback) jika salah satu langkah gagal. */
async function cleanupUser(admin: SupabaseClient, userId: string) {
  await admin.auth.admin.deleteUser(userId);
}

interface CashierRow {
  user_id: string;
  name: string;
  email: string;
  active: boolean;
  role: string;
}
