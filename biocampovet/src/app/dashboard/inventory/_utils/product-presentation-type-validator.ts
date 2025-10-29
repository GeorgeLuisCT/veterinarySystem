import { ProductPresentationType } from "../_enums/product-presentation-type";
import { ProductUnitType } from "../_enums/product-unit-type";

// Familias de unidades para reusar
const COUNT_UNITS: ProductUnitType[] = [
  ProductUnitType.UNIT,
  ProductUnitType.CAPSULE,
  ProductUnitType.TABLET,
];

const MASS_UNITS: ProductUnitType[] = [
  ProductUnitType.KILOGRAM,
  ProductUnitType.GRAM,
  ProductUnitType.MILLIGRAM,
];

const VOLUME_UNITS: ProductUnitType[] = [
  ProductUnitType.LITER,
  ProductUnitType.MILLILITER,
];

const MICRO_UNITS: ProductUnitType[] = [
  ProductUnitType.MICROGRAM,
];

export const ALLOWED_UNITS_BY_PRESENTATION: Record<ProductPresentationType, ProductUnitType[]> = {
  BAG: [
    ...MASS_UNITS,
    ProductUnitType.UNIT, // vender bolsa por pieza también
  ],
  BOTTLE: [
    ...VOLUME_UNITS,
    ProductUnitType.UNIT, // por pieza (botella)
  ],
  BOX: [
    ...COUNT_UNITS,       // cajas con unidades/cápsulas/tabletas
    ...MASS_UNITS,        // cajas con polvo/granulado
    ...VOLUME_UNITS,      // cajas con sachets líquidos
  ],
  BLISTER: [
    ...COUNT_UNITS.filter(u => u !== ProductUnitType.UNIT), // cápsulas/tabletas
  ],
  PACK: [
    ...COUNT_UNITS,       // paquetes de unidades/cápsulas/tabletas
  ],
  CAN: [
    ...VOLUME_UNITS,
    ProductUnitType.UNIT, // lata por pieza
  ],
  JAR: [
    ...VOLUME_UNITS,
    ...MASS_UNITS,        // frascos con contenido en g
    ProductUnitType.UNIT, // frasco por pieza
  ],
  TUBE: [
    ...MASS_UNITS,        // gel/crema en g
    ...VOLUME_UNITS,      // pomadas líquidas en ml
    ProductUnitType.UNIT, // tubo por pieza
  ],
  SACHET: [
    ...MASS_UNITS,        // sachets en g/mg
    ProductUnitType.UNIT, // sachet por pieza
  ],
  AMPOULE: [
    ...VOLUME_UNITS,      // ampollas en ml
    ...MICRO_UNITS,       // microgramos (ej. fármacos potentes)
    ProductUnitType.MILLIGRAM,
  ],
  SYRINGE: [
    ...VOLUME_UNITS,      // jeringa precargada en ml
    ...MICRO_UNITS,
    ProductUnitType.MILLIGRAM,
    ProductUnitType.UNIT, // por pieza
  ],
  GALLON: [
    ...VOLUME_UNITS,      // conversión/normalización a L/ml
  ],
  CASE: [
    ...COUNT_UNITS,
    ...MASS_UNITS,
    ...VOLUME_UNITS,
  ],
  ROLL: [
    ProductUnitType.UNIT, // por pieza (si no existen metros en tu enum)
  ],
  LOOSE: [
    ProductUnitType.UNIT, // unidades sueltas
    ProductUnitType.GRAM, // granel por peso
    ProductUnitType.MILLILITER, // granel por volumen
  ],
  NONE: [
    ...COUNT_UNITS,
    ...MASS_UNITS,
    ...VOLUME_UNITS,
    ...MICRO_UNITS,
  ],
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
