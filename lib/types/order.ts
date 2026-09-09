export type OrderType = "DINE_IN" | "TAKEAWAY";
export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "QRIS";
export type TransactionStatus = "PENDING" | "COMPLETED" | "CANCELLED";
export type Role = "OWNER" | "CASHIER";

export interface SelectedOption {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  price: number;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  orderType: OrderType;
  unitPrice: number;
  quantity: number;
  options: SelectedOption[];
}

export interface TransactionItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  options: SelectedOption[];
  subtotal: number;
}

export type PaymentInfo =
  | { method: "CASH"; amountPaid: number; change: number }
  | { method: "BANK_TRANSFER"; bankId: string; bankName: string }
  | { method: "QRIS"; qrisName: string };

export interface Transaction {
  id: string;
  cashier: string;
  orderType: OrderType;
  items: TransactionItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  payment: PaymentInfo;
  status: TransactionStatus;
  createdAt: string;
}
