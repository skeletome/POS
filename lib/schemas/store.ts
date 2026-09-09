import { z } from "zod";

export const storeSettingsSchema = z.object({
  storeName: z.string().min(1, "Nama toko wajib diisi"),
  information: z.string(),
});

export type StoreSettings = z.infer<typeof storeSettingsSchema>;
export type StoreSettingsInput = z.infer<typeof storeSettingsSchema>;
