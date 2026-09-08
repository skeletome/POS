import type {
  Bank,
  CartItem,
  Cashier,
  Category,
  OrderType,
  Product,
  StoreSettings,
  Transaction,
} from "./types";

export function computeItemPrice(product: Product, orderType: OrderType): number {
  return orderType === "DINE_IN" ? product.dineInPrice : product.takeawayPrice;
}

export function computeItemSubtotal(unitPrice: number, quantity: number): number {
  return unitPrice * quantity;
}

export function taxRateFor(orderType: OrderType, taxRate: number, takeawayRate: number): number {
  return orderType === "DINE_IN" ? taxRate : takeawayRate;
}

// --- Seed data ---------------------------------------------------------------

export const seedCategories: Category[] = [
  { id: "cat-makanan", name: "Makanan", active: true },
  { id: "cat-minuman", name: "Minuman", active: true },
  { id: "cat-snack", name: "Snack", active: true },
  { id: "cat-dessert", name: "Dessert", active: true },
];

export const seedBanks: Bank[] = [
  { id: "bca", name: "BCA", logo: "🏦", active: true },
  { id: "bni", name: "BNI", logo: "🏦", active: true },
  { id: "mandiri", name: "Mandiri", logo: "🏦", active: true },
];

export const seedCashiers: Cashier[] = [
  { id: "u-rina", name: "Rina Kartika", email: "rina@pos.app", role: "CASHIER", active: true, createdAt: "2026-01-10T08:00:00.000Z" },
  { id: "u-budi", name: "Budi Santoso", email: "budi@pos.app", role: "CASHIER", active: true, createdAt: "2026-02-14T08:00:00.000Z" },
  { id: "u-dewi", name: "Dewi Lestari", email: "dewi@pos.app", role: "CASHIER", active: true, createdAt: "2026-03-02T08:00:00.000Z" },
  { id: "u-eko", name: "Eko Prasetyo", email: "eko@pos.app", role: "CASHIER", active: false, createdAt: "2026-04-20T08:00:00.000Z" },
];

const opt = (id: string, name: string, price = 0) => ({ id, name, price });

