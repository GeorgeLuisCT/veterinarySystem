import { z } from 'zod';
import { GeoZoneType } from '../enums/geo-zone-type';

const baseSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio.').max(255, 'No puede exceder 255 caract.'),
  type: z.nativeEnum(GeoZoneType),
  parentId: z.number().int().positive().optional(),
  gpsCoordinates: z.string().trim().max(255, 'No puede exceder 255 caract.').optional(),
  active: z.boolean().optional(),
});

export const createGeoZoneSchema = baseSchema;
export const updateGeoZoneSchema = baseSchema;

export type CreateGeoZoneRequest = z.infer<typeof createGeoZoneSchema>;
export type UpdateGeoZoneRequest = z.infer<typeof updateGeoZoneSchema>;
