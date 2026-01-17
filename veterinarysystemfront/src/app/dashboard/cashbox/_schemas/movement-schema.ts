import { z } from "zod";
import { CashMovementType } from "../_types/cash-session-enums";

export const movementSchema = z.object({
  movementType: z.nativeEnum(CashMovementType, {
    errorMap: () => ({ message: "Debe seleccionar un tipo de movimiento." }),
  }),
  amount: z
    .number({
      invalid_type_error: "El monto debe ser un número.",
    })
    .positive({
      message: "El monto debe ser mayor a 0.",
    }),
  reason: z.string().min(3, {
    message: "El motivo debe tener al menos 3 caracteres.",
  }),
  reference: z.string().optional(),
});

export type MovementFormValues = z.infer<typeof movementSchema>;