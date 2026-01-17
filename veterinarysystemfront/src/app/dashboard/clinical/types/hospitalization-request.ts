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

const treatmentProductUsageSchema = z.object({
  productId: z
    .number({ required_error: "Selecciona un producto." })
    .int("ID de producto inválido.")
    .min(1, "Producto inválido."),
  quantity: z
    .number({ invalid_type_error: "Ingresa una cantidad." })
    .positive("La cantidad debe ser mayor que cero."),
  unit: z.nativeEnum(ProductUnitType, { required_error: "Selecciona la unidad." }),
});

export type TreatmentScheduleProductUsageInput = z.infer<typeof treatmentProductUsageSchema>;

export const updateTreatmentScheduleSchema = z.object({
  isCompleted: z.boolean(),
  completedByEmployeeId: z.number().int().min(1).optional().nullable(),
  notes: z.string().optional().nullable(),
  products: z.array(treatmentProductUsageSchema).min(1, "Registra al menos un producto utilizado."),
});

export type UpdateTreatmentScheduleRequest = z.infer<typeof updateTreatmentScheduleSchema>;

import { FrequencyUnit } from "../enums/frequency-unit";

export const createHospitalizationVitalSignSchema = z
  .object({
    recordedByEmployeeId: z.number().int().min(1),
    recordedAt: z.string().datetime().optional(),
    weightKg: z.number().positive().optional(),
    temperatureCelsius: z.number().positive().optional(),
    heartRate: z.number().int().positive().optional(),
    respiratoryRate: z.number().int().positive().optional(),
  })
  .refine(
    (data) =>
      data.weightKg != null ||
      data.temperatureCelsius != null ||
      data.heartRate != null ||
      data.respiratoryRate != null,
    {
      message: "Registra al menos una constante vital.",
      path: ["weightKg"],
    }
  );

export type CreateHospitalizationVitalSignRequest = z.infer<typeof createHospitalizationVitalSignSchema>;

export const createTreatmentScheduleSchema = z
  .object({
    treatmentName: z.string().min(1, "La descripción del tratamiento es obligatoria."),
    scheduledTime: z.string().datetime({ message: "Fecha y hora inválidas." }),
    notes: z.string().optional().nullable(),
    frequencyValue: z.number().int().min(1).optional().nullable(),
    frequencyUnit: z.nativeEnum(FrequencyUnit).optional().nullable(),
    numberOfDoses: z.number().int().min(1).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const hasFrequencyValue = data.frequencyValue != null;
    const hasFrequencyUnit = data.frequencyUnit != null;
    if (hasFrequencyValue !== hasFrequencyUnit) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Completa el valor y la unidad de la frecuencia.",
        path: hasFrequencyValue ? ["frequencyUnit"] : ["frequencyValue"],
      });
    }
    if (hasFrequencyValue && hasFrequencyUnit) {
      if (data.numberOfDoses == null || data.numberOfDoses < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Indica cuántas dosis se programarán (mínimo 2).",
          path: ["numberOfDoses"],
        });
      }
    } else if (data.numberOfDoses && data.numberOfDoses > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Para múltiples dosis debes definir la frecuencia.",
        path: ["frequencyValue"],
      });
    }
  });

export type CreateTreatmentScheduleRequest = z.infer<typeof createTreatmentScheduleSchema>;
