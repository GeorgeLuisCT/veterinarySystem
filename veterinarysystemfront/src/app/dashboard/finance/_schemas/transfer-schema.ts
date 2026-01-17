import { z } from "zod";

export const transferSchema = z
  .object({
    sourceAccountId: z.number({ required_error: "Selecciona la cuenta origen" }),
    targetAccountId: z.number({ required_error: "Selecciona la cuenta destino" }),
    amount: z
      .number({ required_error: "Ingresa el monto" })
      .positive("El monto debe ser mayor a cero"),
    description: z.string().trim().optional(),
    occurredAt: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.sourceAccountId === data.targetAccountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Las cuentas deben ser diferentes",
        path: ["targetAccountId"],
      });
    }
  });

export type TransferFormValues = z.infer<typeof transferSchema>;
