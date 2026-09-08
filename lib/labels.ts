import type { OrderType, PaymentMethod, TransactionStatus } from "./types";

export const orderTypeLabel = (t: OrderType) => (t === "DINE_IN" ? "Dine-in" : "Takeaway");

export const paymentLabel = (p: PaymentMethod) =>
  p === "CASH" ? "Cash" : p === "BANK_TRANSFER" ? "Bank Transfer" : "QRIS";

export const statusLabel = (s: TransactionStatus) =>
  s === "COMPLETED" ? "Completed" : s === "PENDING" ? "Pending" : "Dibatalkan";