import { z } from "zod";

export const expenseSchema = z.object({
  treasuryAccountId: z.number({ required_error: "Selecciona una cuenta" }),
  description: z.string().trim().min(1, "La descripción es obligatoria"),
  amount: z
    .number({ required_error: "Ingresa el monto" })
    .positive("El monto debe ser mayor a cero"),
  occurredAt: z.string().optional(),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;
