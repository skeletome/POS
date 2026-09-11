export const queryKeys = {
  me: ["me"] as const,
  products: {
    all: ["products"] as const,
    page: (params: unknown) => ["products", "page", params] as const,
  },
  categories: ["categories"] as const,
  options: ["options"] as const,
  banks: ["banks"] as const,
  discounts: ["discounts"] as const,
  vouchers: ["vouchers"] as const,
  settings: ["settings"] as const,
  cashiers: ["cashiers"] as const,
  transactions: {
    all: ["transactions"] as const,
    detail: (id: string) => ["transactions", id] as const,
    range: (from?: string, to?: string) => ["transactions", { from, to }] as const,
    page: (params: unknown) => ["transactions", "page", params] as const,
  },
  reports: (from?: string, to?: string) => ["reports", { from, to }] as const,
  stockMovements: (filters?: object) => ["stock", "movements", filters] as const,
};