import { CatalogKey, catalogAbbreviations, catalogEnum, catalogLabels, catalogOptions } from "@/lib/catalogs";

/** Vías de administración: catálogo editable (Configuración → Catálogos). */
export const AdministrationRoute = catalogEnum(CatalogKey.AdministrationRoute, {
  INTRAMUSCULAR: { label: "Intramuscular", abbreviation: "IM" },
  INTRAVENOSA: { label: "Intravenosa", abbreviation: "IV" },
  SUBCUTANEA: { label: "Subcutánea", abbreviation: "SC" },
  ORAL: { label: "Oral", abbreviation: "PO" },
  TOPICA: { label: "Tópica", abbreviation: "TOP" },
  INHALATORIA: { label: "Inhalatoria", abbreviation: "INH" },
  INTRADERMICA: { label: "Intradérmica", abbreviation: "ID" },
  OFTALMICA: { label: "Oftálmica", abbreviation: "OFT" },
  OTICA: { label: "Ótica", abbreviation: "OTI" },
  NASAL: { label: "Nasal", abbreviation: "NAS" },
  RECTAL: { label: "Rectal", abbreviation: "REC" },
  VAGINAL: { label: "Vaginal", abbreviation: "VAG" },
  SUBLINGUAL: { label: "Sublingual", abbreviation: "SL" },
  BUCAL: { label: "Bucal", abbreviation: "BUC" },
});
export type AdministrationRoute = string;

export const AdministrationRouteLabels = catalogLabels(CatalogKey.AdministrationRoute);
export const AdministrationRouteAbbreviations = catalogAbbreviations(CatalogKey.AdministrationRoute);

export const AdministrationRouteOptions = catalogOptions(CatalogKey.AdministrationRoute, (i) => ({
  value: i.code,
  label: i.label,
  abbreviation: i.abbreviation ?? "",
}));
