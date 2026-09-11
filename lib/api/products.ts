import type { SupabaseClient } from "@supabase/supabase-js";
import type { Product, ProductInput } from "@/lib/schemas/product";
import type { MyContextStore } from "@/lib/api/session";

export interface ProductRow {
  id: string;
  store_id: string;
  category_id: string | null;
  name: string;
  description: string;
  image_url: string | null;
  emoji: string | null;
  dine_in_available: boolean;
  takeaway_available: boolean;
  dine_in_price: number;
  takeaway_price: number;
  active: boolean;
  track_stock: boolean;
  stock: number;
  low_stock_threshold: number;
  created_at?: string;
  updated_at?: string;
}

export interface OptionGroupRow {
  id: string;
  store_id: string;
  product_id: string;
  name: string;
  multiple: boolean;
  sort_order: number;
}

export interface OptionRow {
  id: string;
  option_group_id: string;
  name: string;
  additional_price: number;
  sort_order: number;
}

export function toProduct(
  product: ProductRow,
  optionGroups: (Omit<OptionGroupRow, "store_id" | "product_id"> & { options: OptionRow[] })[],
): Product {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    image: product.image_url ?? undefined,
    emoji: product.emoji ?? undefined,
    categoryId: product.category_id ?? "",
    dineInAvailable: product.dine_in_available,
    takeawayAvailable: product.takeaway_available,
    dineInPrice: product.dine_in_price,
    takeawayPrice: product.takeaway_price,
    active: product.active,
    trackStock: product.track_stock,
    stock: product.stock,
    lowStockThreshold: product.low_stock_threshold,
    optionGroups: optionGroups.map((g) => ({
      id: g.id,
      name: g.name,
      multiple: g.multiple,
      options: g.options
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((o) => ({
          id: o.id,
          name: o.name,
          additionalPrice: o.additional_price,
        })),
    })),
  };
}

export async function listProducts(
  supabase: SupabaseClient,
  storeId: string,
): Promise<{ products: Product[] }> {
  const { data: productRows, error: pErr } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", storeId)
    .order("name");

  if (pErr) throw pErr;

  const { data: groupRows, error: gErr } = await supabase
    .from("option_groups")
    .select("*")
    .eq("store_id", storeId)
    .order("sort_order");

  if (gErr) throw gErr;

  const groupIds = (groupRows ?? []).map((g) => g.id);
  const { data: optionRows, error: oErr } = groupIds.length
    ? await supabase.from("options").select("*").in("option_group_id", groupIds).order("sort_order")
    : { data: [], error: null };

  if (oErr) throw oErr;

  return { products: mapToProducts(productRows ?? [], groupRows ?? [], optionRows ?? []) };
}

const PRODUCT_SORT_COLUMNS = {
  name: "name",
  dineInPrice: "dine_in_price",
  takeawayPrice: "takeaway_price",
  createdAt: "created_at",
} as const;

export type ProductSortBy = keyof typeof PRODUCT_SORT_COLUMNS;

export type ProductStockStatus = "ALL" | "LOW" | "OUT";

export interface ListProductsPageParams {
  page: number;
  pageSize: number;
  search?: string;
  categoryId?: string;
  stockStatus?: ProductStockStatus;
  sortBy?: ProductSortBy;
  sortDir?: "asc" | "desc";
}

export async function listProductsPage(
  supabase: SupabaseClient,
  storeId: string,
  params: ListProductsPageParams,
): Promise<{ products: Product[]; total: number }> {
  const {
    page,
    pageSize,
    search,
    categoryId,
    stockStatus,
    sortBy = "name",
    sortDir = "asc",
  } = params;

  const base = supabase.from("products");
  type ProductsQuery = ReturnType<typeof base.select>;

  const withFilters = (q: ProductsQuery): ProductsQuery => {
    let query = q.eq("store_id", storeId);
    if (categoryId) query = query.eq("category_id", categoryId);
    if (search) query = query.ilike("name", `%${search}%`);
    if (stockStatus === "LOW") {
      query = query
        .eq("track_stock", true)
        .gt("stock", 0)
        .or("stock.lt.low_stock_threshold");
    }
    if (stockStatus === "OUT") {
      query = query.eq("track_stock", true).eq("stock", 0);
    }
    return query;
  };

  // total untuk pagination (head: hanya count, tanpa body)
  const { count: total, error: countError } = await withFilters(
    base.select("id", { count: "exact", head: true }),
  );
  if (countError) throw countError;

  const col = PRODUCT_SORT_COLUMNS[sortBy];
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  // ambil data halaman: filter + urutkan -> range
  const { data: productRows, error: pErr } = await withFilters(
    base.select("*").order(col, { ascending: sortDir !== "desc" }),
  ).range(start, end);

  if (pErr) throw pErr;

  const pageIds = ((productRows ?? []) as ProductRow[]).map((p) => p.id);
  const { data: groupRows, error: gErr } = pageIds.length
    ? await supabase
        .from("option_groups")
        .select("*")
        .eq("store_id", storeId)
        .in("product_id", pageIds)
        .order("sort_order")
    : { data: [], error: null };

  if (gErr) throw gErr;

  const groupIds = ((groupRows ?? []) as OptionGroupRow[]).map((g) => g.id);
  const { data: optionRows, error: oErr } = groupIds.length
    ? await supabase.from("options").select("*").in("option_group_id", groupIds).order("sort_order")
    : { data: [], error: null };

  if (oErr) throw oErr;

  return {
    products: mapToProducts(
      (productRows ?? []) as ProductRow[],
      (groupRows ?? []) as OptionGroupRow[],
      (optionRows ?? []) as OptionRow[],
    ),
    total: total ?? 0,
  };
}

