import { z } from "zod";
import { ProductUnitType } from "../../inventory/products/enums/product-unit-type";
import { SurgicalOrderStatus } from "../../schedule/enums/surgical-order-status";
import { ClinicalAttentionStatus } from "../enums/clinical-attention-status";
import { AdministrationRoute } from "../../inventory/products/enums/administration-route";
import { LabRequestStatus } from "../enums/lab-request-status";
import { FrequencyUnit } from "../enums/frequency-unit";

export interface ClinicalAttentionListParams {
  page?: number;
  size?: number;
  statuses?: ClinicalAttentionStatus[];
  branchId?: number;
  animalId?: number;
  attentionId?: number;
  attendingEmployeeId?: number;
  startDate?: string;
  endDate?: string;
}

export const createClinicalAttentionSchema = z.object({
  attentionId: z
    .number({
      required_error: "Debes seleccionar una atención.",
      invalid_type_error: "La selección de la atención no es válida.",
    })
    .int("La selección de la atención no es válida.")
    .min(1, "Debes seleccionar una atención."),
  visitDate: z
    .string()
    .datetime({ message: "El formato de la fecha de visita es inválido." })
    .optional(),
  status: z
    .nativeEnum(ClinicalAttentionStatus, {
      errorMap: () => ({ message: "El estado seleccionado no es válido." }),
    })
    .optional(),
});

export type CreateClinicalAttentionRequest = z.infer<typeof createClinicalAttentionSchema>;

const nullableStr = z.string().transform((v) => v.trim()).optional().nullable();
const nullableNumber = z.preprocess(
  (val) => (val === "" || val === undefined ? undefined : Number(val)),
  z
    .number({ invalid_type_error: "El valor debe ser un número." })
    .optional()
    .nullable()
);
const nullableInt = z.preprocess(
  (val) => (val === "" || val === undefined ? undefined : Number(val)),
  z
    .number({ invalid_type_error: "El valor debe ser un número." })
    .int("El valor debe ser un número entero.")
    .optional()
    .nullable()
);

export const updateClinicalAttentionSchema = z.object({
  version: z
    .number()
    .int()
    .min(0, "La versión no puede ser un número negativo."),
  visitDate: z
    .string()
    .datetime({ message: "El formato de la fecha de visita es inválido." })
    .optional()
    .nullable(),
  status: z
    .nativeEnum(ClinicalAttentionStatus, {
      errorMap: () => ({ message: "El estado seleccionado no es válido." }),
    })
    .optional()
    .nullable(),
  subjective: nullableStr,
  objective: nullableStr,
  assessment: nullableStr,
  plan: nullableStr,
  weightKg: nullableNumber,
  temperatureCelsius: nullableNumber,
  heartRate: nullableInt,
  respiratoryRate: nullableInt,
});

export type UpdateClinicalAttentionRequest = z.infer<typeof updateClinicalAttentionSchema>;

export const addClinicalAttentionMedicationSchema = z.object({
  productId: z
    .number({
      required_error: "Debes seleccionar un producto.",
      invalid_type_error: "La selección del producto no es válida.",
    })
    .int("La selección del producto no es válida.")
    .min(1, "Debes seleccionar un producto."),
  administeredAt: z
    .string({ required_error: "La fecha y hora de administración es obligatoria." })
    .min(1, { message: "La fecha y hora de administración es obligatoria." }),
  doseAmount: nullableNumber,
  doseUnit: z
    .nativeEnum(ProductUnitType, {
      errorMap: () => ({ message: "La unidad de dosis no es válida." }),
    })
    .optional()
    .nullable(),
  route: z
    .nativeEnum(AdministrationRoute, {
      errorMap: () => ({ message: "La vía de administración no es válida." }),
    })
    .optional()
    .nullable(),
  frequencyValue: z
    .number({ invalid_type_error: "El valor de frecuencia debe ser un número." })
    .int("El valor de frecuencia debe ser un número entero.")
    .optional()
    .nullable(),
  frequencyUnit: z
    .nativeEnum(FrequencyUnit, {
      errorMap: () => ({ message: "La unidad de frecuencia no es válida." }),
    })
    .optional()
    .nullable(),
  administeredByEmployeeId: z
    .number({ invalid_type_error: "La selección del empleado no es válida." })
    .int("La selección del empleado no es válida.")
    .min(1, "Debes seleccionar un empleado.")
    .optional()
    .nullable(),
  notes: nullableStr,
});

