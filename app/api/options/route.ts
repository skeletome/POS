/*
 * GET /api/options
 *
 * Alur (flow):
 *   1. Cek user sudah login & punya store (requireStoreContext).
 *   2. Ambil semua option groups milik store tsb.
 *   3. Ambil semua options yang termasuk dalam groups tsb.
 *   4. Kelompokkan options per group & mapping ke bentuk frontend.
 *   5. Return daftar optionGroups.
 */
import { NextResponse } from "next/server";
import { requireStoreContext } from "@/lib/api/session";
import type { OptionGroup } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/api/utilities";

export async function GET() {
  const auth = await requireStoreContext();
  if (!auth.ok) return auth.response;

  try {
    const supabase = await createClient();

    // 1. Ambil semua option groups milik store ini.
    const { data: groups, error: gErr } = await supabase
      .from("option_groups")
      .select("*")
      .eq("store_id", auth.ctx.store.id)
      .order("sort_order");

    if (gErr) return jsonError("Gagal memuat option groups.", 500);

    // 2. Ambil semua options dari groups tsb (jika ada).
    const groupIds = (groups ?? []).map((g) => g.id);
    const { data: options, error: oErr } = groupIds.length
      ? await supabase
          .from("options")
          .select("*")
          .in("option_group_id", groupIds)
          .order("sort_order")
      : { data: [], error: null };

    if (oErr) return jsonError("Gagal memuat options.", 500);

    // 3. Kelompokkan options berdasarkan group id.
    const optionsByGroup = new Map<string, typeof options[number][]>();
    for (const o of options ?? []) {
      const list = optionsByGroup.get(o.option_group_id) ?? [];
      list.push(o);
      optionsByGroup.set(o.option_group_id, list);
    }

    // 4. Mapping ke bentuk frontend (camelCase).
    const optionGroups: OptionGroup[] = (groups ?? []).map((g) => ({
      id: g.id,
      name: g.name,
      multiple: g.multiple,
      options: (optionsByGroup.get(g.id) ?? []).map((o) => ({
        id: o.id,
        name: o.name,
        additionalPrice: o.additional_price,
      })),
    }));

    return NextResponse.json({ data: { optionGroups } });
  } catch {
    return jsonError("Gagal memuat opsi produk.", 500);
  }
}
