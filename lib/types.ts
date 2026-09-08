export type OrderType = "DINE_IN" | "TAKEAWAY";
export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "QRIS";
export type TransactionStatus = "PENDING" | "COMPLETED" | "CANCELLED";
export type Role = "OWNER" | "CASHIER";

export interface Option {
  id: string;
  name: string;
  price: number;
}

export interface OptionGroup {
  id: string;
  name: string;
  multiple: boolean;
  options: Option[];
}

export interface Category {
  id: string;
  name: string;
  active: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  emoji: string;
  categoryId: string;
  dineInAvailable: boolean;
  takeawayAvailable: boolean;
  dineInPrice: number;
  takeawayPrice: number;
  active: boolean;
  optionGroups: OptionGroup[];
}

export interface SelectedOption {
  groupName: string;
  optionName: string;
  price: number;
}

export interface CartItem {
  key: string;
  productId: string;
  name: string;
  emoji: string;
  unitPrice: number;
  quantity: number;
  orderType: OrderType;
  selectedOptions: SelectedOption[];
  subtotal: number;
}

export interface TransactionItem {
  productId: string;
  name: string;
  emoji: string;
  unitPrice: number;
  quantity: number;
  orderType: OrderType;
  selectedOptions: SelectedOption[];
  subtotal: number;
}

export interface PaymentInfo {
  amountPaid?: number;
  change?: number;
  bankId?: string;
  bankName?: string;
  bankLogo?: string;
  qrisImage?: string;
}

export interface Transaction {
  id: string;
  storeId: string;
  cashier: string;
  orderType: OrderType;
  items: TransactionItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: TransactionStatus;
  paymentMethod: PaymentMethod;
  payment: PaymentInfo;
  createdAt: string;
}

export interface Bank {
  id: string;
  name: string;
  logo: string;
  active: boolean;
}

export interface TaxSettings {
  dineInRate: number;
  takeawayRate: number;
  enabled: boolean;
}

export interface PaymentSettings {
  cash: boolean;
  bankTransfer: boolean;
  qris: boolean;
}

export interface StoreSettings {
  name: string;
  logo: string;
  info: string;
  address: string;
  phone: string;
  dineInEnabled: boolean;
  takeawayEnabled: boolean;
  tax: TaxSettings;
  payment: PaymentSettings;
  qrisImage: string;
}

export interface Cashier {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: string;
}