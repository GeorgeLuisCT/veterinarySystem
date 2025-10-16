import { z } from "zod";
import { SurgicalOrderStatus } from "../enums/surgical-order-status";

const requiredId = (field: string) =>
  z
    .number({ required_error: `Debe seleccionar ${field}.`, invalid_type_error: `Debe seleccionar ${field} válido.` })
    .int(`${field} no es válido.`)
    .min(1, `${field} no es válido.`);

const optionalId = (field: string) =>
  z
    .union([
      z
        .number({ invalid_type_error: `Debe seleccionar ${field} válido.` })
        .int(`${field} no es válido.`)
        .min(1, `${field} no es válido.`),
      z.literal(null),
    ])
    .optional();

const optionalTrimmedString = (maxLength: number, message: string) =>
  z
    .string()
    .max(maxLength, message)
    .optional()
    .transform((val) => {
      const trimmed = val?.trim();
      return trimmed ? trimmed : undefined;
    });

export const createSurgicalOrderSchema = z.object({
  animalId: requiredId("una mascota"),
  recommendedServiceId: requiredId("un servicio recomendado"),
  requestedById: requiredId("un profesional"),
  operationRoomId: requiredId("una sala de operaciones"),
  notes: optionalTrimmedString(1000, "Las notas no pueden superar los 1000 caracteres."),
  status: z.nativeEnum(SurgicalOrderStatus).optional(),
});

export const updateSurgicalOrderSchema = z.object({
  recommendedServiceId: optionalId("un servicio recomendado"),
  requestedById: optionalId("un profesional"),
  operationRoomId: optionalId("una sala de operaciones"),
  notes: optionalTrimmedString(1000, "Las notas no pueden superar los 1000 caracteres."),
  status: z.nativeEnum(SurgicalOrderStatus).optional(),
});

export type CreateSurgicalOrderRequest = z.infer<typeof createSurgicalOrderSchema>;
export type UpdateSurgicalOrderRequest = z.infer<typeof updateSurgicalOrderSchema>;

