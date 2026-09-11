"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/keys";
import type { Product, ProductInput } from "@/lib/schemas";
import type {
  Bank,
  Category,
  Cashier,
  Transaction,
  TaxSettings,
  PaymentSettings,
  ProductDiscount,
  Voucher,
} from "@/lib/types";
import type {
  TransactionCreateInput,
  ProductDiscountInput,
  VoucherInput,
  VoucherUpdateInput,
  StockMutationInput,
  StockMovement,
} from "@/lib/schemas";
import type { ProductDiscountUpdateInput } from "@/lib/schemas/discount";
import { usePosStore } from "@/lib/use-pos-store";

interface ApiError {
  error?: { message?: string; code?: string };
}

async function handleError(res: Response): Promise<never> {
  let message = "Terjadi kesalahan.";
  let body: ApiError | null = null;
  try {
    body = (await res.json()) as ApiError;
  } catch {
    // ignore
  }
  message = body?.error?.message ?? message;
  const err = new Error(message) as Error & { code?: string };
  err.code = body?.error?.code;
  throw err;
}

export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: async () => {
      const res = await fetch("/api/me");
      if (!res.ok) return handleError(res);
      const { data } = (await res.json()) as {
        data: {
          profile: { id: string; name: string; email: string };
          membership: { role: "OWNER" | "CASHIER" };
          store: { id: string; name: string };
        };
      };
      return data;
    },
    staleTime: Infinity,
  });
}

export function useProducts() {
  return useQuery({
    queryKey: queryKeys.products.all,
    queryFn: async () => {
      const res = await fetch("/api/products");
      if (!res.ok) return handleError(res);
      const { data } = (await res.json()) as { data: { products: Product[] } };
      return data.products;
    },
  });
}

export interface ProductsPageParams {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  sortBy?: "name" | "dineInPrice" | "takeawayPrice" | "createdAt";
  sortDir?: "asc" | "desc";
}

export interface ProductsPageData {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
}

export function useProductsPage(params: ProductsPageParams = {}) {
  const { page = 1, pageSize = 10, ...filters } = params;
  return useQuery({
    queryKey: queryKeys.products.page(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const sp = new URLSearchParams();
      sp.set("page", String(page));
      sp.set("pageSize", String(pageSize));
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== "") sp.set(key, String(value));
      }
      const res = await fetch(`/api/products?${sp.toString()}`);
      if (!res.ok) return handleError(res);
      const { data } = (await res.json()) as { data: ProductsPageData };
      return data;
    },
    retry: 1,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) return handleError(res);
      const { data } = (await res.json()) as { data: { categories: Category[] } };
      return data.categories;
    },
  });
}

const invalidateProducts = (queryClient: ReturnType<typeof useQueryClient>) => {
  void queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
};

async function fetchProductsIntoStore() {
  const res = await fetch("/api/products");
  if (!res.ok) return handleError(res);
  const { data } = (await res.json()) as { data: { products: Product[] } };
  usePosStore.getState().setProducts(data.products);
}

const invalidateStockChanges = (queryClient: ReturnType<typeof useQueryClient>) => {
  void queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.stockMovements() });
  void fetchProductsIntoStore();
};

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProductInput) => {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) return handleError(res);
      return res.json();
    },
    onSuccess: () => invalidateProducts(queryClient),
  });
}

export function useUpdateProduct(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProductInput) => {
      const res = await fetch(`/api/products/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) return handleError(res);
      return res.json();
    },
    onSuccess: () => invalidateProducts(queryClient),
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/products/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) return handleError(res);
      return res.json();
    },
    onSuccess: () => invalidateProducts(queryClient),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string }) => {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) return handleError(res);
      return res.json();
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.categories }),
  });
}

export function useUpdateCategory(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; active: boolean }) => {
      const res = await fetch(`/api/categories/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) return handleError(res);
      return res.json();
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.categories }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/categories/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) return handleError(res);
      return res.json();
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.categories }),
  });
}

