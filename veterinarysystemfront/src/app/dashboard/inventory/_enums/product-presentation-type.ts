import { CatalogKey, catalogEnum, catalogLabels, catalogOptions, catalogPlurals } from "@/lib/catalogs";

/** Presentaciones de producto: catálogo editable (Configuración → Catálogos). */
export const ProductPresentationType = catalogEnum(CatalogKey.ProductPresentation, {
  BOTTLE: { label: "Botella", plural: "Botellas" },
  BAG: { label: "Bolsa", plural: "Bolsas" },
  BOX: { label: "Caja", plural: "Cajas" },
  JAR: { label: "Frasco", plural: "Frascos" },
  SACHET: { label: "Sobre", plural: "Sobres" },
  BLISTER: { label: "Blíster", plural: "Blísters" },
  CAN: { label: "Lata", plural: "Latas" },
  TUBE: { label: "Tubo", plural: "Tubos" },
  PACK: { label: "Paquete", plural: "Paquetes" },
  AMPOULE: { label: "Ampolla", plural: "Ampollas" },
  SYRINGE: { label: "Jeringa precargada", plural: "Jeringas precargadas" },
  GALLON: { label: "Galón", plural: "Galones" },
  CASE: { label: "Estuche", plural: "Estuches" },
  ROLL: { label: "Rollo", plural: "Rollos" },
  UNIT: { label: "Unidad", plural: "Unidades" },
});
export type ProductPresentationType = string;

export const ProductPresentationTypeLabels = catalogLabels(CatalogKey.ProductPresentation);
export const ProductPresentationTypeLabelsPlural = catalogPlurals(CatalogKey.ProductPresentation);
export const ProductPresentationTypeOptions = catalogOptions(CatalogKey.ProductPresentation);

export function getProductPresentationTypeLabel(presentation: ProductPresentationType): string {
  return ProductPresentationTypeLabels[presentation] || presentation;
}

export function getProductPresentationTypeLabelPlural(presentation: ProductPresentationType): string {
  return ProductPresentationTypeLabelsPlural[presentation] || ProductPresentationTypeLabels[presentation] || presentation;
}

export function getProductPresentationTypeLabelByQuantity(presentation: ProductPresentationType, quantity: number): string {
  return quantity === 1 ? getProductPresentationTypeLabel(presentation) : getProductPresentationTypeLabelPlural(presentation);
}
