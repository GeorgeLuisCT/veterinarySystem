import { z } from 'zod';
import { FieldTeamStatus } from '../enums/field-team-status';

export const setTeamStatusSchema = z.object({
  employeeId: z.number().int().positive(),
  status: z.nativeEnum(FieldTeamStatus),
  currentVisitId: z.number().int().positive().optional(),
  locationText: z.string().max(255).optional(),
  gpsCoordinates: z.string().max(255).optional(),
});
export type SetTeamStatusRequest = z.infer<typeof setTeamStatusSchema>;

