import { z } from "zod";

export const movementTypeSchema = z.enum([
  "SALE",
  "RETURN",
  "PURCHASE",
  "ADJUSTMENT",
  "OPNAME",
]);

export const stockMutationTypeSchema = z.enum(["PURCHASE", "ADJUST", "OPNAME"]);

export const stockMutationSchema = z
  .object({
    productId: z.string().min(1, "Produk wajib dipilih"),
    type: stockMutationTypeSchema,
    quantity: z.number().int().positive().optional(),
    newStock: z.number().int().min(0).optional(),
    note: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "PURCHASE") {
      if (data.quantity === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["quantity"],
          message: "Jumlah tambahan stok wajib diisi.",
        });
      }
    } else {
      if (data.newStock === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["newStock"],
          message: "Stok akhir wajib diisi.",
        });
      }
      if (!data.note || !data.note.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["note"],
          message: "Catatan/alasan wajib diisi untuk sesuaikan/opname.",
        });
      }
    }
  });

export type MovementType = z.infer<typeof movementTypeSchema>;
export type StockMutationType = z.infer<typeof stockMutationTypeSchema>;
export type StockMutationInput = z.infer<typeof stockMutationSchema>;

export interface StockMovement {
  id: string;
  productId: string;
  productName?: string;
  type: MovementType;
  quantity: number;
  balanceAfter: number;
  transactionId?: string | null;
  createdAt: string;
  note?: string | null;
}