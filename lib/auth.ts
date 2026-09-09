import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export interface AppUser {
  userId: string;
  email: string;
}

export async function getSessionUser(): Promise<AppUser | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { userId: data.user.id, email: data.user.email ?? "" };
}

export function jsonError(message: string, status = 400, code?: string) {
  return NextResponse.json(
    { error: { message, ...(code ? { code } : {}) } },
    { status },
  );
}

export function requireAuthFailed() {
  return jsonError("Tidak terautentikasi atau sesi berakhir.", 401, "UNAUTHENTICATED");
}

export function requireOwnerFailed() {
  return jsonError("Aksi hanya untuk Owner.", 403, "FORBIDDEN");
}