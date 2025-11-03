import { z } from "zod";
import { CashMovementType } from "../_types/cash-session-enums";

export const movementSchema = z.object({
  movementType: z.nativeEnum(CashMovementType),
  amount: z.number().positive(),
  reason: z.string().min(3),
  reference: z.string().optional(),
});

export type MovementFormValues = z.infer<typeof movementSchema>;
