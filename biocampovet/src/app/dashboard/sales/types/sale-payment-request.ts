import { z } from "zod";

export const salePaymentItemSchema = z.object({
  methodId: z.string().min(1, "Método requerido"),
  amount: z.number().positive("El monto debe ser mayor que 0"),
});

export type SalePaymentItem = z.infer<typeof salePaymentItemSchema>;

export const salePaymentSchema = z.array(salePaymentItemSchema);

export const salePaymentFormSchema = z.object({
  payments: salePaymentSchema,
});

export type SalePaymentFormValues = z.infer<typeof salePaymentFormSchema>;