export const seedProducts: Product[] = [
  {
    id: "p-nasgor",
    name: "Nasi Goreng",
    description: "Nasi goreng spesial dengan bumbu rahasia khas warung.",
    emoji: "🍳",
    categoryId: "cat-makanan",
    dineInAvailable: true,
    takeawayAvailable: true,
    dineInPrice: 20000,
    takeawayPrice: 22000,
    active: true,
    optionGroups: [
      {
        id: "og-nasgor-size",
        name: "Ukuran",
        multiple: false,
        options: [opt("o-regular", "Regular"), opt("o-jumbo", "Jumbo", 5000)],
      },
      {
        id: "og-nasgor-spicy",
        name: "Level Pedas",
        multiple: false,
        options: [opt("o-tidak-pedas", "Tidak Pedas"), opt("o-sedang", "Sedang"), opt("o-pedas", "Pedas")],
      },
      {
        id: "og-nasgor-extra",
        name: "Extra",
        multiple: true,
        options: [opt("o-telur", "Telur", 3000), opt("o-kerupuk", "Kerupuk", 2000)],
      },
    ],
  },
  {
    id: "p-miegoreng",
    name: "Mie Goreng",
    description: "Mie goreng dengan sayuran segar dan telur.",
    emoji: "🍜",
    categoryId: "cat-makanan",
    dineInAvailable: true,
    takeawayAvailable: true,
    dineInPrice: 18000,
    takeawayPrice: 20000,
    active: true,
    optionGroups: [
      {
        id: "og-mie-spicy",
        name: "Level Pedas",
        multiple: false,
        options: [opt("o-tidak-pedas", "Tidak Pedas"), opt("o-sedang", "Sedang"), opt("o-pedas", "Pedas")],
      },
    ],
  },
  {
    id: "p-ayamgeprek",
    name: "Ayam Geprek",
    description: "Ayam goreng digeprek dengan sambal bawang.",
    emoji: "🍗",
    categoryId: "cat-makanan",
    dineInAvailable: true,
    takeawayAvailable: true,
    dineInPrice: 15000,
    takeawayPrice: 16000,
    active: true,
    optionGroups: [
      {
        id: "og-ayam-spicy",
        name: "Level Sambal",
        multiple: false,
        options: [opt("o-normal", "Normal"), opt("o-pedas", "Pedas"), opt("o-ekstra-pedas", "Ekstra Pedas")],
      },
      {
        id: "og-ayam-extra",
        name: "Extra",
        multiple: true,
        options: [opt("o-keju", "Keju", 5000)],
      },
    ],
  },
  {
    id: "p-sate",
    name: "Sate Ayam",
    description: "Sate ayam bumbu kacang, 10 tusuk.",
    emoji: "🍢",
    categoryId: "cat-makanan",
    dineInAvailable: true,
    takeawayAvailable: true,
    dineInPrice: 17000,
    takeawayPrice: 18000,
    active: true,
    optionGroups: [],
  },
  {
    id: "p-baksourat",
    name: "Bakso Urat",
    description: "Bakso urat sapi dengan kuah kaldu. Hanya dine-in.",
    emoji: "🥣",
    categoryId: "cat-makanan",
    dineInAvailable: true,
    takeawayAvailable: false,
    dineInPrice: 16000,
    takeawayPrice: 16000,
    active: true,
    optionGroups: [],
  },
  {
    id: "p-nasibungkus",
    name: "Nasi Bungkus",
    description: "Nasi rames praktis dibungkus kertas. Hanya takeaway.",
    emoji: "🍱",
    categoryId: "cat-makanan",
    dineInAvailable: false,
    takeawayAvailable: true,
    dineInPrice: 12000,
    takeawayPrice: 12000,
    active: true,
    optionGroups: [],
  },
  {
    id: "p-esteh",
    name: "Es Teh Manis",
    description: "Teh manis dingin dengan es batu segar.",
    emoji: "🧋",
    categoryId: "cat-minuman",
    dineInAvailable: true,
    takeawayAvailable: true,
    dineInPrice: 5000,
    takeawayPrice: 6000,
    active: true,
    optionGroups: [
      {
        id: "og-teh-es",
        name: "Level Es",
        multiple: false,
        options: [opt("o-es-sedikit", "Es Sedikit"), opt("o-es-banyak", "Es Banyak"), opt("o-tanpa-es", "Tanpa Es")],
      },
    ],
  },
  {
    id: "p-esjeruk",
    name: "Es Jeruk",
    description: "Jeruk peras dingin, menyegarkan.",
    emoji: "🍊",
    categoryId: "cat-minuman",
    dineInAvailable: true,
    takeawayAvailable: true,
    dineInPrice: 7000,
    takeawayPrice: 8000,
    active: true,
    optionGroups: [],
  },
  {
    id: "p-jusalpukat",
    name: "Jus Alpukat",
    description: "Jus alpukat creamy dengan susu kental manis.",
    emoji: "🥑",
    categoryId: "cat-minuman",
    dineInAvailable: true,
    takeawayAvailable: true,
    dineInPrice: 15000,
    takeawayPrice: 17000,
    active: true,
    optionGroups: [
      {
        id: "og-jus-size",
        name: "Ukuran",
        multiple: false,
        options: [opt("o-small", "Small"), opt("o-large", "Large", 4000)],
      },
      {
        id: "og-jus-topping",
        name: "Topping",
        multiple: true,
        options: [opt("o-selasih", "Biji Selasih", 2000)],
      },
    ],
  },
  {
    id: "p-kopesusu",
    name: "Kopi Susu Gula Aren",
    description: "Kopi susu dengan gula aren asli.",
    emoji: "☕",
    categoryId: "cat-minuman",
    dineInAvailable: true,
    takeawayAvailable: true,
    dineInPrice: 18000,
    takeawayPrice: 20000,
    active: true,
    optionGroups: [],
  },
  {
    id: "p-kentang",
    name: "Kentang Goreng",
    description: "Kentang goreng renyah dengan taburan bumbu.",
    emoji: "🍟",
    categoryId: "cat-snack",
    dineInAvailable: true,
    takeawayAvailable: true,
    dineInPrice: 12000,
    takeawayPrice: 13000,
    active: true,
    optionGroups: [
      {
        id: "og-kentang-extra",
        name: "Extra",
        multiple: true,
        options: [opt("o-saus-keju", "Saus Keju", 4000)],
      },
    ],
  },
  {
    id: "p-pisanggoreng",
    name: "Pisang Goreng",
    description: "Pisang goreng manis dengan taburan gula.",
    emoji: "🍌",
    categoryId: "cat-snack",
    dineInAvailable: true,
    takeawayAvailable: true,
    dineInPrice: 10000,
    takeawayPrice: 11000,
    active: true,
    optionGroups: [],
  },
  {
    id: "p-rotibakar",
    name: "Roti Bakar Coklat",
    description: "Roti bakar dengan olesan coklat meises.",
    emoji: "🍞",
    categoryId: "cat-snack",
    dineInAvailable: true,
    takeawayAvailable: true,
    dineInPrice: 12000,
    takeawayPrice: 13000,
    active: true,
    optionGroups: [],
  },
  {
    id: "p-eskrim",
    name: "Es Krim",
    description: "Es krim vanila dengan topping pilihan.",
    emoji: "🍨",
    categoryId: "cat-dessert",
    dineInAvailable: true,
    takeawayAvailable: true,
    dineInPrice: 8000,
    takeawayPrice: 9000,
    active: true,
    optionGroups: [],
  },
  {
    id: "p-puding",
    name: "Pudding Coklat",
    description: "Pudding coklat lembut dengan saus.",
    emoji: "🍮",
    categoryId: "cat-dessert",
    dineInAvailable: true,
    takeawayAvailable: true,
    dineInPrice: 10000,
    takeawayPrice: 11000,
    active: true,
    optionGroups: [],
  },
  {
    id: "p-brownies",
    name: "Brownies",
    description: "Brownies panggang fudgy dengan kacang.",
    emoji: "🍫",
    categoryId: "cat-dessert",
    dineInAvailable: true,
    takeawayAvailable: true,
    dineInPrice: 15000,
    takeawayPrice: 16000,
    active: true,
    optionGroups: [],
  },
];

