import { z } from "zod";
import { ClinicalServiceCategory } from "../enums/clinical-service-category";
import { branchActivationInputSchema } from "../../branche/types/branch-activation-input";
import { TimeUnit } from "@/enums/time-unit";

const clinicalServiceBaseSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio.").max(255, "El nombre no puede exceder los 255 caracteres."),
  description: z
    .string()
    .max(500, "La descripción no puede exceder los 500 caracteres.")
    .optional()
    .transform((val) => (val?.trim() ? val : undefined)),
  clinicalServiceCategory: z.nativeEnum(ClinicalServiceCategory, {
    required_error: "Debe seleccionar una categoría.",
  }),
  price: z.preprocess(
    (val) => (String(val).trim() === "" ? undefined : Number(val)),
    z.number({ required_error: "El precio es obligatorio." })
      .min(0, "El precio no puede ser negativo.")
  ),
  reminderPeriod: z.preprocess(
    (val) => (String(val).trim() === "" ? undefined : Number(val)),
    z.number({ invalid_type_error: "Debe ser un número." })
      .min(0, "El periodo no puede ser negativo.")
      .int("El periodo debe ser un número entero.")
      .optional()
      .nullable()
  ),
  reminderPeriodUnit: z.nativeEnum(TimeUnit).optional().nullable(),
  requiredSampleTypes: z
    .array(
      z
        .string()
        .trim()
        .min(1, "El material es obligatorio.")
        .max(255, "El material no puede exceder los 255 caracteres.")
    )
    .optional()
    .transform((arr) => arr ?? []),
  requiredProductIds: z
    .array(
      z
        .number({ required_error: "Debe seleccionar un producto válido.", invalid_type_error: "Debe seleccionar un producto válido." })
        .int("El producto seleccionado no es válido.")
        .min(1, "El producto seleccionado no es válido.")
    )
    .optional()
    .transform((arr) => arr ?? []),
  branches: z.array(branchActivationInputSchema).optional(),
}).superRefine((data, ctx) => {
  if (data.reminderPeriod && !data.reminderPeriodUnit) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Si define un período, debe seleccionar una unidad (días, semanas, meses).",
      path: ["reminderPeriodUnit"],
    });
  }
  if (!data.reminderPeriod && data.reminderPeriodUnit) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Si selecciona una unidad, debe definir el valor del período.",
      path: ["reminderPeriod"],
    });
  }
});

export const createClinicalServiceSchema = clinicalServiceBaseSchema;
export const updateClinicalServiceSchema = clinicalServiceBaseSchema;

export type CreateClinicalServiceRequest = z.infer<typeof createClinicalServiceSchema>;
export type UpdateClinicalServiceRequest = z.infer<typeof updateClinicalServiceSchema>;
