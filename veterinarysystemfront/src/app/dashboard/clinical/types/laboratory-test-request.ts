import * as z from "zod";
import { LabValueType } from "../enums/lab-value-type";
import { LabUnit } from "../enums/lab-unit";

export const laboratoryTestParameterSchema = z.object({
    id: z.number().optional(),
    name: z
      .string()
      .min(1, "El nombre del parámetro es requerido.")
      .max(80, "El nombre no puede exceder los 80 caracteres."),
    valueType: z.nativeEnum(LabValueType, { required_error: "El tipo de valor es requerido." }),
    unit: z.nativeEnum(LabUnit, { required_error: "La unidad es obligatoria." }),
    allowedOptions: z.string().max(400, "Las opciones no pueden exceder los 400 caracteres.").optional(),
    refMin: z.number().optional().nullable(),
    refMax: z.number().optional().nullable(),
    refText: z.string().max(200, "El texto de referencia no puede exceder los 200 caracteres.").optional(),
    decimals: z.number().int("Debe ser un número entero.").optional().nullable(),
  });

export const laboratoryActivationSchema = z.object({
    laboratoryId: z.number(),
    active: z.boolean(),
});

const laboratoryTestBaseSchema = z.object({
    code: z.string().min(1, "El código es requerido.").max(40, "El código no puede exceder los 40 caracteres."),
    name: z.string().min(1, "El nombre es requerido.").max(200, "El nombre no puede exceder los 200 caracteres."),
    description: z
        .string()
        .max(1000, "La descripción no puede exceder los 1000 caracteres.")
        .optional()
        .transform((val) => (val?.trim() ? val : undefined)),
    price: z.preprocess(
        (val) => (String(val).trim() === "" ? undefined : Number(val)),
        z.number({ required_error: "El precio es obligatorio." })
          .min(0, "El precio no puede ser negativo.")
    ),
    active: z.boolean(),
    parameters: z.array(laboratoryTestParameterSchema).optional().transform((arr) => arr ?? []),
    laboratories: z.array(laboratoryActivationSchema).optional(),
});

export const createLaboratoryTestSchema = laboratoryTestBaseSchema;
export const updateLaboratoryTestSchema = laboratoryTestBaseSchema;

export type CreateLaboratoryTestRequest = z.infer<typeof createLaboratoryTestSchema>;
export type UpdateLaboratoryTestRequest = z.infer<typeof updateLaboratoryTestSchema>;
export type LaboratoryTestParameterRequest = z.infer<typeof laboratoryTestParameterSchema>;
export type LaboratoryActivationInput = z.infer<typeof laboratoryActivationSchema>;