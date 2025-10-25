import { z } from "zod";
import { TimeUnit } from "@/enums/time-unit";
import { FrequencyUnit } from "../enums/frequency-unit";
import { ProductUnitType } from "@/app/dashboard/inventory/_enums/product-unit-type";

/**
 * Helper: convierte string/number/vacío → number requerido
 * Luego, si quieres .gt() o .int(), úsalo con .pipe(z.number().gt(...)) o .pipe(z.number().int(...))
 */
const numberFromInput = (message: string) =>
  z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      // soporta coma decimal
      return typeof val === "number" ? val : String(val).replace(",", ".");
    },
    z.coerce
      .number({
        required_error: message,
        invalid_type_error: message,
      })
      .refine((v) => Number.isFinite(v), { message })
  );

/** Entero: usa .pipe() para aplicar .int() sobre un ZodNumber */
const integerFromInput = (message: string) =>
  numberFromInput(message).pipe(
    z.number().int("Debe ser un número entero.")
  );

/** productId: similar a tu preprocess, sin cambios críticos */
const productIdSchema = z.preprocess(
  (val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    const num = typeof val === "number" ? val : Number(val);
    return Number.isNaN(num) ? val : num;
  },
  z
    .number({ invalid_type_error: "Debe seleccionar un producto válido." })
    .int("Debe seleccionar un producto válido.")
    .min(1, "Debe seleccionar un producto válido.")
    .optional()
);

/**
 * Evita `.optional().transform(...)` para strings:
 * usa `preprocess` que convierte "" a undefined ANTES del esquema string opcional.
 */
const optionalTrimmedString = (max: number, maxMsg: string) =>
  z.preprocess(
    (val) => {
      if (typeof val !== "string") return val;
      const t = val.trim();
      return t.length === 0 ? undefined : t;
    },
    z.string().max(max, maxMsg).optional()
  );

export const prescriptionTemplateMedicationSchema = z
  .object({
    productId: productIdSchema,
    customMedicationName: optionalTrimmedString(
      255,
      "El nombre personalizado no puede exceder los 255 caracteres."
    ),
    // number requerido + regla .gt usando .pipe
    dosageAmount: numberFromInput("La dosis es obligatoria.").pipe(
      z.number().gt(0, "La dosis debe ser mayor a cero.")
    ),
    dosageUnit: z
      .nativeEnum(ProductUnitType, {
        invalid_type_error: "Debe seleccionar una unidad de dosificación válida.",
      })
      .optional(),
    frequencyValue: integerFromInput("La frecuencia es obligatoria.").pipe(
      z.number().min(1, "La frecuencia debe ser mayor o igual a 1.")
    ),
    frequencyUnit: z.nativeEnum(FrequencyUnit, {
      required_error: "La unidad de frecuencia es obligatoria.",
      invalid_type_error: "La unidad de frecuencia es obligatoria.",
    }),
    durationValue: integerFromInput("La duración es obligatoria.").pipe(
      z.number().min(1, "La duración debe ser mayor o igual a 1.")
    ),
    durationUnit: z.nativeEnum(TimeUnit, {
      required_error: "La unidad de duración es obligatoria.",
      invalid_type_error: "La unidad de duración es obligatoria.",
    }),
    instructions: optionalTrimmedString(
      1000,
      "Las instrucciones no pueden exceder los 1000 caracteres."
    ),
  })
  .superRefine((data, ctx) => {
    const hasProduct = data.productId !== undefined && data.productId !== null;
    const hasCustom = !!data.customMedicationName;

    if (!hasProduct && !hasCustom) {
      const msg =
        "Cada medicamento debe tener un producto del inventario o un nombre personalizado.";
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: msg, path: ["customMedicationName"] });
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: msg, path: ["productId"] });
    }

    if (hasProduct && !data.dosageUnit) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cuando se seleccione un producto, la unidad de dosificación es obligatoria.",
        path: ["dosageUnit"],
      });
    }
  });

/** notes: usa el mismo patrón seguro (sin transform sobre optional) */
const notesSchema = z.preprocess(
  (val) => {
    if (typeof val !== "string") return val;
    const t = val.trim();
    return t.length === 0 ? undefined : t;
  },
  z
    .string()
    .max(2000, "Las notas no pueden exceder los 2000 caracteres.")
    .optional()
);

export const createPrescriptionTemplateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "El nombre es obligatorio.")
      .max(255, "El nombre no puede exceder los 255 caracteres."),
    purpose: z
      .string()
      .trim()
      .min(1, "El propósito es obligatorio.")
      .max(255, "El propósito no puede exceder los 255 caracteres."),
    notes: notesSchema,
    medications: z
      .array(prescriptionTemplateMedicationSchema, {
        invalid_type_error: "Debe agregar al menos un medicamento.",
      })
      .min(1, "Debe agregar al menos un medicamento."),
  })
  .superRefine((data, ctx) => {
    if (!data.medications || data.medications.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debe registrar al menos un medicamento.",
        path: ["medications"],
      });
    }
  });

export const updatePrescriptionTemplateSchema = createPrescriptionTemplateSchema;

export type CreatePrescriptionTemplateRequest = z.infer<typeof createPrescriptionTemplateSchema>;
export type UpdatePrescriptionTemplateRequest = z.infer<typeof updatePrescriptionTemplateSchema>;
export type PrescriptionTemplateMedicationRequest = z.infer<typeof prescriptionTemplateMedicationSchema>;
export type CreatePrescriptionTemplateFormValues = z.input<typeof createPrescriptionTemplateSchema>;
export type UpdatePrescriptionTemplateFormValues = z.input<typeof updatePrescriptionTemplateSchema>;
