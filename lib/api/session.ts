import { getSessionUser, jsonError } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export interface MyContextProfile {
  id: string;
  email: string;
  name: string;
}

export interface MyContextMembership {
  id: string;
  store_id: string;
  user_id: string;
  role: "OWNER" | "CASHIER";
  active: boolean;
  created_at: string;
}

export interface MyContextStore {
  id: string;
  name: string;
  information: string;
  logo_url: string | null;
  cash_enabled: boolean;
  bank_enabled: boolean;
  qris_enabled: boolean;
  qris_image_url: string | null;
  qris_name: string;
  tax_enabled: boolean;
  dine_in_tax: number;
  takeaway_tax: number;
}

export interface MyContext {
  profile: MyContextProfile;
  membership: MyContextMembership;
  store: MyContextStore;
}

export async function getMyContext(): Promise<MyContext | null> {
  const user = await getSessionUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_my_context");

  if (error || !data) return null;
  const ctx = data as MyContext;
  if (!ctx.profile || !ctx.membership || !ctx.store) return null;
  return ctx;
}

export type StoreContext = Pick<MyContext, "profile" | "membership" | "store">;

export async function requireStoreContext(): Promise<
  { ok: true; ctx: StoreContext } | { ok: false; response: Response }
> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, response: jsonError("Tidak terautentikasi.", 401, "UNAUTHENTICATED") };
  }

  const ctx = await getMyContext();
  if (!ctx) {
    return {
      ok: false,
      response: jsonError(
        "Akun tidak terhubung ke store mana pun. Hubungi Owner.",
        403,
        "NO_MEMBERSHIP",
      ),
    };
  }

  return { ok: true, ctx };
}

export function isOwner(ctx: StoreContext): boolean {
  return ctx.membership.role === "OWNER";
}