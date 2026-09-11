import { z } from "zod";
import { discountTypeSchema } from "./discount";

const optionalNumber = (min: number) =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : v),
    z.coerce.number().min(min).nullable().optional(),
  );

export const voucherSchema = z.object({
  id: z.string(),
  code: z.string(),
  discountType: discountTypeSchema,
  discountValue: z.number().positive("Nilai diskon harus lebih dari 0"),
  minSubtotal: z.number().nullable().optional(),
  maxDiscount: z.number().nullable().optional(),
  usageLimit: z.number().nullable().optional(),
  usedCount: z.number().default(0),
  validFrom: z.string().nullable().optional(),
  validUntil: z.string().nullable().optional(),
  active: z.boolean(),
  createdAt: z.string().optional(),
});

export const voucherCreateSchema = z.object({
  code: z
    .string()
    .min(1, "Kode voucher wajib diisi")
    .transform((v) => v.trim().toUpperCase()),
  discountType: discountTypeSchema,
  discountValue: z.coerce.number().positive("Nilai diskon harus lebih dari 0"),
  minSubtotal: optionalNumber(0),
  maxDiscount: optionalNumber(0),
  usageLimit: optionalNumber(1),
  validFrom: z.string().nullable().optional(),
  validUntil: z.string().nullable().optional(),
  active: z.boolean().default(true),
});

export const voucherUpdateSchema = z.object({
  code: z
    .string()
    .min(1, "Kode voucher wajib diisi")
    .transform((v) => v.trim().toUpperCase())
    .optional(),
  discountType: discountTypeSchema.optional(),
  discountValue: z.coerce.number().positive("Nilai diskon harus lebih dari 0").optional(),
  minSubtotal: optionalNumber(0),
  maxDiscount: optionalNumber(0),
  usageLimit: optionalNumber(1),
  validFrom: z.string().nullable().optional(),
  validUntil: z.string().nullable().optional(),
  active: z.boolean().optional(),
});

export type Voucher = z.infer<typeof voucherSchema>;
export type VoucherInput = z.infer<typeof voucherCreateSchema>;
export type VoucherUpdateInput = z.infer<typeof voucherUpdateSchema>;