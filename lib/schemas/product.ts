import { z } from "zod";

export const optionSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Nama pilihan wajib diisi"),
  additionalPrice: z.number().min(0, "Harga tidak boleh negatif"),
});

export const optionGroupSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Nama grup wajib diisi"),
  multiple: z.boolean(),
  options: z.array(optionSchema).min(1, "Minimal satu pilihan"),
});

export const productSchema = z
  .object({
    id: z.string(),
    name: z.string().min(1, "Nama produk wajib diisi"),
    description: z.string(),
    image: z.string().optional(),
    emoji: z.string().optional(),
    categoryId: z.string().min(1, "Pilih kategori"),
    dineInAvailable: z.boolean(),
    takeawayAvailable: z.boolean(),
    dineInPrice: z.number().min(0, "Harga harus lebih dari 0"),
    takeawayPrice: z.number().min(0, "Harga harus lebih dari 0"),
    active: z.boolean(),
    trackStock: z.boolean(),
    stock: z.number().int().min(0, "Stok tidak boleh negatif"),
    lowStockThreshold: z.number().int().min(0, "Ambang stok minimal 0"),
    optionGroups: z.array(optionGroupSchema),
  })
  .refine((data) => data.dineInAvailable || data.takeawayAvailable, {
    message: "Minimal satu tipe order aktif",
    path: ["dineInAvailable"],
  });

export type Option = z.infer<typeof optionSchema>;
export type OptionGroup = z.infer<typeof optionGroupSchema>;
export type Product = z.infer<typeof productSchema>;
export type ProductInput = z.infer<typeof productSchema>;
