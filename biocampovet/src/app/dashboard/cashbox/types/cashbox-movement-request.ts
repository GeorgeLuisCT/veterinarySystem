import { z } from "zod";
import { CashboxMovementType } from "../enums/cashbox-movement-type";
import { CashboxMovementReason } from "../enums/cashbox-movement-reason";

export const CashboxMovementRequestSchema = z.object({
  cashboxId: z.number({
    required_error: "El ID de la caja es obligatorio",
  }),

  type: z.nativeEnum(CashboxMovementType, {
    required_error: "El tipo de movimiento es obligatorio",
  }),

  reason: z.nativeEnum(CashboxMovementReason, {
    required_error: "El motivo del movimiento es obligatorio",
  }),

  paymentMethodId: z.number({
    required_error: "El ID del método de pago es obligatorio",
  }),

  amount: z
    .number({
      required_error: "El monto es obligatorio",
    })
    .min(0.01, "El monto debe ser mayor que cero"),

  description: z.string().optional(),
  documentReference: z.string().optional(),
  operationNumber: z.string().optional(),
  notes: z.string().optional(),
});

export type CashboxMovementRequest = z.infer<typeof CashboxMovementRequestSchema>;
