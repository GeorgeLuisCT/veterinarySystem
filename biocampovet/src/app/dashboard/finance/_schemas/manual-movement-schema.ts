import { z } from "zod";

export const manualMovementSchema = z.object({
  amount: z
    .number({ required_error: "Ingresa un monto" })
    .positive("El monto debe ser mayor a cero"),
  description: z.string().trim().optional(),
  income: z.boolean().default(true),
});

export type ManualMovementFormValues = z.infer<typeof manualMovementSchema>;
