import { z } from "zod";

export const discountTypeSchema = z.enum(["PERCENT", "FIXED"]);

export const productDiscountSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Nama promo wajib diisi"),
  discountType: discountTypeSchema,
  discountValue: z.number().positive("Nilai diskon harus lebih dari 0"),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  active: z.boolean(),
  productIds: z.array(z.string()),
  createdAt: z.string().optional(),
});

export const productDiscountCreateSchema = z.object({
  name: z.string().min(1, "Nama promo wajib diisi"),
  discountType: discountTypeSchema,
  discountValue: z.coerce.number().positive("Nilai diskon harus lebih dari 0"),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  active: z.boolean().default(true),
  productIds: z.array(z.string()).min(1, "Pilih minimal satu produk"),
});

export const productDiscountUpdateSchema = z.object({
  name: z.string().min(1, "Nama promo wajib diisi").optional(),
  discountType: discountTypeSchema.optional(),
  discountValue: z.coerce.number().positive("Nilai diskon harus lebih dari 0").optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  active: z.boolean().optional(),
  productIds: z.array(z.string()).min(1, "Pilih minimal satu produk").optional(),
});

export type ProductDiscount = z.infer<typeof productDiscountSchema>;
export type ProductDiscountInput = z.infer<typeof productDiscountCreateSchema>;
export type ProductDiscountUpdateInput = z.infer<typeof productDiscountUpdateSchema>;