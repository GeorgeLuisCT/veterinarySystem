import { z } from "zod";
import { ProductUnitType } from "../../products/enums/product-unit-type";
import { ProductResponse } from "../../products/types/product-response";

export const InventoryMovementProductSchema = z.object({
  productId: z.number({ required_error: "El ID del producto es obligatorio" }),
  quantity: z
    .number({ required_error: "La cantidad es obligatoria" })
    .positive("La cantidad debe ser mayor a 0"),
  productUnitType: z.nativeEnum(ProductUnitType, {
    required_error: "La unidad es obligatoria",
  }),
  unitCost: z.preprocess(
    (val) => {
      const parsed = parseFloat(val as string);
      return isNaN(parsed) ? undefined : parsed;
    },
    z.number().optional()
  ),
  batchNumber: z
    .string({ required_error: "El lote es obligatorio" })
    .refine((val) => val.trim() !== "", {
      message: "El lote no puede estar vacío",
    }),
  expirationDate: z.string().optional(),
});

// Tipos relacionados
export type InventoryMovementProductRequest = z.infer<typeof InventoryMovementProductSchema>;

export type InventoryMovementProductLocal = Omit<InventoryMovementProductRequest, "productId"> & {
  product: ProductResponse;
};
