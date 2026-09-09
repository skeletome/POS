import { z } from "zod";

export const taxSettingsSchema = z.object({
  enabled: z.boolean(),
  dineInRate: z.number().min(0).max(1),
  takeawayRate: z.number().min(0).max(1),
});

export type TaxSettings = z.infer<typeof taxSettingsSchema>;
export type TaxSettingsInput = z.infer<typeof taxSettingsSchema>;
