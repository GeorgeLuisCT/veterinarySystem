import { z } from "zod";
import { saleProductRequestSchema } from "./sale-product-request";
import { salePaymentSchema } from "./sale-payment-request";

export const saleRequestSchema = z.object({
  customerId: z.number().optional(),
  saleProducts: z.array(saleProductRequestSchema).optional(),
  salePayments: salePaymentSchema.optional(),
  status: z.string({ required_error: "El estado del procedimiento es obligatorio" }),
});

export type SaleRequest = z.infer<typeof saleRequestSchema>;
