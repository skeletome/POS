import type {
  Bank,
  Cashier,
  Category,
  OrderType,
  PaymentInfo,
  Product,
  StoreSettings,
  TaxSettings,
  Transaction,
} from "./types/index";

export const categories: Category[] = [
  { id: "cat-makanan", name: "Makanan", active: true },
  { id: "cat-minuman", name: "Minuman", active: true },
  { id: "cat-snack", name: "Snack", active: true },
  { id: "cat-dessert", name: "Dessert", active: true },
];

export const initialProducts: Product[] = [
  {
    id: "p-nasi-goreng",
    name: "Nasi Goreng Spesial",
    description: "Nasi goreng dengan telur, ayam suwir, dan kerupuk.",
    emoji: "🍛",
    categoryId: "cat-makanan",
    dineInAvailable: true,
    takeawayAvailable: true,
    dineInPrice: 20000,
    takeawayPrice: 22000,
    active: true,
    optionGroups: [
      {
        id: "og-nasgor-ukuran",
        name: "Ukuran",
        multiple: false,
        options: [
          { id: "opt-nasgor-reg", name: "Regular", additionalPrice: 0 },
          { id: "opt-nasgor-jumbo", name: "Jumbo", additionalPrice: 5000 },
        ],
      },
      {
        id: "og-nasgor-level",
        name: "Level Pedas",
        multiple: false,
        options: [
          { id: "opt-nasgor-tp", name: "Tidak Pedas", additionalPrice: 0 },
          { id: "opt-nasgor-sedang", name: "Sedang", additionalPrice: 0 },
          { id: "opt-nasgor-pedas", name: "Pedas", additionalPrice: 0 },
        ],
      },
      {
        id: "og-nasgor-extra",
        name: "Extra",
        multiple: true,
        options: [
          { id: "opt-nasgor-telur", name: "Telur", additionalPrice: 3000 },
          { id: "opt-nasgor-kerupuk", name: "Kerupuk", additionalPrice: 2000 },
        ],
      },
    ],
  },
  {
    id: "p-mie-goreng",
    name: "Mie Goreng Jawa",
    description: "Mie goreng khas Jawa dengan bakso dan sayur.",
    emoji: "🍜",
    categoryId: "cat-makanan",
    dineInAvailable: true,
    takeawayAvailable: true,
    dineInPrice: 18000,
    takeawayPrice: 20000,
    active: true,
    optionGroups: [
      {
        id: "og-mie-level",
        name: "Level Pedas",
        multiple: false,
        options: [
          { id: "opt-mie-sedang", name: "Sedang", additionalPrice: 0 },
          { id: "opt-mie-pedas", name: "Pedas", additionalPrice: 0 },
        ],
      },
      {
        id: "og-mie-extra",
        name: "Extra",
        multiple: true,
        options: [
          { id: "opt-mie-bakso", name: "Bakso", additionalPrice: 3000 },
          { id: "opt-mie-telur", name: "Telur", additionalPrice: 3000 },
        ],
      },
    ],
  },
  {
    id: "p-ayam-geprek",
    name: "Ayam Geprek",
    description: "Ayam goreng digeprek dengan sambal pedas.",
    emoji: "🍗",
    categoryId: "cat-makanan",
    dineInAvailable: true,
    takeawayAvailable: true,
    dineInPrice: 17000,
    takeawayPrice: 19000,
    active: true,
    optionGroups: [
      {
        id: "og-geprek-level",
        name: "Level Sambal",
        multiple: false,
        options: [
          { id: "opt-geprek-1", name: "Level 1", additionalPrice: 0 },
          { id: "opt-geprek-2", name: "Level 2", additionalPrice: 0 },
          { id: "opt-geprek-3", name: "Level 3", additionalPrice: 1000 },
        ],
      },
    ],
  },
  {
    id: "p-ayam-goreng",
    name: "Ayam Goreng Kremes",
    description: "Ayam goreng dengan kremes renyah.",
    emoji: "🍗",
    categoryId: "cat-makanan",
    dineInAvailable: true,
    takeawayAvailable: false,
    dineInPrice: 15000,
    takeawayPrice: 17000,
    active: true,
    optionGroups: [],
  },
  {
    id: "p-es-teh",
    name: "Es Teh Manis",
    description: "Teh manis dingin dengan es batu.",
    emoji: "🍹",
    categoryId: "cat-minuman",
    dineInAvailable: true,
    takeawayAvailable: true,
    dineInPrice: 5000,
    takeawayPrice: 6000,
    active: true,
    optionGroups: [
      {
        id: "og-teh-gula",
        name: "Level Gula",
        multiple: false,
        options: [
          { id: "opt-teh-polos", name: "Tanpa Gula", additionalPrice: 0 },
          { id: "opt-teh-sedang", name: "Sedang", additionalPrice: 0 },
          { id: "opt-teh-manis", name: "Manis", additionalPrice: 0 },
        ],
      },
    ],
  },
  {
    id: "p-es-jeruk",
    name: "Es Jeruk Peras",
    description: "Jeruk peras asli dengan es.",
    emoji: "🍊",
    categoryId: "cat-minuman",
    dineInAvailable: true,
    takeawayAvailable: true,
    dineInPrice: 8000,
    takeawayPrice: 9000,
    active: true,
    optionGroups: [],
  },
  {
    id: "p-es-campur",
    name: "Es Campur",
    description: "Es campur dengan berbagai topping.",
    emoji: "🍧",
    categoryId: "cat-dessert",
    dineInAvailable: true,
    takeawayAvailable: true,
    dineInPrice: 12000,
    takeawayPrice: 13000,
    active: true,
    optionGroups: [
      {
        id: "og-campur-topping",
        name: "Topping",
        multiple: true,
        options: [
          { id: "opt-campur-alpukat", name: "Alpukat", additionalPrice: 4000 },
          { id: "opt-campur-susu", name: "Susu Kental", additionalPrice: 2000 },
          { id: "opt-campur-nangka", name: "Nangka", additionalPrice: 3000 },
        ],
      },
    ],
  },
  {
    id: "p-roti-bakar",
    name: "Roti Bakar",
    description: "Roti bakar coklat keju.",
    emoji: "🍞",
    categoryId: "cat-snack",
    dineInAvailable: true,
    takeawayAvailable: true,
    dineInPrice: 10000,
    takeawayPrice: 11000,
    active: true,
    optionGroups: [
      {
        id: "og-roti-isi",
        name: "Isi",
        multiple: true,
        options: [
          { id: "opt-roti-coklat", name: "Coklat", additionalPrice: 0 },
          { id: "opt-roti-keju", name: "Keju", additionalPrice: 2000 },
          { id: "opt-roti-kacang", name: "Kacang", additionalPrice: 1000 },
        ],
      },
    ],
  },
  {
    id: "p-tahu-crispy",
    name: "Tahu Crispy",
    description: "Tahu goreng renyah dengan saus.",
    emoji: "🥟",
    categoryId: "cat-snack",
    dineInAvailable: true,
    takeawayAvailable: false,
    dineInPrice: 8000,
    takeawayPrice: 10000,
    active: true,
    optionGroups: [],
  },
  {
    id: "p-pisang-goreng",
    name: "Pisang Goreng",
    description: "Pisang goreng dengan taburan gula.",
    emoji: "🍌",
    categoryId: "cat-snack",
    dineInAvailable: true,
    takeawayAvailable: true,
    dineInPrice: 7000,
    takeawayPrice: 8000,
    active: true,
    optionGroups: [
      {
        id: "og-pisang-top",
        name: "Topping",
        multiple: true,
        options: [
          { id: "opt-pisang-keju", name: "Keju", additionalPrice: 2000 },
          { id: "opt-pisang-coklat", name: "Coklat", additionalPrice: 1500 },
        ],
      },
    ],
  },
  {
    id: "p-kopi-susu",
    name: "Kopi Susu Gula Aren",
    description: "Kopi susu dengan gula aren asli.",
    emoji: "☕",
    categoryId: "cat-minuman",
    dineInAvailable: true,
    takeawayAvailable: true,
    dineInPrice: 15000,
    takeawayPrice: 16000,
    active: true,
    optionGroups: [
      {
        id: "og-kopi-es",
        name: "Penyajian",
        multiple: false,
        options: [
          { id: "opt-kopi-es", name: "Es", additionalPrice: 0 },
          { id: "opt-kopi-panas", name: "Panas", additionalPrice: 0 },
        ],
      },
    ],
  },
];