export const seedSettings: StoreSettings = {
  name: "Warung Kopi Nusantara",
  logo: "☕",
  info: "Warung & kedai makanan minuman sederhana",
  address: "Jl. Merdeka No. 12, Bandung",
  phone: "0812-3456-7890",
  dineInEnabled: true,
  takeawayEnabled: true,
  tax: { dineInRate: 10, takeawayRate: 5, enabled: true },
  payment: { cash: true, bankTransfer: true, qris: true },
  qrisImage: "qris-placeholder",
};

// --- Deterministic pseudo-random (fixed seed -> stable SSR/CSR) -------------
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const activeWithOptions = seedProducts.filter((p) => p.active && p.optionGroups.length > 0);
const allActive = seedProducts.filter((p) => p.active);

function pickSeeded<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function generateTransaction(
  rng: () => number,
  index: number,
  createdAt: string,
): Transaction {
  const orderType: OrderType = rng() > 0.5 ? "DINE_IN" : "TAKEAWAY";
  const cashiers = seedCashiers.filter((c) => c.active).map((c) => c.name);
  const cashier = pickSeeded(rng, cashiers);

  const itemCount = 1 + Math.floor(rng() * 3);
  const items: Transaction["items"] = [];
  for (let i = 0; i < itemCount; i++) {
    const product = pickSeeded(rng, allActive);
    if (!product[orderType === "DINE_IN" ? "dineInAvailable" : "takeawayAvailable"]) continue;
    const unitPrice =
      orderType === "DINE_IN" ? product.dineInPrice : product.takeawayPrice;
    const quantity = 1 + Math.floor(rng() * 2);
    const selectedOptions = product.optionGroups.map((g) => {
      if (g.multiple) {
        if (rng() > 0.5) return [];
        const count = 1 + Math.floor(rng() * g.options.length);
        return g.options.slice(0, count);
      }
      if (rng() > 0.7) return [];
      return [pickSeeded(rng, g.options)];
    }).flat();

    const optionCharge = selectedOptions.reduce((sum, o) => sum + o.price, 0);
    const itemUnitPrice = unitPrice + optionCharge;
    items.push({
      productId: product.id,
      name: product.name,
      emoji: product.emoji,
      unitPrice: itemUnitPrice,
      quantity,
      orderType,
      selectedOptions: selectedOptions.map((o) => ({ groupName: "", optionName: o.name, price: o.price })),
      subtotal: itemUnitPrice * quantity,
    });
  }

  const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
  const rate = orderType === "DINE_IN" ? seedSettings.tax.dineInRate : seedSettings.tax.takeawayRate;
  const taxAmount = (subtotal * rate) / 100;
  const total = subtotal + taxAmount;

  const payRoll = rng();
  const paymentMethod = payRoll < 0.5 ? "CASH" : payRoll < 0.8 ? "BANK_TRANSFER" : "QRIS";
  const status = rng() > 0.92 ? "CANCELLED" : rng() > 0.85 ? "PENDING" : "COMPLETED";

  let payment: Transaction["payment"] = {};
  if (paymentMethod === "CASH") {
    const amountPaid = total + Math.floor(rng() * 5) * 5000;
    payment = { amountPaid, change: amountPaid - total };
  } else if (paymentMethod === "BANK_TRANSFER") {
    const bank = pickSeeded(rng, seedBanks);
    payment = { bankId: bank.id, bankName: bank.name, bankLogo: bank.logo };
  } else {
    payment = { qrisImage: seedSettings.qrisImage };
  }

  return {
    id: `TRX-${String(1000 + index).padStart(4, "0")}`,
    storeId: "store-1",
    cashier,
    orderType,
    items,
    subtotal,
    taxRate: rate,
    taxAmount,
    total,
    status,
    paymentMethod,
    payment,
    createdAt,
  };
}

