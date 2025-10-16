import { z } from "zod";
import { SupplierType } from "../enums/supplier-type";

export const baseSupplierSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(100),
  ruc: z.string().min(1, "El RUC es obligatorio").max(20),
  address: z.string().max(150, "La dirección no debe superar los 150 caracteres").optional(),
  website: z.string().max(100, "El sitio web no debe superar los 100 caracteres").optional(),
  contactPhone: z.string().max(20, "El teléfono no debe superar los 20 caracteres").optional(),
  email: z.string().email("Debe ingresar un correo válido").optional(),
  supplierType: z.nativeEnum(SupplierType, { required_error: "El tipo de proveedor es obligatorio" }),
  bankAccountNumber: z.string().max(30, "El número de cuenta no debe superar los 30 caracteres").optional(),
  bankName: z.string().max(50, "El nombre del banco no debe superar los 50 caracteres").optional(),
});

export const supplierCreateSchema = baseSupplierSchema;

export const supplierUpdateSchema = baseSupplierSchema.extend({
  id: z.number({ required_error: "El ID del proveedor es obligatorio" }),
});

export type SupplierCreateRequest = z.infer<typeof supplierCreateSchema>;
export type SupplierUpdateRequest = z.infer<typeof supplierUpdateSchema>;

export type SupplierRequest = z.infer<typeof baseSupplierSchema> & {
  id?: number;
};
