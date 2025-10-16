import { z } from "zod";

export const CashBoxAuditPaymentMethodRequestSchema = z.object({
  paymentMethodId: z
    .number({ invalid_type_error: "El método de pago es obligatorio" })
    .int()
    .min(1, "El método de pago es obligatorio"),

  expectedAmount: z
    .number({ invalid_type_error: "El monto esperado es obligatorio" }),

  countedAmount: z
    .number({ invalid_type_error: "El monto contado es obligatorio" }),
});

export type CashBoxAuditPaymentMethodRequest = z.infer<typeof CashBoxAuditPaymentMethodRequestSchema>;
