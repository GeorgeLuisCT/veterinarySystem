import { z } from "zod";
import { AppointmentType } from "@/app/dashboard/schedule/enums/appointment-type";

export const historySchema = z.object({
    documentTypeId: z.string().min(1, "Selecciona un tipo de documento"),
    documentNumber: z.string().trim().min(4, "Ingresa un documento válido"),
});

export type HistoryFormData = z.infer<typeof historySchema>;

const optionalEmailSchema = z
    .union([z.string().trim().email("Correo inválido"), z.literal("")])
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined));

const optionalPhoneSchema = z
    .union([z.string().trim().min(7, "Número muy corto"), z.literal("")])
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined));

export const appointmentSchema = z.object({
    documentTypeId: z.string().min(1, "Selecciona un tipo de documento"),
    documentNumber: z.string().trim().min(4, "Ingresa un documento válido"),
    animalId: z.string().min(1, "Selecciona a tu mascota"),
    branchId: z.string().min(1, "Selecciona una sede"),
    appointmentType: z.nativeEnum(AppointmentType, {
        errorMap: () => ({ message: "Selecciona el tipo de cita" }),
    }),
    preferredDate: z.string().min(1, "Selecciona la fecha de tu cita"),
    preferredTime: z.string().min(1, "Selecciona la hora"),
    requesterName: z.string().trim().min(3, "Cuéntanos quién agenda la cita"),
    requesterEmail: optionalEmailSchema,
    requesterPhone: optionalPhoneSchema,
    notes: z
        .string()
        .trim()
        .max(600, "Máximo 600 caracteres")
        .optional()
        .transform((value) => (value && value.length > 0 ? value : undefined)),
});

export type AppointmentFormData = z.infer<typeof appointmentSchema>;