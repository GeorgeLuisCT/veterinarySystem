import { z } from "zod";
import { ProductUnitType } from "@/app/dashboard/inventory/_enums/product-unit-type";
import { GroomingStatus } from "../enums/grooming-status";

export interface GroomingSessionListParams {
  page?: number;
  size?: number;
  statuses?: GroomingStatus[];
  branchId?: number;
  animalId?: number;
  attentionId?: number;
  assignedProfessionalId?: number;
  startDate?: string;
  endDate?: string;
}

const nullableString = z
  .string()
  .transform((value) => value.trim())
  .optional()
  .nullable();

const nullableNumber = z.preprocess(
  (value) => (value === "" || value === undefined ? undefined : Number(value)),
  z.number({ invalid_type_error: "El valor debe ser un número." }).optional().nullable()
);

const nullableInt = z.preprocess(
  (value) => (value === "" || value === undefined ? undefined : Number(value)),
  z.number({ invalid_type_error: "El valor debe ser un número." }).int().optional().nullable()
);

export const createGroomingSessionSchema = z.object({
  attentionId: z
    .number({ required_error: "Debes seleccionar una atención." })
    .int()
    .min(1, "Debes seleccionar una atención."),
  startedAt: z.string({ required_error: "La hora de inicio es obligatoria." }).min(1, "La hora de inicio es obligatoria."),
  finishedAt: z.string().optional().nullable(),
  assignedProfessionalId: nullableInt,
  chargedPrice: nullableNumber,
  behaviorNotes: nullableString,
  clinicalObservations: nullableString,
  status: z
    .nativeEnum(GroomingStatus, { errorMap: () => ({ message: "Estado inválido." }) })
    .optional()
    .nullable(),
});

export type CreateGroomingSessionRequest = z.infer<typeof createGroomingSessionSchema>;

export const updateGroomingSessionSchema = z.object({
  version: z
    .number({ required_error: "La versión es obligatoria." })
    .int("La versión debe ser un número entero.")
    .min(0, "La versión no puede ser negativa."),
  status: z.nativeEnum(GroomingStatus).optional().nullable(),
  startedAt: z.string().optional().nullable(),
  finishedAt: z.string().optional().nullable(),
  assignedProfessionalId: nullableInt,
  chargedPrice: nullableNumber,
  behaviorNotes: nullableString,
  clinicalObservations: nullableString,
});

export type UpdateGroomingSessionRequest = z.infer<typeof updateGroomingSessionSchema>;

export const addGroomingMaterialSchema = z
  .object({
    productId: nullableInt,
    unregisteredProductName: nullableString,
    quantity: z.preprocess(
      (value) => (value === "" || value === undefined ? undefined : Number(value)),
      z
        .number({ required_error: "La cantidad es obligatoria." })
        .positive("La cantidad debe ser mayor a 0.")
    ),
    unitType: z.nativeEnum(ProductUnitType, { errorMap: () => ({ message: "Unidad inválida." }) }),
    unitPrice: nullableNumber,
  })
  .superRefine((data, ctx) => {
    const hasProduct = data.productId !== null && data.productId !== undefined;
    const hasName = !!(data.unregisteredProductName && data.unregisteredProductName.trim() !== "");
    if (hasProduct === hasName) {
      ctx.addIssue({ path: ["productId"], code: z.ZodIssueCode.custom, message: "Indica producto registrado o no registrado, pero no ambos." });
      ctx.addIssue({ path: ["unregisteredProductName"], code: z.ZodIssueCode.custom, message: "Indica producto registrado o no registrado, pero no ambos." });
    }
  });

export type AddGroomingMaterialRequest = z.infer<typeof addGroomingMaterialSchema>;
