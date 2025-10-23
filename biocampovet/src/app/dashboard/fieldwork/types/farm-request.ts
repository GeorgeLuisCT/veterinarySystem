import { z } from 'zod';

const baseSchema = z.object({
  customerId: z.number({ required_error: 'Debe seleccionar un cliente.' }).int().positive('Cliente inválido.'),
  name: z.string().trim().min(1, 'El nombre es obligatorio.').max(255, 'No puede exceder 255 caract.'),
  zoneId: z.number().int().positive().optional(),
  locationDescription: z.string().trim().max(500, 'No puede exceder 500 caract.').optional(),
  gpsCoordinates: z.string().trim().max(255, 'No puede exceder 255 caract.').optional(),
  addressLabel: z.string().trim().max(255, 'No puede exceder 255 caract.').optional(),
});

export const createFarmSchema = baseSchema;
export const updateFarmSchema = baseSchema;

export type CreateFarmRequest = z.infer<typeof createFarmSchema>;
export type UpdateFarmRequest = z.infer<typeof updateFarmSchema>;

