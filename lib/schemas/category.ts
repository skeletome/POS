import { z } from "zod";

export const categorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Nama kategori wajib diisi"),
  active: z.boolean(),
});

export const categoryCreateSchema = z.object({
  name: z.string().min(1, "Nama kategori wajib diisi"),
});

export type Category = z.infer<typeof categorySchema>;
export type CategoryInput = z.infer<typeof categoryCreateSchema>;
