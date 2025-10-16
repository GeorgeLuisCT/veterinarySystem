import { z } from "zod";

export const branchActivationInputSchema = z.object({
  branchId: z.number({ required_error: "El ID de la sucursal es obligatorio." }).min(1, "El ID de la sucursal no es válido."),
  active: z.boolean({ required_error: "Debe indicar si la sucursal está activa." }),
});

export type BranchActivationInput = z.infer<typeof branchActivationInputSchema>;
