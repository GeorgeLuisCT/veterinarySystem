import { z } from "zod";

export const baseCustomerSchema = z.object({
  name: z.string()
    .min(1, { message: "El nombre no puede estar vacío" })
    .max(100, { message: "El nombre no debe exceder los 100 caracteres" }),

  documentTypeId: z.number({ required_error: "El tipo de documento es obligatorio" })
    .min(1, { message: "Debes seleccionar un tipo de documento" }),

  documentNumber: z.string()
    .min(1, { message: "El número de documento no puede estar vacío" })
    .max(50, { message: "El número de documento no debe exceder los 50 caracteres" }),

  phoneNumber: z.string()
    .max(50, { message: "El número de teléfono no debe exceder los 50 caracteres" })
    .optional()
    .or(z.literal("")),

  email: z.string()
    .email({ message: "El correo electrónico debe ser válido" })
    .max(100, { message: "El correo electrónico no debe exceder los 100 caracteres" })
    .optional()
    .or(z.literal("")),

  address: z.string()
    .max(200, { message: "La dirección no debe exceder los 200 caracteres" })
    .optional()
    .or(z.literal("")),
});

export const customerCreateSchema = baseCustomerSchema;

export const customerUpdateSchema = baseCustomerSchema.extend({
  id: z.number({
    required_error: "El ID del cliente es obligatorio",
  }).min(1),
});

export type CustomerCreateRequest = z.infer<typeof customerCreateSchema>;
export type CustomerUpdateRequest = z.infer<typeof customerUpdateSchema>;
export type CustomerRequest = z.infer<typeof baseCustomerSchema> & { id?: number };
