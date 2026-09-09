/*
 * /api/banks
 *
 * GET  -> Ambil daftar bank milik store yang login.
 *   Alur: cek auth -> query bank (urutkan) -> mapping ke bentuk frontend -> return.
 *
 * POST -> Tambah bank baru (hanya Owner).
 *   Alur: cek auth & role Owner -> validasi body (Zod) -> cek duplikat nama ->
 *         insert bank -> return bank baru.
 */
import { NextResponse } from "next/server";
import { requireStoreContext, isOwner } from "@/lib/api/session";
import { bankCreateSchema, type Bank } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";
import { jsonError, parseJsonBody } from "@/lib/api/utilities";

export async function GET() {
  const auth = await requireStoreContext();
  if (!auth.ok) return auth.response;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("banks")
      .select("*")
      .eq("store_id", auth.ctx.store.id)
      .order("sort_order")
      .order("name");

    if (error) return jsonError("Gagal memuat bank.", 500);

    const banks: Bank[] = (data ?? []).map((b) => ({
      id: b.id,
      name: b.name,
      active: b.active,
      logo: b.logo_url ?? undefined,
    }));

    return NextResponse.json({ data: { banks } });
  } catch {
    return jsonError("Gagal memuat bank.", 500);
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

  const parsed = bankCreateSchema.safeParse(parsedBody.data);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Data bank tidak valid.", 422);
  }

  try {
    const supabase = await createClient();

    const { data: dup } = await supabase
      .from("banks")
      .select("id")
      .eq("store_id", auth.ctx.store.id)
      .ilike("name", parsed.data.name.trim())
      .maybeSingle();
    if (dup) {
      return jsonError("Bank dengan nama tersebut sudah ada.", 409, "CONFLICT");
    }

    const { data: bank, error } = await supabase
      .from("banks")
      .insert({ store_id: auth.ctx.store.id, name: parsed.data.name.trim() })
      .select("*")
      .single();

    if (error) return jsonError("Gagal menambah bank.", 500);

    return NextResponse.json(
      {
        data: { bank: { id: bank.id, name: bank.name, active: bank.active, logo: bank.logo_url ?? undefined } },
      },
      { status: 201 },
    );
  } catch {
    return jsonError("Gagal menambah bank.", 500);
  }
}
