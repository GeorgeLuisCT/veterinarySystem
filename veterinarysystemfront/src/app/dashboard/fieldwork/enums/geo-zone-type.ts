import { CatalogKey, catalogEnum, catalogLabels, catalogOptions } from "@/lib/catalogs";

/** Tipos de zona: catálogo editable (Configuración → Catálogos). */
export const GeoZoneType = catalogEnum(CatalogKey.GeoZoneType, {
  COUNTRY: { label: "País" },
  REGION: { label: "Región" },
  PROVINCE: { label: "Provincia" },
  DISTRICT: { label: "Distrito" },
  SECTOR: { label: "Sector" },
  CUSTOM: { label: "Personalizado" },
});
export type GeoZoneType = string;

export const GeoZoneTypeLabels = catalogLabels(CatalogKey.GeoZoneType);
export const GeoZoneTypeOptions = catalogOptions(CatalogKey.GeoZoneType);