export type AddClinicalAttentionMedicationRequest = z.infer<typeof addClinicalAttentionMedicationSchema>;

export const addClinicalAttentionServiceItemSchema = z.object({
  clinicalServiceId: z
    .number({
      required_error: "Debes seleccionar un servicio.",
      invalid_type_error: "La selección del servicio no es válida.",
    })
    .int("La selección del servicio no es válida.")
    .min(1, "Debes seleccionar un servicio."),
  unitPrice: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : Number(val)),
    z.number({
      required_error: "El precio unitario es obligatorio.",
      invalid_type_error: "El precio unitario debe ser un número.",
    })
  ),
  quantity: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : Number(val)),
    z.number({
      required_error: "La cantidad es obligatoria.",
      invalid_type_error: "La cantidad debe ser un número.",
    })
  ),
  notes: nullableStr,
});

export type AddClinicalAttentionServiceItemRequest = z.infer<typeof addClinicalAttentionServiceItemSchema>;

export const addClinicalAttentionSurgicalOrderSchema = z.object({
  recommendedServiceId: z
    .number({
      required_error: "Debes seleccionar un servicio.",
      invalid_type_error: "La selección del servicio no es válida.",
    })
    .int("La selección del servicio no es válida.")
    .min(1, "Debes seleccionar un servicio."),
  requestedByEmployeeId: z
    .number({
      required_error: "Debes seleccionar un solicitante.",
      invalid_type_error: "La selección del solicitante no es válida.",
    })
    .int("La selección del solicitante no es válida.")
    .min(1, "Debes seleccionar un solicitante."),
    operationRoomId: z
    .number({
      invalid_type_error: "La selección de la sala de operaciones no es válida.",
    })
    .int()
    .min(1, { message: "Debes seleccionar una sala de operaciones." })
    .optional(),  
  status: z
    .nativeEnum(SurgicalOrderStatus, {
      errorMap: () => ({ message: "El estado seleccionado no es válido." }),
    })
    .optional()
    .nullable(),
  notes: nullableStr,
});

export type AddClinicalAttentionSurgicalOrderRequest = z.infer<typeof addClinicalAttentionSurgicalOrderSchema>;

export const laboratoryRequestItemSchema = z.object({
  testId: z
    .number({
      required_error: "Debes seleccionar una prueba.",
      invalid_type_error: "La selección de la prueba no es válida.",
    })
    .int("La selección de la prueba no es válida.")
    .min(1, "Debes seleccionar una prueba."),
  unitPrice: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : Number(val)),
    z.number({
      required_error: "El precio unitario es obligatorio.",
      invalid_type_error: "El precio unitario debe ser un número.",
    })
  ),
  quantity: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : Number(val)),
    z.number({
      required_error: "La cantidad es obligatoria.",
      invalid_type_error: "La cantidad debe ser un número.",
    })
  ),
  notes: nullableStr,
});

export const addClinicalAttentionLaboratorySchema = z.object({
  laboratoryId: z
    .number({
      required_error: "Debes seleccionar un laboratorio.",
      invalid_type_error: "La selección del laboratorio no es válida.",
    })
    .int("La selección del laboratorio no es válida.")
    .min(1, "Debes seleccionar un laboratorio."),
  requestingEmployeeId: z
    .number({ invalid_type_error: "La selección del solicitante no es válida." })
    .int("La selección del solicitante no es válida.")
    .min(1, "Debes seleccionar un solicitante.")
    .optional()
    .nullable(),
  status: z
    .nativeEnum(LabRequestStatus, {
      errorMap: () => ({ message: "El estado seleccionado no es válido." }),
    })
    .optional()
    .nullable(),
  createdAt: z
    .string()
    .datetime({ message: "El formato de la fecha de creación es inválido." })
    .optional(),
  clinicalNotes: nullableStr,
  items: z
    .array(laboratoryRequestItemSchema)
    .min(1, "Debe agregar al menos una prueba al pedido de laboratorio."),
});

export type AddClinicalAttentionLaboratoryRequest = z.infer<typeof addClinicalAttentionLaboratorySchema>;