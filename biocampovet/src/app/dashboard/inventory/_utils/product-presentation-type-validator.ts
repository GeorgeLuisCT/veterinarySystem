import { ProductPresentationType } from "../_enums/product-presentation-type";
import { ProductUnitType } from "../_enums/product-unit-type";

export const ALLOWED_UNITS_BY_PRESENTATION: Record<ProductPresentationType, ProductUnitType[]> = {
  BAG: [ProductUnitType.KILOGRAM, ProductUnitType.GRAM],
  BOTTLE: [ProductUnitType.LITER, ProductUnitType.MILLILITER],
  BOX: [
    ProductUnitType.UNIT,
    ProductUnitType.CAPSULE,
    ProductUnitType.TABLET,
    ProductUnitType.KILOGRAM,
    ProductUnitType.GRAM,
  ],
  BLISTER: [ProductUnitType.CAPSULE, ProductUnitType.TABLET],
  PACK: [ProductUnitType.UNIT, ProductUnitType.CAPSULE, ProductUnitType.TABLET],
  CAN: [ProductUnitType.LITER, ProductUnitType.MILLILITER],
  JAR: [ProductUnitType.LITER, ProductUnitType.MILLILITER],
  TUBE: [ProductUnitType.UNIT, ProductUnitType.CAPSULE, ProductUnitType.TABLET],
  SACHET: [ProductUnitType.GRAM, ProductUnitType.MILLIGRAM],
  AMPOULE: [ProductUnitType.MILLILITER, ProductUnitType.MICROGRAM],
  SYRINGE: [ProductUnitType.MILLILITER, ProductUnitType.MICROGRAM],
  GALLON: [ProductUnitType.LITER],
  CASE: [ProductUnitType.UNIT, ProductUnitType.CAPSULE, ProductUnitType.TABLET],
  ROLL: [ProductUnitType.UNIT],
  LOOSE: [ProductUnitType.UNIT],
  NONE: [ProductUnitType.UNIT],
};

/**
 * Devuelve las unidades compatibles con una presentación dada.
 * @param presentation La presentación del producto
 * @returns Array con unidades permitidas
 */
export function getAllowedUnitsByPresentation(
  presentation: ProductPresentationType | undefined
): ProductUnitType[] {
  if (!presentation) return [];
  return ALLOWED_UNITS_BY_PRESENTATION[presentation] ?? [];
}
