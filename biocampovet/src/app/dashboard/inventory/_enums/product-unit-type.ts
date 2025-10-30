export enum ProductUnitType {
  UNIT = "UNIT",
  CAPSULE = "CAPSULE",
  TABLET = "TABLET",
  KILOGRAM = "KILOGRAM",
  GRAM = "GRAM",
  MILLIGRAM = "MILLIGRAM",
  MICROGRAM = "MICROGRAM",
  LITER = "LITER",
  MILLILITER = "MILLILITER",
  PACK = "PACK",
  BOX = "BOX"
}

export const ProductUnitTypeLabels: Record<ProductUnitType, string> = {
  [ProductUnitType.KILOGRAM]: "Kilogramo",
  [ProductUnitType.GRAM]: "Gramo",
  [ProductUnitType.MILLIGRAM]: "Miligramo",
  [ProductUnitType.MICROGRAM]: "Microgramo",
  [ProductUnitType.LITER]: "Litro",
  [ProductUnitType.MILLILITER]: "Mililitro",
  [ProductUnitType.UNIT]: "Unidad",
  [ProductUnitType.CAPSULE]: "Cápsula",
  [ProductUnitType.TABLET]: "Tableta",
  [ProductUnitType.PACK]: "Paquete",
  [ProductUnitType.BOX]: "Caja"
};

export const ProductUnitTypeLabelsPlural: Record<ProductUnitType, string> = {
  [ProductUnitType.KILOGRAM]: "Kilogramos",
  [ProductUnitType.GRAM]: "Gramos",
  [ProductUnitType.MILLIGRAM]: "Miligramos",
  [ProductUnitType.MICROGRAM]: "Microgramos",
  [ProductUnitType.LITER]: "Litros",
  [ProductUnitType.MILLILITER]: "Mililitros",
  [ProductUnitType.UNIT]: "Unidades",
  [ProductUnitType.CAPSULE]: "Cápsulas",
  [ProductUnitType.TABLET]: "Tabletas",
  [ProductUnitType.PACK]: "Paquetes",
  [ProductUnitType.BOX]: "Cajas"
};

export const ProductUnitTypeAbbreviations: Record<ProductUnitType, string> = {
  [ProductUnitType.KILOGRAM]: "kg.",
  [ProductUnitType.GRAM]: "g.",
  [ProductUnitType.MILLIGRAM]: "mg.",
  [ProductUnitType.MICROGRAM]: "µg.",
  [ProductUnitType.LITER]: "L.",
  [ProductUnitType.MILLILITER]: "mL.",
  [ProductUnitType.UNIT]: "Ud.",
  [ProductUnitType.CAPSULE]: "Cap.",
  [ProductUnitType.TABLET]: "Tab.",
  [ProductUnitType.PACK]: "Ud.",
  [ProductUnitType.BOX]: "Ud."
};

export function getProductUnitTypeLabel(unit: ProductUnitType): string {
  return ProductUnitTypeLabels[unit] || unit;
}

export function getProductUnitTypeAbbreviation(unit: ProductUnitType): string {
  return ProductUnitTypeAbbreviations[unit] || unit;
}

export function getProductUnitTypeLabelByQuantity(
  unit: ProductUnitType,
  quantity: number
): string {
  if (quantity === 1) {
    return getProductUnitTypeLabel(unit);
  }
  return ProductUnitTypeLabelsPlural[unit] || getProductUnitTypeLabel(unit);
}
