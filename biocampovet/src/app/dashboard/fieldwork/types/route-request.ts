import { z } from 'zod';

export const createRouteStopSchema = z.object({
  fieldVisitId: z.number().int().positive(),
  position: z.number().int().min(0),
  eta: z.string().optional(),
});
export type CreateRouteStopRequest = z.infer<typeof createRouteStopSchema>;

export const createRouteDaySchema = z.object({
  employeeId: z.number().int().positive(),
  vehicleId: z.number().int().positive().optional(),
  routeDate: z.string(),
  stops: z.array(createRouteStopSchema).optional(),
});
export type CreateRouteDayRequest = z.infer<typeof createRouteDaySchema>;

