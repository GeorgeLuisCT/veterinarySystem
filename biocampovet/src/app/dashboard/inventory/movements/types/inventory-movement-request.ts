import { z } from "zod";
import { InventoryMovementType } from "../enums/inventory-movement-type";
import {
  InventoryMovementProductLocal,
} from "./inventory-movement-product-request";

export const InventoryMovementSchema = z
  .object({
    type: z.nativeEnum(InventoryMovementType, {
      required_error: "El tipo de movimiento es obligatorio",
    }),
    sourceBranchId: z.number().optional(),
    targetBranchId: z.number().optional(),
    supplierId: z.number().optional(),
    description: z.string().optional(),
    products: z.array(z.any()).min(1, "Debe registrar al menos un producto")

  })
  .superRefine((data, ctx) => {
    if (
      data.type === InventoryMovementType.TRANSFER_SENT ||
      data.type === InventoryMovementType.NEGATIVE_ADJUSTMENT ||
      data.type === InventoryMovementType.SUPPLIER_RETURN ||
      data.type === InventoryMovementType.TRANSFER_RECEIVED
    ) {
      if (!data.sourceBranchId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La sucursal origen es obligatoria para este tipo de movimiento",
          path: ["sourceBranchId"],
        });
      }
    }

    if (
      (data.type === InventoryMovementType.PURCHASE ||
        data.type === InventoryMovementType.SUPPLIER_RETURN) &&
      !data.supplierId
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El proveedor es obligatorio para este tipo de movimiento",
        path: ["supplierId"],
      });
    }

    if (
      (data.type === InventoryMovementType.TRANSFER_SENT ||
        data.type === InventoryMovementType.TRANSFER_RECEIVED ||
        data.type === InventoryMovementType.PURCHASE ||
        data.type === InventoryMovementType.POSITIVE_ADJUSTMENT) &&
      !data.targetBranchId
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La sucursal destino es obligatoria para este tipo de movimiento",
        path: ["targetBranchId"],
      });
    }

    data.products.forEach((product, index) => {
      if (data.type === InventoryMovementType.PURCHASE) {
        if (product.unitCost === undefined || isNaN(product.unitCost)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "El costo unitario es obligatorio",
            path: ["products", index, "unitCost"],
          });
        }

        if (!product.expirationDate || product.expirationDate.trim() === "") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "La fecha de vencimiento es obligatoria",
            path: ["products", index, "expirationDate"],
          });
        }
      }
    });
  });

export type InventoryMovementRequest = z.infer<typeof InventoryMovementSchema>;

export type InventoryMovementLocal = Omit<InventoryMovementRequest, "products"> & {
  products: InventoryMovementProductLocal[];
};
