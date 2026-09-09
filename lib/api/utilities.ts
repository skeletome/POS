import { NextResponse } from "next/server";

/** Helper untuk mengubah respon error menjadi format JSON konsisten. */
export function jsonError(message: string, status = 400, code?: string) {
  return NextResponse.json(
    { error: { message, ...(code ? { code } : {}) } },
    { status },
  );
}

/**
 * Membaca & mengurai body JSON dari request.
 * Mengembalikan data terurai, atau respon error jika body bukan JSON valid.
 */
export async function parseJsonBody<T>(
  request: Request,
): Promise<{ ok: true; data: T } | { ok: false; response: Response }> {
  try {
    const data = (await request.json()) as T;
    return { ok: true, data };
  } catch {
    return { ok: false, response: jsonError("Body JSON tidak valid.") };
  }
}

/** Membaca parameter pagination `limit` dari query string (dibatasi maksimal). */
export function getLimitParam(url: URL, defaultLimit = 50, maxLimit = 200): number {
  const raw = Number(url.searchParams.get("limit"));
  if (!Number.isFinite(raw) || raw <= 0) return defaultLimit;
  return Math.min(raw, maxLimit);
}

/** Membaca rentang tanggal `from`/`to` dari query string. */
export function getDateRangeParam(url: URL): { from: string | null; to: string | null } {
  return {
    from: url.searchParams.get("from"),
    to: url.searchParams.get("to"),
  };
}

/** Domain yang diizinkan untuk URL gambar yang disimpan. */
const ALLOWED_IMAGE_HOSTS = new Set<string>([
  "res.cloudinary.com", // upload.cdn cloudinary (hero/logo)
  "cdn.ipaslogo.com", // mascot
]);

/** Memvalidasi URL gambar agar hanya mengarah ke host tepercaya. */
export function isAllowedImageUrl(value: string | null | undefined): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      // izinkan URL storage Supabase (di-host di URL proyek supabase)
      (url.hostname.endsWith(".supabase.co") ||
        url.hostname === "supabase.co" ||
        ALLOWED_IMAGE_HOSTS.has(url.hostname))
    );
  } catch {
    return false;
  }
}
