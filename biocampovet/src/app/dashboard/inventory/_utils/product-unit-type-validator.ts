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

// --- INICIO DE CAMBIOS ---

// Definir qué unidades se consideran 'fraccionables'
const FRACIONABLE_UNITS = [
  ProductUnitType.GRAM,
  ProductUnitType.MILLIGRAM,
  ProductUnitType.MICROGRAM,
  ProductUnitType.MILLILITER,
];

// Helper para saber si una unidad es fraccionable
export function isFracionableUnit(unitType: ProductUnitType): boolean {
  return FRACIONABLE_UNITS.includes(unitType);
}

// --- FIN DE CAMBIOS ---


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
  baseUnitType: ProductUnitType | null,
  currentModes: { unitType: ProductUnitType }[],
  mainUnitType: ProductUnitType | null
): ProductUnitType | null {
  if (!baseUnitType) return null;

  const alreadyUsed = new Set(currentModes.map((m) => m.unitType));
  if (baseUnitType) alreadyUsed.add(baseUnitType);
  if (mainUnitType) alreadyUsed.add(mainUnitType);

  const availableModes = getAllowedVariants(baseUnitType).filter(
    (mode) => !alreadyUsed.has(mode)
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
  baseUnitType: ProductUnitType | null,
  saleModes: { unitType: ProductUnitType }[],
  currentIndex: number,
  mainUnitType: ProductUnitType | null
): ProductUnitType[] {
  if (!baseUnitType) return [];

  const alreadyUsed = new Set(
    saleModes
      .filter((_, i) => i !== currentIndex)
      .map((m) => m.unitType)
  );
  
  if (baseUnitType) alreadyUsed.add(baseUnitType);
  if (mainUnitType) alreadyUsed.add(mainUnitType);

  const currentModeUnit = saleModes[currentIndex]?.unitType;

  return getAllowedVariants(baseUnitType).filter(
    (mode) => mode === currentModeUnit || !alreadyUsed.has(mode)
  );
}