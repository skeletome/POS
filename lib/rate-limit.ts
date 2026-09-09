/*
 * Rate Limiting dengan Upstash.
 *
 * Helper ini aman walau env Upstash belum diisi: jika `UPSTASH_REDIS_REST_URL` atau
 * `UPSTASH_REDIS_REST_TOKEN` kosong, semua limiter mati (no-op) sehingga aplikasi
 * tetap berjalan normal.
 *
 * Setelah env diisi, limiter aktif otomatis.
 */
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const reveal = (bytes: number) => {
  let out = "";
  for (let i = 0; i < bytes; i++) out += Math.floor(Math.random() * 16).toString(16);
  return out;
};

const generateIdentifier = () =>
  [reveal(2), reveal(2), reveal(2), reveal(2)].join(".");

const hasUpstashKeys: boolean =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

/** Membuat limiter sliding-window; mengembalikan null jika env tidak tersedia. */
function makeLimiter(limit: number, windowMs: number, prefix: string): Ratelimit | null {
  if (!hasUpstashKeys) return null;
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
    analytics: true,
    prefix: `pos.${prefix}`,
  });
}

/** Login: maksimal 5 percobaan per menit. */
export const loginLimiter = makeLimiter(5, 60_000, "login");

/** Operasi tulis umum (POS, kategori, bank, dst): 30 per menit. */
export const writeLimiter = makeLimiter(30, 60_000, "write");

/** Upload file: 10 per menit. */
export const uploadLimiter = makeLimiter(10, 60_000, "upload");

/**
 * Menjalankan pengecekan rate limit untuk identifier tertentu.
 * Mengembalikan respons 429 jika melewati batas, atau null jika aman / limiter nonaktif.
 */
export async function rateLimit(
  limiter: Ratelimit | null,
  identifier: string,
): Promise<NextResponse | null> {
  if (!limiter) return null;

  const id = identifier.trim() || generateIdentifier();
  const { success, limit, reset } = await limiter.limit(id);

  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);
    return NextResponse.json(
      {
        error: {
          message: "Terlalu banyak permintaan. Silakan coba lagi nanti.",
          code: "RATE_LIMITED",
        },
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(limit),
        },
      },
    );
  }

  return null;
}
