import { z } from "zod";
import { ProductSaleModeRequestSchema } from "./product-sale-mode-request-schema";
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

  unitType: z.nativeEnum(ProductUnitType, { required_error: "La unidad de medida es obligatoria" }),

  standardPrice: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number({ required_error: "El precio estándar es obligatorio" }).min(0, "El precio estándar debe ser al menos 0")
  ),

  contentTotal: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number({ required_error: "El contenido total es obligatorio" }).min(0.1, "El contenido total debe ser al menos 0.1")
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