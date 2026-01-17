import { z } from "zod";
import { TreasuryAccountType } from "../_enums/accounts-enums";

export const treasuryAccountSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio"),
  type: z.nativeEnum(TreasuryAccountType, { required_error: "Selecciona un tipo" }),
  description: z.string().trim().optional(),
});

export type TreasuryAccountFormValues = z.infer<typeof treasuryAccountSchema>;
