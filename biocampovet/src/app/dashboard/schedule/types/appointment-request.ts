import { z } from "zod";
import { AppointmentStatus } from "../enums/appointment-status";

const requiredId = (field: string) =>
  z
    .number({ required_error: `Debe seleccionar ${field}.`, invalid_type_error: `Debe seleccionar ${field} válido.` })
    .int(`${field} no es válido.`)
    .min(1, `${field} no es válido.`);

const optionalPositiveDuration = z
  .preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
    z
      .number({ invalid_type_error: "Debe ser un número." })
      .int("La duración debe ser un número entero.")
      .positive("La duración debe ser mayor que 0.")
      .optional()
  )
  .nullable();

const optionalTrimmedString = (message: string) =>
  z
    .string()
    .max(1000, message)
    .optional()
    .transform((val) => {
      const trimmed = val?.trim();
      return trimmed ? trimmed : undefined;
    });

const baseCreateAppointmentSchema = z.object({
  animalId: requiredId("una mascota"),
  branchId: requiredId("una sucursal"),
  clinicalServiceId: requiredId("un servicio clínico"),
  startDateTime: z
    .string({ required_error: "Debe seleccionar la fecha y hora." })
    .min(1, "Debe seleccionar la fecha y hora."),
  estimatedDurationMinutes: optionalPositiveDuration,
});

export const createClinicalAppointmentSchema = baseCreateAppointmentSchema.extend({
  veterinarianId: requiredId("un veterinario"),
  consultationReason: optionalTrimmedString("El motivo no puede superar los 1000 caracteres."),
  clinicalNotes: optionalTrimmedString("Las notas clínicas no pueden superar los 1000 caracteres."),
});

export const createGroomingAppointmentSchema = baseCreateAppointmentSchema.extend({
  stylistId: requiredId("un estilista"),
  ownerSpecialNotes: optionalTrimmedString("Las indicaciones no pueden superar los 1000 caracteres."),
});

export const createSurgicalAppointmentSchema = z.object({
  animalId: requiredId("una mascota"),
  branchId: requiredId("una sucursal"),
  orderId: z
    .preprocess(
      (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
      z
        .number({ invalid_type_error: "Debe seleccionar una orden válida." })
        .int("La orden seleccionada no es válida.")
        .min(1, "La orden seleccionada no es válida.")
        .optional()
    )
    .nullable(),
  finalServiceId: requiredId("un servicio final"),
  surgeonId: requiredId("un cirujano"),
  anesthetistId: z
    .preprocess(
      (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
      z
        .number({ invalid_type_error: "Debe seleccionar un anestesista válido." })
        .int("El anestesista seleccionado no es válido.")
        .min(1, "El anestesista seleccionado no es válido.")
        .optional()
    )
    .nullable(),
  operatingRoomId: z
    .preprocess(
      (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
      z
        .number({ invalid_type_error: "Debe seleccionar una sala válida." })
        .int("La sala seleccionada no es válida.")
        .min(1, "La sala seleccionada no es válida.")
        .optional()
    )
    .nullable(),
  startDateTime: z
    .string({ required_error: "Debe seleccionar la fecha y hora." })
    .min(1, "Debe seleccionar la fecha y hora."),
  estimatedDurationMinutes: optionalPositiveDuration,
  prepInstructions: optionalTrimmedString("Las instrucciones no pueden superar los 1000 caracteres."),
});

export const rescheduleAppointmentSchema = z.object({
  startDateTime: z
    .string({ required_error: "Debe seleccionar la nueva fecha y hora." })
    .min(1, "Debe seleccionar la nueva fecha y hora."),
  estimatedDurationMinutes: optionalPositiveDuration,
});

export const updateAppointmentStatusSchema = z.object({
  status: z.nativeEnum(AppointmentStatus, {
    required_error: "Debe seleccionar un estado.",
    invalid_type_error: "Debe seleccionar un estado válido.",
  }),
});

export const assignAppointmentEmployeeSchema = z.object({
  employeeId: requiredId("un profesional"),
});

export type CreateClinicalAppointmentRequest = z.infer<typeof createClinicalAppointmentSchema>;
export type CreateGroomingAppointmentRequest = z.infer<typeof createGroomingAppointmentSchema>;
export type CreateSurgicalAppointmentRequest = z.infer<typeof createSurgicalAppointmentSchema>;
export type RescheduleAppointmentRequest = z.infer<typeof rescheduleAppointmentSchema>;
export type UpdateAppointmentStatusRequest = z.infer<typeof updateAppointmentStatusSchema>;
export type AssignAppointmentEmployeeRequest = z.infer<typeof assignAppointmentEmployeeSchema>;
