import { CatalogKey, catalogEnum, catalogLabels, catalogOptions } from "@/lib/catalogs";

/** Tamaños de jaula: catálogo editable (Configuración → Catálogos). */
export const CageSize = catalogEnum(CatalogKey.CageSize, {
  SMALL: { label: "Pequeña" },
  MEDIUM: { label: "Mediana" },
  LARGE: { label: "Grande" },
});
export type CageSize = string;

export const CageSizeLabels = catalogLabels(CatalogKey.CageSize);
export const CageSizeOptions = catalogOptions(CatalogKey.CageSize);