export function useBanks() {
  return useQuery({
    queryKey: queryKeys.banks,
    queryFn: async () => {
      const res = await fetch("/api/banks");
      if (!res.ok) return handleError(res);
      const { data } = (await res.json()) as { data: { banks: Bank[] } };
      return data.banks;
    },
  });
}

export function useUpdateStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: {
        storeSettings?: { storeName: string; information: string };
        taxSettings?: TaxSettings;
        paymentSettings?: PaymentSettings;
        qrisSettings?: { qrisName?: string; qrisEnabled?: boolean; qrisImageUrl?: string | null };
      },
    ) => {
      const res = await fetch("/api/store", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return handleError(res);
      return res.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.settings });
    },
  });
}

export function useUploadImage() {
  return useMutation({
    mutationFn: async ({ bucket, file }: { bucket: string; file: Blob }) => {
      const body = new FormData();
      body.append("bucket", bucket);
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      if (!res.ok) return handleError(res);
      const json = (await res.json()) as { data: { url: string } };
      return json.data.url;
    },
  });
}

export function useCreateBank() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string }) => {
      const res = await fetch("/api/banks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) return handleError(res);
      return res.json();
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.banks }),
  });
}

export function useUpdateBank() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; name?: string; active?: boolean; logo?: string | null }) => {
      const { id, ...payload } = input;
      const res = await fetch(`/api/banks/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return handleError(res);
      return res.json();
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.banks }),
  });
}

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: async () => {
      const res = await fetch("/api/store");
      if (!res.ok) return handleError(res);
      const { data } = (await res.json()) as {
        data: {
          storeSettings: { storeName: string; information: string };
          taxSettings: TaxSettings;
          paymentSettings: PaymentSettings;
          qrisSettings: { qrisName: string; qrisImageUrl: string | null; qrisEnabled: boolean };
        };
      };
      return data;
    },
  });
}

export function useCashiers(enabled = true) {
  return useQuery({
    queryKey: queryKeys.cashiers,
    queryFn: async () => {
      const res = await fetch("/api/cashiers");
      if (!res.ok) return handleError(res);
      const { data } = (await res.json()) as { data: { cashiers: Cashier[] } };
      return data.cashiers;
    },
    enabled,
  });
}

export function useCreateCashier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; email: string; password: string }) => {
      const res = await fetch("/api/cashiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) return handleError(res);
      return res.json();
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.cashiers }),
  });
}

export function useUpdateCashier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; active: boolean }) => {
      const { id, ...payload } = input;
      const res = await fetch(`/api/cashiers/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return handleError(res);
      return res.json();
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.cashiers }),
  });
}

export function useTransactions(from?: string, to?: string) {
  return useQuery({
    queryKey: queryKeys.transactions.range(from, to),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (!res.ok) return handleError(res);
      const { data } = (await res.json()) as { data: { transactions: Transaction[] } };
      return data.transactions;
    },
  });
}

export interface TransactionsPageParams {
  page?: number;
  pageSize?: number;
  from?: string;
  to?: string;
  search?: string;
  status?: string;
  payment?: string;
  orderType?: string;
  cashier?: string;
  sortBy?: "createdAt" | "total";
  sortDir?: "asc" | "desc";
}

export interface TransactionsPageData {
  transactions: Transaction[];
  total: number;
  page: number;
  pageSize: number;
}

export function useTransactionsPage(params: TransactionsPageParams = {}) {
  const { page = 1, pageSize = 10, ...filters } = params;
  return useQuery({
    queryKey: queryKeys.transactions.page(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const sp = new URLSearchParams();
      sp.set("page", String(page));
      sp.set("pageSize", String(pageSize));
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== "") sp.set(key, String(value));
      }
      const res = await fetch(`/api/transactions?${sp.toString()}`);
      if (!res.ok) return handleError(res);
      const { data } = (await res.json()) as { data: TransactionsPageData };
      return data;
    },
    retry: 1,
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: queryKeys.transactions.detail(id),
    queryFn: async () => {
      const res = await fetch(`/api/transactions/${encodeURIComponent(id)}`);
      if (!res.ok) return handleError(res);
      const { data } = (await res.json()) as { data: { transaction: Transaction } };
      return data.transaction;
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: TransactionCreateInput) => {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) return handleError(res);
      return (await res.json()) as { data: { transactionNo: string; total: number } };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.reports() });
    },
  });
}

