/*
 * POST /api/auth/login
 *
 * Alur (flow):
 *   1. Ambil alamat IP client (dari header) untuk rate limiting.
 *   2. Rate limit percobaan login (loginLimiter) -> jika lewat batas, balas 429.
 *   3. Baca & validasi body (email + password) dengan Zod.
 *   4. Panggil signInWithPassword via server client (cookie session otomatis diset).
 *   5. Jika email/password salah -> balas 401 (tanpa membocorkan detail).
 *   6. Jika sukses -> ambil konteks user (profil, membership, store, settings) -> return.
 */
import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/schemas/auth";
import { createClient } from "@/lib/supabase/server";
import { getMyContext } from "@/lib/api/session";
import { storesToSettings } from "@/lib/api/products";
import { jsonError, parseJsonBody } from "@/lib/api/utilities";
import { loginLimiter, rateLimit } from "@/lib/rate-limit";
import { constants as http } from "http2";

function getClientIp(request: NextRequest): string {
  // Prefer x-real-ip (set by trusted reverse proxy, not spoofable from client).
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  // x-forwarded-for may be forged by clients, so only trust the LAST value,
  // which is the one appended by the trusted proxy (the first is client-controlled).
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
    return parts[parts.length - 1] || "unknown";
  }

  return "unknown";
}

export async function POST(request: NextRequest) {
  // 1. Rate limit login berdasarkan IP.
  const ip = getClientIp(request);
  const limited = await rateLimit(loginLimiter, `login:${ip}`);
  if (limited) return limited;

  // 2. Baca & validasi body.
  const parsedBody = await parseJsonBody<unknown>(request);
  if (!parsedBody.ok) return parsedBody.response;

  const parsed = loginSchema.safeParse(parsedBody.data);
  if (!parsed.success) {
    return jsonError("Email atau password salah.", http.HTTP_STATUS_UNAUTHORIZED, "INVALID_CREDENTIALS");
  }

  try {
    // 3. Login ke Supabase (session disimpan sebagai cookie oleh @supabase/ssr).
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email.trim().toLowerCase(),
      password: parsed.data.password,
    });

    if (error) {
      return jsonError("Email atau password salah.", http.HTTP_STATUS_UNAUTHORIZED, "INVALID_CREDENTIALS");
    }

    // 4. Ambil konteks user untuk dikembalikan ke client.
    const ctx = await getMyContext();
    if (!ctx) {
      return jsonError("Akun tidak terhubung ke store mana pun.", http.HTTP_STATUS_FORBIDDEN, "NO_MEMBERSHIP");
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
    return jsonError("Gagal melakukan login.", http.HTTP_STATUS_INTERNAL_SERVER_ERROR);
  }
}
