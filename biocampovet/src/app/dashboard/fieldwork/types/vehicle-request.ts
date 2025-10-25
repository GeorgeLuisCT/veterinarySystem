import { z } from 'zod';
import { ProductUnitType } from '@/app/dashboard/inventory/_enums/product-unit-type';

const base = z.object({
  name: z.string().min(1),
  licensePlate: z.string().optional(),
  assignedVetEmployeeId: z.number().int().positive().optional(),
  homeBranchId: z.number().int().positive().optional(),
  active: z.boolean().optional(),
});

export const createVehicleSchema = base;
export const updateVehicleSchema = base;

export type CreateVehicleRequest = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleRequest = z.infer<typeof updateVehicleSchema>;

export const adjustVehicleStockSchema = z.object({
  vehicleId: z.number().int().positive(),
  productId: z.number().int().positive(),
  quantityDelta: z.number().int(),
  unit: z.nativeEnum(ProductUnitType).optional(),
  notes: z.string().max(1000).optional(),
});
export type AdjustVehicleStockRequest = z.infer<typeof adjustVehicleStockSchema>;

export const createPingSchema = z.object({
  vehicleId: z.number().int().positive(),
  employeeId: z.number().int().positive().optional(),
  timestamp: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  speedKmh: z.number().optional(),
  note: z.string().max(1000).optional(),
});
export type CreateVehiclePingRequest = z.infer<typeof createPingSchema>;
