import { z } from "zod";
import { SaleItemKind, SalesDocumentType } from "../_types/sale-enums";

export const saleItemSchema = z.object({
  kind: z.nativeEnum(SaleItemKind),
  productId: z.number().positive().optional(),
  productBatchId: z.number().positive().optional(),
  serviceType: z.string().optional(),
  serviceItemId: z.number().positive().optional(),
  unitPrice: z.number().min(0),
  quantity: z.number().positive(),
  unitType: z.string().optional(),
  taxRate: z.number().min(0).optional(),
  taxAmount: z.number().min(0).optional(),
  descriptionOverride: z.string().optional(),
  metadataJson: z.string().optional(),
});

export const salePaymentSchema = z.object({
  amount: z.number().positive(),
  method: z.string(),
  paidAt: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export const saleFormSchema = z.object({
  documentType: z.nativeEnum(SalesDocumentType),
  documentNumber: z.string().min(1),
  customerId: z.number().positive().optional(),
  notes: z.string().optional(),
});

export type SaleFormValues = z.infer<typeof saleFormSchema>;