export function useUpdateTransactionStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (status: "PENDING" | "COMPLETED" | "CANCELLED") => {
      const res = await fetch(`/api/transactions/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) return handleError(res);
      return res.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.transactions.detail(id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.stockMovements() });
      void fetchProductsIntoStore();
    },
  });
}

export interface StockMovementsParams {
  productId?: string;
  type?: string;
  from?: string;
  to?: string;
  limit?: number;
}

export function useStockMovements(filters: StockMovementsParams = {}) {
  return useQuery({
    queryKey: queryKeys.stockMovements(filters),
    queryFn: async () => {
      const sp = new URLSearchParams();
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== "") sp.set(key, String(value));
      }
      const res = await fetch(`/api/stock/movements?${sp.toString()}`);
      if (!res.ok) return handleError(res);
      const { data } = (await res.json()) as { data: { movements: StockMovement[] } };
      return data.movements;
    },
  });
}

export function useStockMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: StockMutationInput) => {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) return handleError(res);
      return res.json();
    },
    onSuccess: () => invalidateStockChanges(queryClient),
  });
}

export interface ReportsData {
  totals: {
    totalSales: number;
    totalTransactions: number;
    totalItemsSold: number;
    averageTransactionValue: number;
  };
  topProducts: { name: string; quantity: number; revenue: number }[];
  paymentBreakdown: { method: string; total: number }[];
}

export function useReports(from?: Date, to?: Date) {
  return useQuery({
    queryKey: queryKeys.reports(from?.toISOString(), to?.toISOString()),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (from) params.set("from", from.toISOString());
      if (to) params.set("to", to.toISOString());
      const res = await fetch(`/api/reports?${params.toString()}`);
      if (!res.ok) return handleError(res);
      const { data } = (await res.json()) as { data: ReportsData };
      return data;
    },
  });
}

export function useDiscounts() {
  return useQuery({
    queryKey: queryKeys.discounts,
    queryFn: async () => {
      const res = await fetch("/api/discounts");
      if (!res.ok) return handleError(res);
      const { data } = (await res.json()) as { data: { discounts: ProductDiscount[] } };
      return data.discounts;
    },
  });
}

export function useCreateDiscount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProductDiscountInput) => {
      const res = await fetch("/api/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) return handleError(res);
      return res.json();
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.discounts }),
  });
}

export function useUpdateDiscount(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProductDiscountUpdateInput) => {
      const res = await fetch(`/api/discounts/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) return handleError(res);
      return res.json();
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.discounts }),
  });
}

export function useDeleteDiscount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/discounts/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) return handleError(res);
      return res.json();
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.discounts }),
  });
}

export function useVouchers() {
  return useQuery({
    queryKey: queryKeys.vouchers,
    queryFn: async () => {
      const res = await fetch("/api/vouchers");
      if (!res.ok) return handleError(res);
      const { data } = (await res.json()) as { data: { vouchers: Voucher[] } };
      return data.vouchers;
    },
  });
}

export function useCreateVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: VoucherInput) => {
      const res = await fetch("/api/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) return handleError(res);
      return res.json();
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.vouchers }),
  });
}

export function useUpdateVoucher(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: VoucherUpdateInput) => {
      const res = await fetch(`/api/vouchers/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) return handleError(res);
      return res.json();
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.vouchers }),
  });
}

export function useDeleteVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/vouchers/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) return handleError(res);
      return res.json();
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.vouchers }),
  });
}