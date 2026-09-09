import { createClient } from "@supabase/supabase-js";

/**
 * Admin client memakai service_role key — MELEWATI seluruh RLS.
 * Server-only. Jangan pernah di-import dari client component.
 * Hanya untuk: create cashier user (auth.admin) & seed script.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}