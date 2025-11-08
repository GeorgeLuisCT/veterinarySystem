import { z } from "zod";

export const registerPaymentSchema = z.object({
  amount: z
    .number({ required_error: "Ingresa el monto" })
    .positive("El monto debe ser mayor a cero"),
  treasuryAccountId: z.number({ required_error: "Selecciona una cuenta" }),
  paymentDate: z.string().optional(),
  notes: z.string().trim().optional(),
});

export type RegisterPaymentFormValues = z.infer<typeof registerPaymentSchema>;
