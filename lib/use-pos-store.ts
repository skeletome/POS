import { create } from "zustand";
import {
  initialBanks,
  initialCashiers,
  initialProducts,
  initialStoreSettings,
  initialTaxSettings,
  initialTransactions,
} from "./dummy-data";
import type {
  Bank,
  CartItem,
  Cashier,
  Category,
  OrderType,
  Product,
  Role,
  StoreSettings,
  TaxSettings,
  Transaction,
} from "./types/index";
import type { PaymentSettings } from "./schemas/payment";

export type { PaymentSettings };

export interface PosState {
  user: { name: string; role: Role } | null;
  storeId: string | null;
  login: (name: string, role: Role) => void;
  setSession: (s: { userId: string; name: string; role: Role; storeId: string }) => void;
  logout: () => void;

  products: Product[];
  categories: Category[];
  banks: Bank[];
  cashiers: Cashier[];
  transactions: Transaction[];
  storeSettings: StoreSettings;
  taxSettings: TaxSettings;
  paymentSettings: PaymentSettings;

  cart: CartItem[];
  orderType: OrderType;

  hydrate: (d: {
    products?: Product[];
    categories?: Category[];
    banks?: Bank[];
    cashiers?: Cashier[];
    transactions?: Transaction[];
    storeSettings?: StoreSettings;
    taxSettings?: TaxSettings;
    paymentSettings?: PaymentSettings;
  }) => void;

  dataLoaded: boolean;

  setStoreSettings: (s: StoreSettings) => void;
  setTaxSettings: (t: TaxSettings) => void;
  setPaymentSettings: (p: PaymentSettings) => void;

  setOrderType: (t: OrderType) => void;
  addToCart: (item: CartItem) => void;
  addMerged: (item: CartItem) => void;
  quickAdd: (product: Product) => void;
  changeQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
}

export const usePosStore = create<PosState>((set, get) => ({
  user: null,
  storeId: null,
  login: (name, role) => set({ user: { name, role } }),
  setSession: ({ name, role, storeId }) => set({ user: { name, role }, storeId }),
  logout: () => set({ user: null, storeId: null, cart: [] }),

  products: initialProducts,
  categories: [],
  banks: initialBanks,
  cashiers: initialCashiers,
  transactions: initialTransactions,
  storeSettings: initialStoreSettings,
  taxSettings: initialTaxSettings,
  paymentSettings: { cashEnabled: true, bankEnabled: true, qrisEnabled: true },

  cart: [],
  orderType: "DINE_IN",
  dataLoaded: false,

  hydrate: (d) =>
    set((s) => ({
      ...(d.products ? { products: d.products } : {}),
      ...(d.categories ? { categories: d.categories } : {}),
      ...(d.banks ? { banks: d.banks } : {}),
      ...(d.cashiers ? { cashiers: d.cashiers } : {}),
      ...(d.transactions ? { transactions: d.transactions } : {}),
      ...(d.storeSettings ? { storeSettings: d.storeSettings } : {}),
      ...(d.taxSettings ? { taxSettings: d.taxSettings } : {}),
      ...(d.paymentSettings ? { paymentSettings: d.paymentSettings } : {}),
      dataLoaded: true,
    })),

  setStoreSettings: (storeSettings) => set({ storeSettings }),
  setTaxSettings: (taxSettings) => set({ taxSettings }),
  setPaymentSettings: (paymentSettings) => set({ paymentSettings }),

  setOrderType: (orderType) => set({ orderType }),
  addToCart: (item) => set((s) => ({ cart: [...s.cart, item] })),
  addMerged: (item) =>
    set((s) => {
      const signature = [
        item.productId,
        item.orderType,
        ...item.options.map((o) => o.optionId).sort(),
      ].join("|");
      const existing = s.cart.find((c) => {
        const sig = [
          c.productId,
          c.orderType,
          ...c.options.map((o) => o.optionId).sort(),
        ].join("|");
        return sig === signature;
      });
      if (existing) {
        return {
          cart: s.cart.map((c) =>
            c.id === existing.id ? { ...c, quantity: c.quantity + item.quantity } : c,
          ),
        };
      }
      return { cart: [...s.cart, item] };
    }),
  quickAdd: (product) => {
    const s = get();
    const unitPrice =
      s.orderType === "DINE_IN" ? product.dineInPrice : product.takeawayPrice;
    s.addMerged({
      id: crypto.randomUUID(),
      productId: product.id,
      productName: product.name,
      orderType: s.orderType,
      unitPrice,
      quantity: 1,
      options: [],
    });
  },
  changeQuantity: (id, delta) =>
    set((s) => ({
      cart: s.cart
        .map((c) => (c.id === id ? { ...c, quantity: Math.max(1, c.quantity + delta) } : c))
        .filter((c) => c.quantity > 0),
    })),
  removeFromCart: (id) => set((s) => ({ cart: s.cart.filter((c) => c.id !== id) })),
  clearCart: () => set({ cart: [] }),
}));