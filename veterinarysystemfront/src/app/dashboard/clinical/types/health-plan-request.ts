import { z } from "zod";

/** number: soporta "", null, undefined y coma decimal; luego encadena reglas con .pipe(...) */
const numberFromInput = (message: string) =>
  z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      return typeof val === "number" ? val : String(val).replace(",", ".");
    },
    z.coerce
      .number({
        required_error: message,
        invalid_type_error: message,
      })
      .refine((v) => Number.isFinite(v), { message })
  );

/** integer: aplica .int() con .pipe(...) */
const integerFromInput = (message: string) =>
  numberFromInput(message).pipe(
    z.number().int("Debe ser un número entero.")
  );

/** string opcional con trim; "" → undefined sin usar .optional().transform(...) */
const optionalTrimmedString = (max: number, msg: string) =>
  z.preprocess(
    (val) => {
      if (typeof val !== "string") return val;
      const t = val.trim();
      return t.length === 0 ? undefined : t;
    },
    z.string().max(max, msg).optional()
  );

export const healthPlanServiceItemSchema = z.object({
  clinicalServiceId: integerFromInput("Debes seleccionar un servicio clínico.").pipe(
    z.number().min(1, "Debes seleccionar un servicio clínico.")
  ),
  quantity: integerFromInput("La cantidad es obligatoria.").pipe(
    z.number().min(1, "La cantidad debe ser mayor o igual a 1.")
  ),
  notes: optionalTrimmedString(1000, "Las notas no pueden exceder los 1000 caracteres."),
});

export const createHealthPlanSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "El nombre es obligatorio.")
      .max(255, "El nombre no puede exceder los 255 caracteres."),
    description: optionalTrimmedString(500, "La descripción no puede exceder los 500 caracteres."),
    price: numberFromInput("El precio es obligatorio.").pipe(
      z.number().gt(0, "El precio debe ser mayor a cero.")
    ),
    notes: optionalTrimmedString(1000, "Las notas no pueden exceder los 1000 caracteres."),
    serviceItems: z
      .array(healthPlanServiceItemSchema, {
        required_error: "Debes agregar al menos un servicio clínico.",
      })
      .min(1, "Debes agregar al menos un servicio clínico."),
  })
  .superRefine((data, ctx) => {
    if (!data.serviceItems || data.serviceItems.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debes agregar al menos un servicio clínico.",
        path: ["serviceItems"],
      });
      return;
    }

    const seen = new Set<number>();
    data.serviceItems.forEach((item, index) => {
      if (item?.clinicalServiceId === undefined || item?.clinicalServiceId === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Debes seleccionar un servicio clínico.",
          path: ["serviceItems", index, "clinicalServiceId"],
        });
        return;
      }

      if (seen.has(item.clinicalServiceId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Cada servicio clínico solo puede agregarse una vez.",
          path: ["serviceItems", index, "clinicalServiceId"],
        });
      } else {
        seen.add(item.clinicalServiceId);
      }
    });
  });

export const updateHealthPlanSchema = createHealthPlanSchema;

export type CreateHealthPlanRequest = z.infer<typeof createHealthPlanSchema>;
export type UpdateHealthPlanRequest = z.infer<typeof updateHealthPlanSchema>;
export type HealthPlanServiceItemRequest = z.infer<typeof healthPlanServiceItemSchema>;
export type CreateHealthPlanFormValues = z.input<typeof createHealthPlanSchema>;
export type UpdateHealthPlanFormValues = z.input<typeof updateHealthPlanSchema>;