function seedTransactions(): Transaction[] {
  const rng = mulberry32(20260908);
  const list: Transaction[] = [];
  for (let i = 0; i < 90; i++) {
    const day = Math.floor(rng() * 30);
    const hour = 8 + Math.floor(rng() * 13);
    const minute = Math.floor(rng() * 60);
    const date = new Date();
    date.setDate(date.getDate() - day);
    date.setHours(hour, minute, 0, 0);
    list.push(generateTransaction(rng, 90 - i, date.toISOString()));
  }
  return list;
}

// --- localStorage persistence --------------------------------------------------

const KEYS = {
  transactions: "pos.transactions",
  products: "pos.products",
  settings: "pos.settings",
  cashiers: "pos.cashiers",
};

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

const seeded = seedTransactions();

export function loadTransactions(): Transaction[] {
  return readJSON<Transaction[]>(KEYS.transactions, seeded);
}

export function prependTransaction(tx: Transaction) {
  const current = readJSON<Transaction[]>(KEYS.transactions, seeded);
  writeJSON(KEYS.transactions, [tx, ...current]);
}

export function loadProducts(): Product[] {
  return readJSON<Product[]>(KEYS.products, seedProducts);
}

export function saveProducts(list: Product[]) {
  writeJSON(KEYS.products, list);
}

export function loadSettings(): StoreSettings {
  return readJSON<StoreSettings>(KEYS.settings, seedSettings);
}

export function saveSettings(s: StoreSettings) {
  writeJSON(KEYS.settings, s);
}

export function loadCashiers(): Cashier[] {
  return readJSON<Cashier[]>(KEYS.cashiers, seedCashiers);
}

export function saveCashiers(list: Cashier[]) {
  writeJSON(KEYS.cashiers, list);
}

export function loadCategories(): Category[] {
  const products = loadProducts();
  const usedIds = new Set(products.map((p) => p.categoryId));
  return seedCategories.map((c) => ({ ...c, active: c.active || usedIds.has(c.id) }));
}

export function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function cartItemKey(parts: { productId: string; orderType: OrderType; options: string }): string {
  return `${parts.productId}::${parts.orderType}::${parts.options}`;
}

export function describeCartItem(item: CartItem): string {
  return item.selectedOptions.map((o) => o.optionName).join(", ");
}