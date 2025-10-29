import { z } from "zod";
import { ProductSaleModeRequest, ProductSaleModeRequestSchema } from "./product-sale-mode-request";
import { ProductPresentationType } from "../_enums/product-presentation-type";
import { ProductUnitType } from "../_enums/product-unit-type";
import { AdministrationRoute } from "../_enums/administration-route";

const productSchemaBase = z.object({
  name: z.string().min(1, "El nombre no puede estar vacío").max(100, "El nombre no debe exceder los 100 caracteres"),
  description: z.string().min(1, "La descripción no puede estar vacía"),
  minStock: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number({ required_error: "El stock mínimo es obligatorio" }).min(0, "El stock mínimo debe ser al menos 0")
  ),
  categoryId: z
    .number({ required_error: "El ID de la categoría es obligatorio" })
    .min(1, "Debes seleccionar una categoría"),
  sku: z.string().min(1, "El SKU no puede estar vacío").max(50, "El SKU no debe exceder los 50 caracteres"),
  
  presentation: z.nativeEnum(ProductPresentationType, {
    required_error: "La presentación del producto es obligatoria",
  }),
  
  unitType: z.nativeEnum(ProductUnitType, {
    required_error: "La unidad de medida base es obligatoria",
  }),

  contentTotal: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number({ required_error: "El contenido es obligatorio" }).min(0.01, "El contenido debe ser al menos 0.01")
  ),
  
  standardPrice: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number({ required_error: "El precio de la presentación es obligatorio" }).min(0, "El precio debe ser al menos 0")
  ),

  saleModes: z.array(ProductSaleModeRequestSchema),
  administrationRoutes: z.array(z.nativeEnum(AdministrationRoute)).optional(),
});

export const productCreateSchema = productSchemaBase.extend({
  branchIds: z
    .array(z.number(), {
      required_error: "Debes seleccionar al menos una sucursal",
    })
    .min(1, "Debes seleccionar al menos una sucursal"),
});

export const productUpdateSchema = productSchemaBase.extend({
  id: z
    .number({
      required_error: "El ID del producto es obligatorio",
    })
    .min(1),
});

export type ProductCreateRequest = z.infer<typeof productCreateSchema>;
export type ProductUpdateRequest = z.infer<typeof productUpdateSchema>;

export type ProductRequest = z.infer<typeof productSchemaBase> & {
  id?: number;
  branchIds?: number[];
};


/**--------------------- */
// Esta interfaz coincide con tu 'BaseProductRequest.java'
export interface BaseProductApiRequest {
  name: string;
  description: string;
  minStock: number;
  categoryId: number;
  sku: string;
  presentation: ProductPresentationType;
  baseUnitType: ProductUnitType;
  mainUnitType: ProductUnitType;
  standardPrice: number;
  contentTotal: number;
  administrationRoutes?: AdministrationRoute[];
  saleModes: ProductSaleModeRequest[];
}

// Esta coincide con 'ProductCreateRequest.java'
export interface ProductApiCreateRequest extends BaseProductApiRequest {
  branchIds: number[];
}

// Esta coincide con 'ProductUpdateRequest.java'
export interface ProductApiUpdateRequest extends BaseProductApiRequest {
  id: number;
}