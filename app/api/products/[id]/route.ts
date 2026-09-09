/*
 * /api/products/[id]
 *
 * PATCH -> Ubah produk berdasarkan id (hanya Owner).
 *   Alur: cek auth & role Owner -> validasi body (Zod) -> update produk + opsi di Supabase ->
 *         muat ulang & pastikan produk ada -> return produk terbaru.
 *
 * DELETE -> Nonaktifkan (soft delete) produk berdasarkan id (hanya Owner).
 *   Alur: cek auth & role Owner -> set active = false -> return { ok: true }.
 */
import { NextResponse } from "next/server";
import { requireStoreContext, isOwner } from "@/lib/api/session";
import { listProducts, updateProductAndOptions } from "@/lib/api/products";
import { productSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";
import { jsonError, parseJsonBody, isAllowedImageUrl } from "@/lib/api/utilities";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStoreContext();
  if (!auth.ok) return auth.response;
  if (!isOwner(auth.ctx)) {
    return jsonError("Aksi hanya untuk Owner.", 403, "FORBIDDEN");
  }

  const { id } = await params;

  const parsedBody = await parseJsonBody<unknown>(request);
  if (!parsedBody.ok) return parsedBody.response;

  const parsed = productSchema.safeParse(parsedBody.data);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Data produk tidak valid.", 422);
  }

  if (!isAllowedImageUrl(parsed.data.image)) {
    return jsonError("URL gambar tidak diizinkan.", 422);
  }

  try {
    const supabase = await createClient();
    await updateProductAndOptions(supabase, auth.ctx.store.id, id, parsed.data);

    const { products } = await listProducts(supabase, auth.ctx.store.id);
    const updated = products.find((p) => p.id === id);
    if (!updated) return jsonError("Produk tidak ditemukan.", 404);

    return NextResponse.json({ data: { product: updated } });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Gagal mengubah produk.", 500);
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
    const { error } = await supabase
      .from("products")
      .update({ active: false })
      .eq("id", id)
      .eq("store_id", auth.ctx.store.id);

    if (error) return jsonError("Gagal menonaktifkan produk.", 500);
    return NextResponse.json({ data: { ok: true } });
  } catch {
    return jsonError("Gagal menonaktifkan produk.", 500);
  }
}