function mapToProducts(
  productRows: ProductRow[],
  groupRows: OptionGroupRow[],
  optionRows: OptionRow[],
): Product[] {
  const groupsByProduct = new Map<string, Map<string, OptionRow[]>>();
  for (const g of groupRows) {
    const gMap = groupsByProduct.get(g.product_id) ?? new Map<string, OptionRow[]>();
    gMap.set(g.id, []);
    groupsByProduct.set(g.product_id, gMap);
  }
  for (const o of optionRows) {
    const parent = groupRows.find((g) => g.id === o.option_group_id);
    groupsByProduct.get(parent?.product_id ?? "")?.get(o.option_group_id)?.push(o);
  }

  return productRows.map((p) => {
    const gMap = groupsByProduct.get(p.id) ?? new Map<string, OptionRow[]>();
    const groups = Array.from(gMap.entries()).map(([groupId, options]) => {
      const g = groupRows.find((x) => x.id === groupId);
      return {
        id: groupId,
        name: g?.name ?? "",
        multiple: g?.multiple ?? false,
        sort_order: g?.sort_order ?? 0,
        options: options ?? [],
      };
    });
    return toProduct(p, groups);
  });
}

export function productToRow(input: ProductInput, storeId: string): ProductRow {
  return {
    id: input.id,
    store_id: storeId,
    category_id: input.categoryId || null,
    name: input.name.trim(),
    description: input.description.trim(),
    image_url: input.image ?? null,
    emoji: input.emoji || null,
    dine_in_available: input.dineInAvailable,
    takeaway_available: input.takeawayAvailable,
    dine_in_price: input.dineInPrice,
    takeaway_price: input.takeawayPrice,
    active: input.active,
    track_stock: input.trackStock,
    stock: input.stock,
    low_stock_threshold: input.lowStockThreshold,
  };
}

export async function insertProductWithOptions(
  supabase: SupabaseClient,
  storeId: string,
  input: ProductInput,
): Promise<void> {
  const row = productToRow(input, storeId);
  const { error } = await supabase.from("products").insert(row);
  if (error) throw error;

  await insertOptionGroups(supabase, storeId, input.id, input.optionGroups);
}

export async function updateProductAndOptions(
  supabase: SupabaseClient,
  storeId: string,
  productId: string,
  input: ProductInput,
): Promise<void> {
  const current = await listProducts(supabase, storeId);
  if (!current.products.some((p) => p.id === productId)) {
    throw new Error("Produk tidak ditemukan.");
  }

  const row = productToRow({ ...input, id: productId }, storeId);
  const { error } = await supabase
    .from("products")
    .update({
      name: row.name,
      category_id: row.category_id,
      description: row.description,
      image_url: row.image_url,
      emoji: row.emoji,
      dine_in_available: row.dine_in_available,
      takeaway_available: row.takeaway_available,
      dine_in_price: row.dine_in_price,
      takeaway_price: row.takeaway_price,
      active: row.active,
      track_stock: row.track_stock,
      stock: row.stock,
      low_stock_threshold: row.low_stock_threshold,
    })
    .eq("id", productId)
    .eq("store_id", storeId);
  if (error) throw error;

  // replace option groups (cascade menghapus options)
  const { error: delErr } = await supabase
    .from("option_groups")
    .delete()
    .eq("product_id", productId)
    .eq("store_id", storeId);
  if (delErr) throw delErr;

  await insertOptionGroups(supabase, storeId, productId, input.optionGroups);
}

async function insertOptionGroups(
  supabase: SupabaseClient,
  storeId: string,
  productId: string,
  groups: ProductInput["optionGroups"],
): Promise<void> {
  for (let gi = 0; gi < groups.length; gi++) {
    const g = groups[gi];
    const { error: gErr } = await supabase.from("option_groups").insert({
      id: g.id,
      store_id: storeId,
      product_id: productId,
      name: g.name.trim(),
      multiple: g.multiple,
      sort_order: gi,
    });
    if (gErr) throw gErr;

    const optionRows = g.options.map((o, oi) => ({
      id: o.id,
      option_group_id: g.id,
      name: o.name.trim(),
      additional_price: o.additionalPrice,
      sort_order: oi,
    }));

    const { error: oErr } = await supabase.from("options").insert(optionRows);
    if (oErr) throw oErr;
  }
}

export function storesToSettings(stores: MyContextStore) {
  return {
    storeSettings: {
      storeName: stores.name,
      information: stores.information,
      logoUrl: stores.logo_url ?? undefined,
    },
    taxSettings: {
      enabled: stores.tax_enabled,
      dineInRate: Number(stores.dine_in_tax),
      takeawayRate: Number(stores.takeaway_tax),
    },
    paymentSettings: {
      cashEnabled: stores.cash_enabled,
      bankEnabled: stores.bank_enabled,
      qrisEnabled: stores.qris_enabled,
    },
    qrisSettings: {
      qrisName: stores.qris_name,
      qrisImageUrl: stores.qris_image_url ?? null,
      qrisEnabled: stores.qris_enabled,
    },
  };
}