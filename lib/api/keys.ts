export const queryKeys = {
  me: ["me"] as const,
  products: ["products"] as const,
  categories: ["categories"] as const,
  options: ["options"] as const,
  banks: ["banks"] as const,
  settings: ["settings"] as const,
  cashiers: ["cashiers"] as const,
  transactions: {
    all: ["transactions"] as const,
    detail: (id: string) => ["transactions", id] as const,
    range: (from?: string, to?: string) => ["transactions", { from, to }] as const,
  },
  reports: (from?: string, to?: string) => ["reports", { from, to }] as const,
};