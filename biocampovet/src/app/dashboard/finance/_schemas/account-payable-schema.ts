import { z } from "zod";

export const accountPayableSchema = z.object({
  supplierId: z.number().optional(),
  description: z.string().trim().min(1, "La descripción es obligatoria"),
  issueDate: z.string().min(1, "La fecha es obligatoria"),
  totalAmount: z
    .number({ required_error: "El total es obligatorio" })
    .positive("El total debe ser mayor a cero"),
});

export type AccountPayableFormValues = z.infer<typeof accountPayableSchema>;
