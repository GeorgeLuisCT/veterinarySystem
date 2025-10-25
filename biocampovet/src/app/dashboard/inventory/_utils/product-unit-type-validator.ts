import { ProductUnitType } from "../_enums/product-unit-type";

export const ALLOWED_VARIANTS: Record<ProductUnitType, ProductUnitType[]> = {
  // MASA
  [ProductUnitType.KILOGRAM]: [
    ProductUnitType.KILOGRAM,
    ProductUnitType.GRAM,
    ProductUnitType.PACK,
    ProductUnitType.BOX
  ],
  [ProductUnitType.GRAM]: [
    ProductUnitType.GRAM,
    ProductUnitType.MILLIGRAM,
    ProductUnitType.PACK,
    ProductUnitType.BOX
  ],
  [ProductUnitType.MILLIGRAM]: [
    ProductUnitType.MILLIGRAM,
    ProductUnitType.MICROGRAM,
    ProductUnitType.BOX,
    ProductUnitType.PACK
  ],
  [ProductUnitType.MICROGRAM]: [
    ProductUnitType.MICROGRAM,
    ProductUnitType.BOX,
    ProductUnitType.PACK
  ],

  // LÍQUIDOS
  [ProductUnitType.LITER]: [
    ProductUnitType.LITER,
    ProductUnitType.MILLILITER,
    ProductUnitType.PACK,
    ProductUnitType.BOX
  ],
  [ProductUnitType.MILLILITER]: [
    ProductUnitType.MILLILITER,
    ProductUnitType.PACK,
    ProductUnitType.BOX
  ],

  // UNITARIOS
  [ProductUnitType.UNIT]: [
    ProductUnitType.UNIT,
    ProductUnitType.PACK,
    ProductUnitType.BOX
  ],

  // FORMAS FARMACÉUTICAS SÓLIDAS
  [ProductUnitType.CAPSULE]: [
    ProductUnitType.CAPSULE,
    ProductUnitType.PACK,
    ProductUnitType.BOX
  ],
  [ProductUnitType.TABLET]: [
    ProductUnitType.TABLET,
    ProductUnitType.PACK,
    ProductUnitType.BOX
  ],

  // PRESENTACIONES
  [ProductUnitType.PACK]: [
    ProductUnitType.PACK,
    ProductUnitType.BOX,
    ProductUnitType.UNIT
  ],
  [ProductUnitType.BOX]: [
    ProductUnitType.BOX,
    ProductUnitType.PACK,
    ProductUnitType.UNIT
  ]
};

export const UNIT_CONVERSION_FACTORS: Partial<
  Record<ProductUnitType, Partial<Record<ProductUnitType, number>>>
> = {
  [ProductUnitType.KILOGRAM]: {
    [ProductUnitType.GRAM]: 1000,
  },
  [ProductUnitType.GRAM]: {
    [ProductUnitType.MILLIGRAM]: 1000,
  },
  [ProductUnitType.MILLIGRAM]: {
    [ProductUnitType.MICROGRAM]: 1000,
  },
  [ProductUnitType.LITER]: {
    [ProductUnitType.MILLILITER]: 1000,
  },
};


export function isCompatibleProductUnit(
  original: ProductUnitType,
  variant: ProductUnitType
): boolean {
  return ALLOWED_VARIANTS[original]?.includes(variant) ?? false;
}

export function getAllowedVariants(unitType?: ProductUnitType): ProductUnitType[] {
  if (!unitType) return [];
  return ALLOWED_VARIANTS[unitType] ?? [];
}

export function getAllowedVariantsFiltered(original?: ProductUnitType): ProductUnitType[] {
  if (!original) return [];
  const variants = ALLOWED_VARIANTS[original] ?? [];
  return variants.filter((v) => v !== original);
}

export function getNextAvailableUnitType(
  unitType: ProductUnitType | null,
  currentModes: { unitType: ProductUnitType }[]
): ProductUnitType | null {
  if (!unitType) return null;

  const alreadyUsed = currentModes.map((m) => m.unitType);
  const availableModes = getAllowedVariants(unitType).filter(
    (mode) => !alreadyUsed.includes(mode)
  );

  return availableModes[0] ?? null;
}

export function isValidSaleQuantity(
  originalType: ProductUnitType,
  variantType: ProductUnitType,
  originalQuantity: number,
  variantQuantity: number
): boolean {
  if (originalType === variantType) {
    return variantQuantity <= originalQuantity;
  }

  const conversionFactor = UNIT_CONVERSION_FACTORS[originalType]?.[variantType];

  if (conversionFactor === undefined) {
    return true;
  }

  const convertedOriginal = originalQuantity * conversionFactor;
  return variantQuantity <= convertedOriginal;
}

export function getAvailableVariantsForIndex(
  unitType: ProductUnitType | null,
  saleModes: { unitType: ProductUnitType }[],
  currentIndex: number
): ProductUnitType[] {
  if (!unitType) return [];

  const alreadyUsed = saleModes
    .filter((_, i) => i !== currentIndex)
    .map((m) => m.unitType);

  return getAllowedVariants(unitType).filter(
    (mode) => !alreadyUsed.includes(mode)
  );
}


