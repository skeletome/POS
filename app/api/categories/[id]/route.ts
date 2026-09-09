/*
 * /api/categories/[id]
 *
 * PATCH -> Ubah nama / status kategori (hanya Owner).
 *   Alur: cek auth & role Owner -> validasi body -> update di Supabase ->
 *         pastikan kategori ada -> return kategori terbaru.
 *
 * DELETE -> Nonaktifkan (soft delete) kategori (hanya Owner).
 *   Alur: cek auth & role Owner -> set active = false -> return { id, active: false }.
 */
import { NextResponse } from "next/server";
import { requireStoreContext, isOwner } from "@/lib/api/session";
import { categorySchema } from "@/lib/schemas";
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

  const parsed = categorySchema.safeParse(parsedBody.data);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Data kategori tidak valid.", 422);
  }

  try {
    const supabase = await createClient();
    const { data: cat, error } = await supabase
      .from("categories")
      .update({ name: parsed.data.name.trim(), active: parsed.data.active })
      .eq("id", id)
      .eq("store_id", auth.ctx.store.id)
      .select("*")
      .maybeSingle();

    if (error) return jsonError("Gagal mengubah kategori.", 500);
    if (!cat) return jsonError("Kategori tidak ditemukan.", 404);

    return NextResponse.json({
      data: { category: { id: cat.id, name: cat.name, active: cat.active } },
    });
  } catch {
    return jsonError("Gagal mengubah kategori.", 500);
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
    const { data: cat, error } = await supabase
      .from("categories")
      .update({ active: false })
      .eq("id", id)
      .eq("store_id", auth.ctx.store.id)
      .select("id")
      .maybeSingle();

    if (error) return jsonError("Gagal menonaktifkan kategori.", 500);
    if (!cat) return jsonError("Kategori tidak ditemukan.", 404);

    return NextResponse.json({ data: { id: cat.id, active: false } });
  } catch {
    return jsonError("Gagal menonaktifkan kategori.", 500);
  }
}
