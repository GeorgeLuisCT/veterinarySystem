import { AnimalQuickSearchResponse } from "@/app/dashboard/patients/animals/types/animal-quick-search-response";
import { z } from "zod";
import { ProductResponse } from "../../inventory/_types/product-response";

export const saleProductRequestSchema = z.object({
  productId: z.number({ required_error: "El producto es obligatorio" }),
  unitType: z.string({ required_error: "El tipo de unidad es obligatorio" }),
  quantityEquivalent: z.number({ required_error: "La cantidad equivalente es obligatoria" }).positive("La cantidad equivalente debe ser mayor a 0.0"),
  price: z.number({ required_error: "El precio es obligatorio" }).positive("El precio debe ser mayor a 0.0"),
  discount: z.number().min(0, "El descuento no puede ser negativo").optional(),
  subtotal: z.number({ required_error: "El subtotal es obligatorio" }).positive("El subtotal debe ser mayor a 0.0"),
  animalId: z.number().optional(),
  applied: z.boolean({ required_error: "Debe indicarse si se aplicó o no" }),
});

export type SaleProductRequest = z.infer<typeof saleProductRequestSchema>;

export type SaleProductLocal = Omit<SaleProductRequest, "animalId" | "productId"> & {
  product: ProductResponse;
  animal?: AnimalQuickSearchResponse;
  uid: string;
};