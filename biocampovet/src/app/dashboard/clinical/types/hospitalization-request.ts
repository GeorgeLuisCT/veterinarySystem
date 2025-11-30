import { z } from "zod";
import { HospitalizationStatus } from "../enums/hospitalization-status";
import { AdmissionTiming } from "../enums/admission-timing";
import { HospitalizationCause } from "../enums/hospitalization-cause";

export interface HospitalizationListParams {
  branchId?: number;
  animalId?: number;
  cageId?: number;
  statuses?: HospitalizationStatus[];
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export const createHospitalizationSchema = z.object({
  animalId: z.number({
    required_error: "Falta el paciente.",
    invalid_type_error: "ID de paciente inválido.",
  }).int("El ID de paciente debe ser entero.").min(1, "Paciente inválido."),

  cageId: z.number({
    required_error: "Selecciona una jaula.",
    invalid_type_error: "ID de jaula inválido.",
  }).int("El ID de jaula debe ser entero.").min(1, "Debes elegir una jaula."),

  attentionId: z.number({
    invalid_type_error: "ID de atención inválido.",
  }).int("El ID de atención debe ser entero.").min(1, "Atención inválida.").optional().nullable(),

  admissionTiming: z.nativeEnum(AdmissionTiming, {
    required_error: "Selecciona el momento de admisión.",
    invalid_type_error: "Momento de admisión inválido.",
  }),

  cause: z.nativeEnum(HospitalizationCause, {
    invalid_type_error: "Causa inválida.",
  }).optional().nullable(),

  clinicalServiceId: z.number({
    invalid_type_error: "ID de servicio inválido.",
  }).int("El ID de servicio debe ser entero.").min(1, "Servicio inválido.").optional().nullable(),

  admissionNotes: z.string({
    required_error: "Agrega notas de admisión.",
    invalid_type_error: "Notas inválidas.",
  }).min(1, "Las notas de admisión son obligatorias."),
});

export type CreateHospitalizationRequest = z.infer<typeof createHospitalizationSchema>;

export const updateHospitalizationSchema = z.object({
  version: z.number().int().min(0),
  dischargeDate: z.string().datetime().optional().nullable(),
  admissionNotes: z.string().optional().nullable(),
  status: z.nativeEnum(HospitalizationStatus).optional().nullable(),
  cause: z.nativeEnum(HospitalizationCause).optional().nullable(),
  clinicalServiceId: z.number().int().min(1).optional().nullable(),
});

export type UpdateHospitalizationRequest = z.infer<typeof updateHospitalizationSchema>;

export const addEvolutionNoteSchema = z.object({
  authorId: z.number().int().min(1),
  note: z.string().min(1),
});

export type AddEvolutionNoteRequest = z.infer<typeof addEvolutionNoteSchema>;

import { ProductUnitType } from "@/app/dashboard/inventory/_enums/product-unit-type";

export const updateTreatmentScheduleSchema = z.object({
  isCompleted: z.boolean(),
  completedByEmployeeId: z.number().int().min(1).optional().nullable(),
  notes: z.string().optional().nullable(),
  productId: z.number().int().min(1).optional().nullable(),
  quantity: z.number().min(0).optional().nullable(),
  unit: z.nativeEnum(ProductUnitType).optional().nullable(),
});

export type UpdateTreatmentScheduleRequest = z.infer<typeof updateTreatmentScheduleSchema>;

import { FrequencyUnit } from "../enums/frequency-unit";

export const createTreatmentScheduleSchema = z.object({
  treatmentName: z.string().min(1, "El nombre del tratamiento es obligatorio."),
  scheduledTime: z.string().datetime({ message: "Fecha y hora inválidas." }),
  notes: z.string().optional().nullable(),
  frequencyValue: z.number().int().min(1).optional().nullable(),
  frequencyUnit: z.nativeEnum(FrequencyUnit).optional().nullable(),
  numberOfDoses: z.number().int().min(1).optional().nullable(),
});

export type CreateTreatmentScheduleRequest = z.infer<typeof createTreatmentScheduleSchema>;