export const initialBanks: Bank[] = [
  { id: "bank-bca", name: "BCA", active: true },
  { id: "bank-bni", name: "BNI", active: true },
  { id: "bank-mandiri", name: "Mandiri", active: true },
  { id: "bank-bri", name: "BRI", active: false },
];

export const initialCashiers: Cashier[] = [
  { id: "cashier-1", name: "Rina", email: "rina@tokokita.id", active: true },
  { id: "cashier-2", name: "Budi", email: "budi@tokokita.id", active: true },
  { id: "cashier-3", name: "Sari", email: "sari@tokokita.id", active: false },
];

export const initialStoreSettings: StoreSettings = {
  storeName: "POS",
  information: "Jl. Merdeka No. 45, Jakarta Pusat - Menerima dine-in & takeaway.",
};

export const initialTaxSettings: TaxSettings = {
  enabled: true,
  dineInRate: 0.1,
  takeawayRate: 0.05,
};

function isoDaysAgo(days: number, hour: number, minute: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function makeTransaction(
  id: string,
  daysAgo: number,
  hour: number,
  minute: number,
  cashier: string,
  orderType: OrderType,
  items: { name: string; unitPrice: number; quantity: number; options?: { name: string; price: number }[] }[],
  payment: PaymentInfo,
  status: Transaction["status"],
  taxRate: number,
): Transaction {
  const itemLines = items.map((it) => ({
    productId: id,
    productName: it.name,
    unitPrice: it.unitPrice,
    quantity: it.quantity,
    options: (it.options ?? []).map((o) => ({
      groupId: "",
      groupName: "",
      optionId: "",
      optionName: o.name,
      price: o.price,
    })),
    subtotal: (it.unitPrice + (it.options ?? []).reduce((s, o) => s + o.price, 0)) * it.quantity,
  }));
  const subtotal = itemLines.reduce((s, i) => s + i.subtotal, 0);
  const taxAmount = Math.round(subtotal * taxRate);
  const total = subtotal + taxAmount;
  return {
    id,
    cashier,
    orderType,
    items: itemLines,
    subtotal,
    discountAmount: 0,
    voucherCode: null,
    taxRate,
    taxAmount,
    total,
    payment,
    status,
    createdAt: isoDaysAgo(daysAgo, hour, minute),
  };
}

export const initialTransactions: Transaction[] = [
  makeTransaction(
    "TRX-0001",
    0, 10, 15,
    "Rina",
    "DINE_IN",
    [
      { name: "Nasi Goreng Spesial", unitPrice: 20000, quantity: 1, options: [{ name: "Jumbo", price: 5000 }, { name: "Telur", price: 3000 }] },
      { name: "Es Teh Manis", unitPrice: 5000, quantity: 2 },
    ],
    { method: "CASH", amountPaid: 50000, change: 8000 },
    "COMPLETED",
    0.1,
  ),
  makeTransaction(
    "TRX-0002",
    0, 11, 40,
    "Budi",
    "TAKEAWAY",
    [
      { name: "Ayam Geprek", unitPrice: 19000, quantity: 2, options: [{ name: "Level 2", price: 0 }] },
      { name: "Es Jeruk Peras", unitPrice: 9000, quantity: 2 },
    ],
    { method: "BANK_TRANSFER", bankId: "bank-bca", bankName: "BCA" },
    "COMPLETED",
    0.05,
  ),
  makeTransaction(
    "TRX-0003",
    0, 13, 5,
    "Rina",
    "DINE_IN",
    [
      { name: "Kopi Susu Gula Aren", unitPrice: 15000, quantity: 1, options: [{ name: "Es", price: 0 }] },
      { name: "Roti Bakar", unitPrice: 10000, quantity: 1, options: [{ name: "Coklat", price: 0 }, { name: "Keju", price: 2000 }] },
    ],
    { method: "QRIS", qrisName: "QRIS Warung Kopi Kita" },
    "COMPLETED",
    0.1,
  ),
  makeTransaction(
    "TRX-0004",
    0, 15, 30,
    "Rina",
    "DINE_IN",
    [
      { name: "Mie Goreng Jawa", unitPrice: 18000, quantity: 1, options: [{ name: "Pedas", price: 0 }, { name: "Bakso", price: 3000 }] },
    ],
    { method: "CASH", amountPaid: 25000, change: 3000 },
    "PENDING",
    0.1,
  ),
  makeTransaction(
    "TRX-0005",
    1, 12, 0,
    "Budi",
    "TAKEAWAY",
    [
      { name: "Nasi Goreng Spesial", unitPrice: 22000, quantity: 2, options: [{ name: "Jumbo", price: 5000 }] },
      { name: "Es Campur", unitPrice: 13000, quantity: 1, options: [{ name: "Alpukat", price: 4000 }] },
    ],
    { method: "CASH", amountPaid: 100000, change: 15000 },
    "COMPLETED",
    0.05,
  ),
  makeTransaction(
    "TRX-0006",
    1, 17, 45,
    "Rina",
    "DINE_IN",
    [
      { name: "Ayam Goreng Kremes", unitPrice: 15000, quantity: 3 },
      { name: "Es Teh Manis", unitPrice: 5000, quantity: 3 },
    ],
    { method: "BANK_TRANSFER", bankId: "bank-bni", bankName: "BNI" },
    "COMPLETED",
    0.1,
  ),
  makeTransaction(
    "TRX-0007",
    2, 9, 20,
    "Budi",
    "TAKEAWAY",
    [
      { name: "Pisang Goreng", unitPrice: 8000, quantity: 4, options: [{ name: "Keju", price: 2000 }] },
      { name: "Kopi Susu Gula Aren", unitPrice: 16000, quantity: 2, options: [{ name: "Es", price: 0 }] },
    ],
    { method: "QRIS", qrisName: "QRIS Warung Kopi Kita" },
    "COMPLETED",
    0.05,
  ),
  makeTransaction(
    "TRX-0008",
    3, 14, 10,
    "Rina",
    "DINE_IN",
    [
      { name: "Tahu Crispy", unitPrice: 8000, quantity: 2 },
      { name: "Mie Goreng Jawa", unitPrice: 18000, quantity: 2, options: [{ name: "Sedang", price: 0 }, { name: "Telur", price: 3000 }] },
    ],
    { method: "CASH", amountPaid: 60000, change: 2000 },
    "CANCELLED",
    0.1,
  ),
];

export const orderTypeLabels: Record<OrderType, string> = {
  DINE_IN: "Dine-in",
  TAKEAWAY: "Takeaway",
};

export const paymentMethodLabels: Record<PaymentInfo["method"], string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank Transfer",
  QRIS: "QRIS",
};