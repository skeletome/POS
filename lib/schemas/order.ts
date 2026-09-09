import { z } from "zod";

export const orderTypeSchema = z.enum(["DINE_IN", "TAKEAWAY"]);
export const paymentMethodSchema = z.enum(["CASH", "BANK_TRANSFER", "QRIS"]);
export const transactionStatusSchema = z.enum(["PENDING", "COMPLETED", "CANCELLED"]);
export const roleSchema = z.enum(["OWNER", "CASHIER"]);
