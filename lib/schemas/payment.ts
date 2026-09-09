import { z } from "zod";

export const paymentSettingsSchema = z.object({
  cashEnabled: z.boolean(),
  bankEnabled: z.boolean(),
  qrisEnabled: z.boolean(),
});

export type PaymentSettings = z.infer<typeof paymentSettingsSchema>;
export type PaymentSettingsInput = z.infer<typeof paymentSettingsSchema>;
