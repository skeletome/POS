import { z } from "zod";

export const selectedOptionSnapshotSchema = z.object({
  groupId: z.string(),
  groupName: z.string(),
  optionId: z.string(),
  optionName: z.string(),
  price: z.number().min(0),
});

export const transactionItemInputSchema = z.object({
  productId: z.string(),
  productName: z.string().min(1),
  unitPrice: z.number().min(0),
  quantity: z.number().int().min(1),
  options: z.array(selectedOptionSnapshotSchema),
});

export const cashPaymentSchema = z.object({
  method: z.literal("CASH"),
  amountPaid: z.number().min(0),
  change: z.number().min(0),
});

export const bankPaymentSchema = z.object({
  method: z.literal("BANK_TRANSFER"),
  bankId: z.string(),
  bankName: z.string().min(1),
});

export const qrisPaymentSchema = z.object({
  method: z.literal("QRIS"),
  qrisName: z.string().min(1),
});

export const paymentInfoSchema = z.discriminatedUnion("method", [
  cashPaymentSchema,
  bankPaymentSchema,
  qrisPaymentSchema,
]);

export const transactionCreateSchema = z.object({
  orderType: z.enum(["DINE_IN", "TAKEAWAY"]),
  payment: paymentInfoSchema,
  cashierName: z.string().default("Kasir"),
  items: z.array(transactionItemInputSchema).min(1, "Keranjang kosong"),
  voucherCode: z.string().trim().optional(),
});

export const transactionStatusUpdateSchema = z.object({
  status: z.enum(["PENDING", "COMPLETED", "CANCELLED"]),
});

export type TransactionCreateInput = z.infer<typeof transactionCreateSchema>;
export type TransactionStatusUpdateInput = z.infer<typeof transactionStatusUpdateSchema>;
export type PaymentInfoInput = z.infer<typeof paymentInfoSchema>;