/*
 * POST /api/upload
 *
 * Alur (flow):
 *   1. Cek user sudah login & punya store.
 *   2. Rate limit upload per user.
 *   3. Baca form-data: file + bucket (validasi bucket, tipe & ukuran file).
 *   4. Buat nama file acak, unggah ke bucket storage di Supabase.
 *   5. Buat URL publik & return { url, bucket, path }.
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireStoreContext } from "@/lib/api/session";
import { createClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/api/utilities";
import { uploadLimiter, rateLimit } from "@/lib/rate-limit";

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);
const BUCKETS = new Set(["product-images", "bank-logos", "qris-images", "store-logos"]);

/** Memverifikasi magic bytes file untuk mencegah MIME spoofing dari client. */
function hasValidMagicBytes(file: File): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const reader = file.stream().getReader();
    const bytes: number[] = [];
    const read = () => {
      reader.read().then(({ done, value }) => {
        if (done || bytes.length >= 12) {
          closeReader(reader);
          resolve(matchesSignature(bytes, file.type));
          return;
        }
        if (!value) {
          read();
          return;
        }
        for (const b of value) {
          bytes.push(b);
          if (bytes.length >= 12) break;
        }
        read();
      });
    };
    read();
  });
}

function closeReader(reader: ReadableStreamDefaultReader<Uint8Array>): void {
  try {
    reader.cancel();
  } catch {
    /* ignore */
  }
}

function matchesSignature(bytes: number[], mime: string): boolean {
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return true;
  }
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return true;
  }
  // WebP: RIFF .... WEBP
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return true;
  }
  return false;
}

function randomName(ext: string): string {
  return crypto.randomUUID() + ext;
}

export async function POST(request: NextRequest) {
  const auth = await requireStoreContext();
  if (!auth.ok) return auth.response;

  const limited = await rateLimit(uploadLimiter, `upload:${auth.ctx.profile.id}`);
  if (limited) return limited;

  try {
    // 1. Baca file & bucket dari form-data, lalu validasi.
    const form = await request.formData();
    const file = form.get("file");
    const bucket = String(form.get("bucket") ?? "product-images");

    if (!(file instanceof File)) {
      return jsonError("File wajib dikirim dengan field 'file'.", 422);
    }
    if (!BUCKETS.has(bucket)) {
      return jsonError("Bucket tidak valid.", 422);
    }
    if (!ALLOWED_MIME.has(file.type)) {
      return jsonError("Hanya PNG, JPG, atau WebP yang diizinkan.", 422);
    }
    if (file.size > MAX_SIZE) {
      return jsonError("Maksimal ukuran file 2MB.", 422);
    }
    if (!(await hasValidMagicBytes(file))) {
      return jsonError("Isi file tidak sesuai format gambar.", 422);
    }

    // 2. Buat path unik di dalam bucket store ini.
    const extMatch = file.name.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? `.${extMatch[1].toLowerCase()}` : "";
    const path = `${auth.ctx.store.id}/${randomName(ext)}`;

    // 3. Unggah ke Supabase Storage.
    const supabase = await createClient();
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

    if (error) {
      return jsonError("Gagal mengunggah file.", 500);
    }

    // 4. Buat URL publik untuk file tsb.
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
    return NextResponse.json({ data: { url: urlData.publicUrl, bucket, path } }, { status: 201 });
  } catch {
    return jsonError("Gagal mengunggah file.", 500);
  }
}
