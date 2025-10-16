import { z } from "zod";
import { CashBoxAuditPaymentMethodRequestSchema } from "./cash-box-audit-payment-method-request";

export const CashBoxAuditRequestSchema = z.object({
  cashBoxId: z
    .number({ invalid_type_error: "El ID de la caja es obligatorio" })
    .int()
    .min(1, "El ID de la caja es obligatorio"),

  isFinal: z
    .boolean({ invalid_type_error: "Debe especificarse si es final" }),

  observations: z.string().optional(),

  paymentMethodAudits: z
    .array(CashBoxAuditPaymentMethodRequestSchema)
    .min(1, "Debe registrar al menos un método de pago"),
});

export type CashBoxAuditRequest = z.infer<typeof CashBoxAuditRequestSchema>;
