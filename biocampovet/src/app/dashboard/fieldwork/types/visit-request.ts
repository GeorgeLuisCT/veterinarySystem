import { z } from 'zod';
import { FieldVisitStatus } from '../enums/field-visit-status';
import { ProductUnitType } from '@/app/dashboard/inventory/products/enums/product-unit-type';

const baseVisitCore = z.object({
  farmId: z.number().int().positive().optional(),
  zoneId: z.number().int().positive().optional(),
  fieldVetId: z.number().int().positive(),
  vehicleId: z.number().int().positive().optional(),
  companionIds: z.array(z.number().int().positive()).default([]),
  scheduledDateTime: z.string(),
  objective: z.string().max(1000).optional(),
});

const fincaOZonaRequerida = (data: z.infer<typeof baseVisitCore>) =>
  data.farmId !== undefined || data.zoneId !== undefined;

export const createVisitSchema = baseVisitCore.refine(fincaOZonaRequerida, {
  message: 'Selecciona una finca o una zona',
  path: ['farmId'],
});

export const updateVisitSchema = baseVisitCore
  .extend({
    status: z.nativeEnum(FieldVisitStatus),
    routeOrder: z.number().int().optional(),
  })
  .refine(fincaOZonaRequerida, {
    message: 'Selecciona una finca o una zona',
    path: ['farmId'],
  });

export type CreateVisitRequest = z.infer<typeof createVisitSchema>;
export type UpdateVisitRequest = z.infer<typeof updateVisitSchema>;

export const addServiceItemSchema = z.object({
  clinicalServiceId: z.number().int().positive(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
  performedById: z.number().int().positive().optional(),
  notes: z.string().max(1000).optional(),
});
export type AddServiceItemRequest = z.infer<typeof addServiceItemSchema>;

export const addProductUsageSchema = z.object({
  productId: z.number().int().positive(),
  unit: z.nativeEnum(ProductUnitType),
  quantityUsed: z.number().int().min(1),
  vehicleId: z.number().int().positive().optional(),
  notes: z.string().max(1000).optional(),
});
export type AddProductUsageRequest = z.infer<typeof addProductUsageSchema>;

export const setBiosecuritySchema = z.object({
  vehicleAndEquipmentCleaned: z.boolean().optional(),
  ppeUsed: z.boolean().optional(),
  handHygiene: z.boolean().optional(),
  notes: z.string().max(1000).optional(),
});
export type SetBiosecurityRequest = z.infer<typeof setBiosecuritySchema>;

export const addAttachmentSchema = z.object({
  fileName: z.string().min(1),
  fileUrl: z.string().url(),
  mimeType: z.string().optional(),
});
export type AddAttachmentRequest = z.infer<typeof addAttachmentSchema>;
