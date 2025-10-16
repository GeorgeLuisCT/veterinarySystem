import { z } from "zod";

export const paymentMethodRequestSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre no puede estar vacío")
    .max(100, "El nombre no debe superar los 100 caracteres")
    .regex(/^[^§¶¤¬]+$/, {
      message: "El nombre no puede contener caracteres especiales como '§', '¶', '¤', '¬'",
    }),
  description: z.string().max(255, "La descripción no debe superar los 255 caracteres").optional(),
  percentageExtra: z
    .number()
    .min(0, "El porcentaje extra debe ser mayor o igual a 0")
    .max(100, "El porcentaje extra no puede superar el 100%")
    .optional(),
  percentageDiscount: z
    .number()
    .min(0, "El porcentaje de descuento debe ser mayor o igual a 0")
    .max(100, "El porcentaje de descuento no puede superar el 100%")
    .optional(),
  isActive: z.boolean().optional(),
});

export type PaymentMethodRequest = z.infer<typeof paymentMethodRequestSchema>;
