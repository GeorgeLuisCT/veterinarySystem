import { z } from "zod";

export const categorySchema = z.object({
  name: z
    .string()
    .min(1, { message: "El nombre no puede estar vacío" })
    .max(50, { message: "El nombre no debe exceder los 50 caracteres" })
    .regex(/^[^§¶¤¬]+$/, { message: "El nombre no puede contener caracteres especiales como '§', '¶', '¤', '¬'" }),
});

export type CategoryProductRequest = z.infer<typeof categorySchema>;