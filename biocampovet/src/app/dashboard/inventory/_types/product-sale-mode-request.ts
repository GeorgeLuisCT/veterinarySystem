import { z } from "zod";
import { ProductUnitType } from "../_enums/product-unit-type";

export const ProductSaleModeRequestSchema = z.object({
  id: z.number().optional(),

  unitType: z.nativeEnum(ProductUnitType, {
    required_error: "El modo de venta es obligatorio",
  }),

  price: z.preprocess(
    (val) => parseFloat(String(val)),
    z
      .number({
        required_error: "El precio es obligatorio",
        invalid_type_error: "El precio debe ser un número",
      })
      .min(0, "El precio debe ser al menos 0.0")
  ),

  relativeQuantity: z.preprocess(
    (val) => Number(val),
    z
      .number({
        required_error: "La cantidad es obligatoria",
        invalid_type_error: "La cantidad debe ser un número",
      })
      .min(0.01, "La cantidad debe ser positiva")
  ),

  relativeUnitType: z.nativeEnum(ProductUnitType, {
    required_error: "La unidad relativa es obligatoria",
  }),
});

export type ProductSaleModeRequest = z.infer<
  typeof ProductSaleModeRequestSchema
>;