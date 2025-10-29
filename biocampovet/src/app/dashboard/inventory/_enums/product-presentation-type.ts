export enum ProductPresentationType {
  BOTTLE = "BOTTLE",
  BAG = "BAG",
  BOX = "BOX",
  JAR = "JAR",
  SACHET = "SACHET",
  BLISTER = "BLISTER",
  CAN = "CAN",
  TUBE = "TUBE",
  PACK = "PACK",
  AMPOULE = "AMPOULE",
  SYRINGE = "SYRINGE",
  GALLON = "GALLON",
  CASE = "CASE",
  ROLL = "ROLL",
  LOOSE = "LOOSE",
  NONE = "NONE",
}

export const ProductPresentationTypeLabels: Record<ProductPresentationType, string> = {
  [ProductPresentationType.BOTTLE]: "Botella",
  [ProductPresentationType.BAG]: "Bolsa",
  [ProductPresentationType.BOX]: "Caja",
  [ProductPresentationType.JAR]: "Frasco",
  [ProductPresentationType.SACHET]: "Sobre",
  [ProductPresentationType.BLISTER]: "Blíster",
  [ProductPresentationType.CAN]: "Lata",
  [ProductPresentationType.TUBE]: "Tubo",
  [ProductPresentationType.PACK]: "Paquete",
  [ProductPresentationType.AMPOULE]: "Ampolla",
  [ProductPresentationType.SYRINGE]: "Jeringa precargada",
  [ProductPresentationType.GALLON]: "Galón",
  [ProductPresentationType.CASE]: "Estuche",
  [ProductPresentationType.ROLL]: "Rollo",
  [ProductPresentationType.LOOSE]: "Suelto",
  [ProductPresentationType.NONE]: "Unidad",
};

export const ProductPresentationTypeLabelsPlural: Record<ProductPresentationType, string> = {
  [ProductPresentationType.BOTTLE]: "Botellas",
  [ProductPresentationType.BAG]: "Bolsas",
  [ProductPresentationType.BOX]: "Cajas",
  [ProductPresentationType.JAR]: "Frascos",
  [ProductPresentationType.SACHET]: "Sobres",
  [ProductPresentationType.BLISTER]: "Blísters",
  [ProductPresentationType.CAN]: "Latas",
  [ProductPresentationType.TUBE]: "Tubos",
  [ProductPresentationType.PACK]: "Paquetes",
  [ProductPresentationType.AMPOULE]: "Ampollas",
  [ProductPresentationType.SYRINGE]: "Jeringas precargadas",
  [ProductPresentationType.GALLON]: "Galones",
  [ProductPresentationType.CASE]: "Estuches",
  [ProductPresentationType.ROLL]: "Rollos",
  [ProductPresentationType.LOOSE]: "Sueltos",
  [ProductPresentationType.NONE]: "Unidades",
};

export function getProductPresentationTypeLabel(presentation: ProductPresentationType): string {
  return ProductPresentationTypeLabels[presentation] || presentation;
}

export function getProductPresentationTypeLabelPlural(presentation: ProductPresentationType): string {
  return ProductPresentationTypeLabelsPlural[presentation] || ProductPresentationTypeLabels[presentation] || presentation;
}

export function getProductPresentationTypeLabelByQuantity(
  presentation: ProductPresentationType,
  quantity: number
): string {
  if (quantity === 1) {
    return getProductPresentationTypeLabel(presentation);
  }
  return getProductPresentationTypeLabelPlural(presentation);
}
