import { z } from "zod";
import { AttentionType } from "../enums/attention-type";
import { AttentionStatus } from "../enums/attention-status";

const requiredId = (field: string) =>
  z
    .number({ required_error: `Debe seleccionar ${field}.`, invalid_type_error: `Debe seleccionar ${field} válido.` })
    .int(`${field} no es válido.`)
    .min(1, `${field} no es válido.`);

export const createAttentionSchema = z.object({
  branchId: requiredId("una sucursal"),
  animalId: requiredId("una mascota"),
  attendingEmployeeId: requiredId("un profesional"),
  checkInTime: z
    .string({ required_error: "Debe indicar la hora de registro." })
    .min(1, "Debe indicar la hora de registro."),
  type: z.nativeEnum(AttentionType, {
    required_error: "Debe seleccionar un tipo de atención.",
    invalid_type_error: "Debe seleccionar un tipo de atención válido.",
  }),
  status: z.nativeEnum(AttentionStatus, {
    required_error: "Debe seleccionar un estado de espera.",
    invalid_type_error: "Debe seleccionar un estado de espera válido.",
  }),
  clinicalServiceId: requiredId("un servicio clínico"),
  emergency: z.boolean().optional(),
});

export const createAttentionFromAppointmentFormSchema = z.object({
  attendingEmployeeId: requiredId("un profesional"),
  emergency: z.boolean().optional(),
});

export const createAttentionFromAppointmentSchema = z.object({
  appointmentId: requiredId("una cita"),
  attendingEmployeeId: requiredId("un profesional").optional(),
  checkInTime: z.string().optional(),
  emergency: z.boolean().optional(),
  status: z.nativeEnum(AttentionStatus).optional(),
});

export const updateAttentionStatusSchema = z.object({
  status: z.nativeEnum(AttentionStatus, {
    required_error: "Debe seleccionar un estado de espera.",
    invalid_type_error: "Debe seleccionar un estado de espera válido.",
  }),
});

export const updateAttentionAttendingEmployeeSchema = z.object({
  attendingEmployeeId: requiredId("un profesional"),
});

export type CreateAttentionRequest = z.infer<typeof createAttentionSchema>;
export type CreateAttentionFromAppointmentForm = z.infer<typeof createAttentionFromAppointmentFormSchema>;
export type CreateAttentionFromAppointmentRequest = z.infer<typeof createAttentionFromAppointmentSchema>;
export type UpdateAttentionStatusRequest = z.infer<typeof updateAttentionStatusSchema>;
export type UpdateAttentionAttendingEmployeeRequest = z.infer<typeof updateAttentionAttendingEmployeeSchema>;
