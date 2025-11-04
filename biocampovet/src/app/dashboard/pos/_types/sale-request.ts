import { z } from "zod";
import {
  BillableServiceType,
  PaymentMethod,
  SaleItemKind,
  SalesDocumentType,
  SaleStatus,
} from "../_types/sale-enums";
import { ProductUnitType } from "@/app/dashboard/inventory/_enums/product-unit-type";

const nonNegative = (field: string) =>
  z
    .number({ required_error: `El campo ${field} es obligatorio` })
    .refine((v) => v >= 0, { message: `${field} debe ser mayor o igual a 0` });

const positive = (field: string) =>
  z
    .number({ required_error: `El campo ${field} es obligatorio` })
    .refine((v) => v > 0, { message: `${field} debe ser mayor que 0` });

const optionalId = (label: string) =>
  z.number({ invalid_type_error: `${label} debe ser numérico` }).int().positive().optional();

const optionalIsoDateTime = z.string().datetime({ message: "Fecha/hora inválida (usar ISO 8601)" }).optional();

const optionalNonEmptyString = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().max(max, `Máximo ${max} caracteres`).optional()
  );

export const saleItemSchema = z
  .object({
    kind: z.nativeEnum(SaleItemKind, { required_error: "El tipo de ítem es obligatorio" }),
    productId: optionalId("productId"),
    saleModeId: optionalId("saleModeId"),
    serviceType: z.nativeEnum(BillableServiceType).optional(),
    serviceItemId: optionalId("serviceItemId"),
    unitPrice: nonNegative("Precio unitario"),
    quantity: positive("Cantidad"),
    unitType: z.nativeEnum(ProductUnitType).optional(),
    taxRate: nonNegative("Impuesto (tasa)").optional(),
    taxAmount: nonNegative("Impuesto (monto)").optional(),
    descriptionOverride: optionalNonEmptyString(1000),
    metadataJson: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const isProduct = data.kind === SaleItemKind.PRODUCT;
    const isService = data.kind === SaleItemKind.SERVICE;
    const hasProduct = !!data.productId;
    const hasSaleMode = !!data.saleModeId;
    const hasService = !!data.serviceType && !!data.serviceItemId;

    if (isProduct) {
      if (!hasProduct || !hasSaleMode || hasService) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Para ítems de tipo PRODUCT debe especificarse productId y saleModeId; y no debe incluir campos de servicio",
          path: ["kind"],
        });
      }
    }

    if (isService) {
      if (hasProduct || !hasService) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Para ítems de tipo SERVICE debe especificarse serviceType y serviceItemId; y no debe incluir productId",
          path: ["kind"],
        });
      }
    }
  });

export type SaleItemRequest = z.infer<typeof saleItemSchema>;

export const salePaymentSchema = z.object({
  amount: positive("Monto"),
  method: z.nativeEnum(PaymentMethod, { required_error: "El método de pago es obligatorio" }),
  paidAt: optionalIsoDateTime,
  reference: optionalNonEmptyString(200),
  notes: optionalNonEmptyString(1000),
});

export type SalePaymentRequest = z.infer<typeof salePaymentSchema>;

export const createSaleRequestSchema = z
  .object({
    finalizeSale: z.boolean().default(false),
    branchId: z.number({ required_error: "La sucursal es obligatoria" }).int().positive("Sucursal inválida"),
    sellerId: z.number({ required_error: "El vendedor es obligatorio" }).int().positive("Vendedor inválido"),
    customerId: z.number().int().positive().optional(),
    documentType: z.nativeEnum(SalesDocumentType).optional(),
    documentNumber: optionalNonEmptyString(32),
    items: z
      .array(saleItemSchema, { required_error: "Debes agregar al menos un ítem" })
      .min(1, "Debes agregar al menos un ítem"),
    payments: z.array(salePaymentSchema).default([]),
    notes: optionalNonEmptyString(1000),
  })
  .superRefine((data, ctx) => {
    if (data.finalizeSale) {
      if (!data.payments || data.payments.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Para finalizar la venta debes registrar al menos un pago",
          path: ["payments"],
        });
      }
    }

    data.items.forEach((it, idx) => {
      if (it.metadataJson) {
        try {
          JSON.parse(it.metadataJson);
        } catch {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "metadataJson debe ser un JSON válido",
            path: ["items", idx, "metadataJson"],
          });
        }
      }
    });
  });

export type CreateSaleRequest = z.infer<typeof createSaleRequestSchema>;

export const voidSaleRequestSchema = z.object({
  reason: z.string({ required_error: "El motivo es obligatorio" }).trim().min(1, "El motivo es obligatorio"),
});

export type VoidSaleRequest = z.infer<typeof voidSaleRequestSchema>;

export const saleListParamsSchema = z.object({
  page: z.number().int().min(0).optional(),
  size: z.number().int().min(1).max(100).optional(),
  branchId: z.number().int().positive().optional(),
  status: z.nativeEnum(SaleStatus).optional(),
  documentNumber: z.string().trim().optional(),
});

export type SaleListParams = z.infer<typeof saleListParamsSchema>;

export const saleFormSchema = z.object({
  documentType: z.nativeEnum(SalesDocumentType).optional(),
  documentNumber: optionalNonEmptyString(32),
  customerId: z.number().int().positive().optional(),
  notes: optionalNonEmptyString(1000),
});

export type SaleFormValues = z.infer<typeof saleFormSchema>;

export const updateSaleRequestSchema = z.object({
  branchId: z
    .number({ required_error: "La sucursal es obligatoria" })
    .int()
    .positive("Sucursal inválida"),
  sellerId: z
    .number({ required_error: "El vendedor es obligatorio" })
    .int()
    .positive("Vendedor inválido"),
  customerId: optionalId("customerId"),
  documentType: z.nativeEnum(SalesDocumentType).optional(),
  documentNumber: optionalNonEmptyString(32),
  notes: optionalNonEmptyString(1000),
  sourceAttentionId: optionalId("sourceAttentionId"),
});

export type UpdateSaleRequest = z.infer<typeof updateSaleRequestSchema>;

export const finalizeSaleRequestSchema = z.object({
  payments: z.array(salePaymentSchema).default([]),
});

export type FinalizeSaleRequest = z.infer<typeof finalizeSaleRequestSchema>;