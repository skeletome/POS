/*
 * /api/categories
 *
 * GET  -> Ambil daftar kategori milik store yang login.
 *   Alur: cek auth -> query kategori -> mapping ke bentuk frontend -> return.
 *
 * POST -> Buat kategori baru (hanya Owner).
 *   Alur: cek auth & role Owner -> validasi body (Zod) -> cek duplikat nama ->
 *         insert kategori -> return kategori baru.
 */
import { NextResponse } from "next/server";
import { requireStoreContext, isOwner } from "@/lib/api/session";
import { categoryCreateSchema, type Category } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";
import { jsonError, parseJsonBody } from "@/lib/api/utilities";

export async function GET() {
  const auth = await requireStoreContext();
  if (!auth.ok) return auth.response;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("store_id", auth.ctx.store.id)
      .order("sort_order")
      .order("name");

    if (error) return jsonError("Gagal memuat kategori.", 500);

    const categories: Category[] = (data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      active: c.active,
    }));

    return NextResponse.json({ data: { categories } });
  } catch {
    return jsonError("Gagal memuat kategori.", 500);
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

  const parsed = categoryCreateSchema.safeParse(parsedBody.data);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Data kategori tidak valid.", 422);
  }

  try {
    const supabase = await createClient();

    const { data: dup } = await supabase
      .from("categories")
      .select("id")
      .eq("store_id", auth.ctx.store.id)
      .ilike("name", parsed.data.name.trim())
      .maybeSingle();
    if (dup) {
      return jsonError("Kategori dengan nama tersebut sudah ada.", 409, "CONFLICT");
    }

    const { data: cat, error } = await supabase
      .from("categories")
      .insert({ store_id: auth.ctx.store.id, name: parsed.data.name.trim() })
      .select("*")
      .single();

    if (error) return jsonError("Gagal membuat kategori.", 500);

    return NextResponse.json(
      {
        data: { category: { id: cat.id, name: cat.name, active: cat.active } },
      },
      { status: 201 },
    );
  } catch {
    return jsonError("Gagal membuat kategori.", 500);
  }
}
