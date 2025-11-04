import { z } from 'zod';
import { FieldVisitStatus } from '../enums/field-visit-status';
import { ProductUnitType } from '@/app/dashboard/inventory/_enums/product-unit-type';
import { AdministrationRoute } from '@/app/dashboard/inventory/_enums/administration-route';
import { AnimalSpecies } from '@/app/dashboard/crm/patients/enums/animal-species';

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

const serviceGroupSchema = z.object({
  species: z.nativeEnum(AnimalSpecies, { required_error: "Selecciona una especie." }),
  breed: z.string().max(255).optional(),
  quantity: z.number().int().min(1, "La cantidad debe ser al menos 1."),
  description: z.string().max(1000).optional(),
});

const serviceProductSchema = z.object({
  productId: z.number().int().positive(),
  dose: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
    z.number({ required_error: "Ingresa la dosis." }).positive("La dosis debe ser mayor a 0.")
  ),
  unit: z.nativeEnum(ProductUnitType, { required_error: "Selecciona una unidad." }),
  administrationRoute: z.nativeEnum(AdministrationRoute, { required_error: "Selecciona una vía." }),
});

export const addServiceItemSchema = z.object({
  clinicalServiceId: z.number().int().positive(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
  performedById: z.number().int().positive().optional(),
  notes: z.string().max(1000).optional(),
  animalIds: z.array(z.number().int().positive()).optional().default([]),
  groups: z.array(serviceGroupSchema).optional().default([]),
  products: z.array(serviceProductSchema).optional().default([]),
});
export type AddServiceItemRequest = z.infer<typeof addServiceItemSchema>;

export const addProductUsageSchema = z.object({
  productId: z.number().int().positive(),
  unit: z.nativeEnum(ProductUnitType),
  quantityUsed: z.number().int().min(1),
  unitPrice: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
    z.number().positive().optional()
  ),
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

export const updateFieldVisitReportSchema = z.object({
  version: z.number().int().nonnegative(),
  findings: z.string().max(5000).nullable().optional(),
  diagnoses: z.string().max(5000).nullable().optional(),
  recommendations: z.string().max(5000).nullable().optional(),
});
export type UpdateFieldVisitReportRequest = z.infer<typeof updateFieldVisitReportSchema>;

export const updateFieldVisitStatusSchema = z.object({
  status: z.nativeEnum(FieldVisitStatus),
});
export type UpdateFieldVisitStatusRequest = z.infer<typeof updateFieldVisitStatusSchema>;
