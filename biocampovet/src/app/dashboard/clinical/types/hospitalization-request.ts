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
  animalId: z.number().int().min(1),
  cageId: z.number().int().min(1),
  attentionId: z.number().int().min(1).optional().nullable(),
  admissionTiming: z.nativeEnum(AdmissionTiming),
  cause: z.nativeEnum(HospitalizationCause).optional().nullable(),
  clinicalServiceId: z.number().int().min(1).optional().nullable(),
  admissionNotes: z.string().min(1),
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

export const updateTreatmentScheduleSchema = z.object({
  isCompleted: z.boolean(),
  completedByEmployeeId: z.number().int().min(1).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type UpdateTreatmentScheduleRequest = z.infer<typeof updateTreatmentScheduleSchema>;
