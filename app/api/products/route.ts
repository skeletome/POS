/*
 * /api/products
 *
 * GET  -> Ambil daftar produk + opsi + settings store milik user yang login.
 *   Alur: cek auth -> list produk & opsi dari Supabase -> mapping ke bentuk frontend -> return.
 *
 * POST -> Buat produk baru (hanya Owner).
 *   Alur: cek auth & role Owner -> baca & validasi body (Zod) ->
 *         cek kategori valid -> cek produk duplikat -> simpan produk + opsi -> return produk baru.
 */
import { NextResponse } from "next/server";
import { requireStoreContext, isOwner } from "@/lib/api/session";
import { listProducts, insertProductWithOptions, storesToSettings } from "@/lib/api/products";
import { productSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";
import { jsonError, parseJsonBody, isAllowedImageUrl } from "@/lib/api/utilities";

export async function GET() {
  const auth = await requireStoreContext();
  if (!auth.ok) return auth.response;

  try {
    const supabase = await createClient();
    const { products } = await listProducts(supabase, auth.ctx.store.id);

    return NextResponse.json({
      data: {
        products,
        ...storesToSettings(auth.ctx.store),
      },
    });
  } catch {
    return jsonError("Gagal memuat produk.", 500);
  }
}

export async function POST(request: Request) {
  const auth = await requireStoreContext();
  if (!auth.ok) return auth.response;

  if (!isOwner(auth.ctx)) {
    return jsonError("Aksi hanya untuk Owner.", 403, "FORBIDDEN");
  }

  // 1. Baca & validasi body JSON (produk baru).
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

    // 2. Pastikan kategori (jika dipilih) milik store yang sama.
    if (parsed.data.categoryId) {
      const { data: cat } = await supabase
        .from("categories")
        .select("id")
        .eq("id", parsed.data.categoryId)
        .eq("store_id", auth.ctx.store.id)
        .maybeSingle();

      if (!cat) {
        return jsonError("Kategori tidak ditemukan untuk store ini.", 422);
      }
    }

    // 3. Cegah produk dengan id yang sama sudah ada.
    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("id", parsed.data.id)
      .maybeSingle();

    if (existing) {
      return jsonError("Produk dengan id tersebut sudah ada.", 409, "CONFLICT");
    }

    // 4. Simpan produk beserta option groups-nya.
    await insertProductWithOptions(supabase, auth.ctx.store.id, parsed.data);

    // 5. Muat ulang & kembalikan produk yang baru dibuat.
    const { products } = await listProducts(supabase, auth.ctx.store.id);
    const created = products.find((p) => p.id === parsed.data.id);

    return NextResponse.json({ data: { product: created } }, { status: 201 });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Gagal menyimpan produk.", 500);
  }
}
