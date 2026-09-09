import { z } from "zod";

export const bankSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Nama bank wajib diisi"),
  active: z.boolean(),
  logo: z.string().optional(),
});

export const bankCreateSchema = z.object({
  name: z.string().min(1, "Nama bank wajib diisi"),
});

export type Bank = z.infer<typeof bankSchema>;
export type BankInput = z.infer<typeof bankCreateSchema>;
