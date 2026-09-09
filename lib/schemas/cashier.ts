import { z } from "zod";

export const cashierSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
  active: z.boolean(),
});

export const cashierCreateSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
});

export type Cashier = z.infer<typeof cashierSchema>;
export type CashierInput = z.infer<typeof cashierCreateSchema>;
