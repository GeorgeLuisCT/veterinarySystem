import { z } from "zod";
import { ProductUnitType } from "../_enums/product-unit-type";
import { AdjustmentType } from "../_enums/adjustment-type";
import { InventoryMovementType } from "../_enums/inventory-movement-type";

const numericField = (minMessage: string) =>
  z.preprocess(
    (value) => {
      if (typeof value === "string") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : value;
      }
      return value;
    },
    z.number({ required_error: minMessage }).positive(minMessage)
  );

const positiveQuantity = numericField("La cantidad debe ser mayor a 0");

const unitCostSchema = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    if (value instanceof Number) return Number(value);
    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return value;
  },
  z
    .number({
      required_error: "El costo unitario es obligatorio",
      invalid_type_error: "El costo unitario debe ser un número",
    })
    .min(0, "El costo unitario no puede ser negativo")
);

const optionalString = z
  .string()
  .trim()
  .min(1, "Este campo no puede estar vacío")
  .optional()
  .or(z.literal("").transform(() => undefined));


export const purchaseProductSchema = z.object({
  productId: z.number({ required_error: "Selecciona un producto" }).min(1, "Selecciona un producto"),
  batchNumber: z.string({ required_error: "El número de lote es obligatorio" }).trim().min(1, "El número de lote no puede estar vacío"),
  expirationDate: z
    .string()
    .trim()
    .min(1, "La fecha de vencimiento es obligatoria")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  quantity: positiveQuantity,
  unitType: z.nativeEnum(ProductUnitType, { required_error: "La unidad es obligatoria" }),
  unitCost: unitCostSchema,
});

export const purchaseCreateBaseSchema = z.object({
  branchId: z.number({ required_error: "Selecciona una sucursal" }).min(1, "Selecciona una sucursal"),
  supplierId: z.number({ required_error: "Selecciona un proveedor" }).min(1, "Selecciona un proveedor"),
  date: z.string({ required_error: "La fecha de compra es obligatoria" }).min(1, "La fecha de compra es obligatoria"),
  description: optionalString,
  products: z.array(purchaseProductSchema).min(1, "Agrega al menos un producto"),
  payNow: z.boolean().optional(),
  paymentAmount: z
    .number({ required_error: "Ingresa el monto a pagar" })
    .positive("El monto debe ser mayor a cero")
    .optional(),
  paymentTreasuryAccountId: z.number().optional(),
});

export const purchaseCreateSchema = purchaseCreateBaseSchema.superRefine((data, ctx) => {
  if (data.payNow) {
    if (!data.paymentAmount) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Ingresa el monto a pagar", path: ["paymentAmount"] });
    }
    if (!data.paymentTreasuryAccountId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Selecciona la cuenta de pago", path: ["paymentTreasuryAccountId"] });
    }
  }
});

export const transferProductSchema = z.object({
  productId: z.number({ required_error: "Selecciona un producto" }).min(1, "Selecciona un producto"),
  batchId: z
    .number({ required_error: "Selecciona un lote" })
    .min(1, "Selecciona un lote válido")
    .optional(),
  quantity: positiveQuantity,
  unitType: z.nativeEnum(ProductUnitType, { required_error: "La unidad es obligatoria" }),
});


export const transferCreateBaseSchema = z.object({
  sourceBranchId: z.number({ required_error: "Selecciona la sucursal de origen" }).min(1, "Selecciona la sucursal de origen"),
  targetBranchId: z.number({ required_error: "Selecciona la sucursal de destino" }).min(1, "Selecciona la sucursal de destino"),
  description: optionalString,
  products: z.array(transferProductSchema).min(1, "Agrega al menos un producto"),
});

export const transferCreateSchema = transferCreateBaseSchema.superRefine((data, ctx) => {
  if (data.sourceBranchId === data.targetBranchId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "La sucursal de origen y destino no pueden ser la misma",
      path: ["targetBranchId"],
    });
  }
});

export const adjustmentProductSchema = z.object({
  productId: z.number({ required_error: "Selecciona un producto" }).min(1, "Selecciona un producto"),
  batchId: z
    .number({ required_error: "Selecciona un lote" })
    .min(1, "Selecciona un lote válido")
    .optional(),
  quantity: positiveQuantity,
  unitType: z.nativeEnum(ProductUnitType, { required_error: "La unidad es obligatoria" }),
  adjustmentType: z.nativeEnum(AdjustmentType, { required_error: "Selecciona el tipo de ajuste" }),
  reason: optionalString,
});

export const adjustmentCreateSchema = z.object({
  branchId: z.number({ required_error: "Selecciona una sucursal" }).min(1, "Selecciona una sucursal"),
  description: optionalString,
  products: z.array(adjustmentProductSchema).min(1, "Agrega al menos un producto"),
});

export type PurchaseProductRequest = z.infer<typeof purchaseProductSchema>;
export type PurchaseCreateRequest = z.infer<typeof purchaseCreateSchema>;

export type TransferProductRequest = z.infer<typeof transferProductSchema>;
export type TransferCreateRequest = z.infer<typeof transferCreateSchema>;

export type AdjustmentProductRequest = z.infer<typeof adjustmentProductSchema>;
export type AdjustmentCreateRequest = z.infer<typeof adjustmentCreateSchema>;

export interface InventoryMovementListParams {
  page?: number;
  size?: number;
  branchId?: number;
  types?: InventoryMovementType[];
  startDate?: string;
  endDate?: string;
}
