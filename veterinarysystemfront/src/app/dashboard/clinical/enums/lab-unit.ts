import { CatalogKey, catalogAbbreviation, catalogAbbreviations, catalogEnum, catalogLabels, catalogOptions } from "@/lib/catalogs";

/** Unidades de laboratorio: catálogo editable (Configuración → Catálogos). El símbolo es la abreviatura del catálogo. */
export const LabUnit = catalogEnum(CatalogKey.LabUnit, {
  NONE: { label: "Sin unidad", abbreviation: "" },
  PERCENT: { label: "Porcentaje", abbreviation: "%" },
  G_PER_DL: { label: "Gramo por decilitro", abbreviation: "g/dL" },
  MG_PER_DL: { label: "Miligramo por decilitro", abbreviation: "mg/dL" },
  UG_PER_DL: { label: "Microgramo por decilitro", abbreviation: "µg/dL" },
  NG_PER_ML: { label: "Nanogramo por mililitro", abbreviation: "ng/mL" },
  MMOL_PER_L: { label: "Milimol por litro", abbreviation: "mmol/L" },
  MOL_PER_L: { label: "Mol por litro", abbreviation: "mol/L" },
  U_PER_L: { label: "Unidades por litro", abbreviation: "U/L" },
  IU_PER_L: { label: "Unidades internacionales por litro", abbreviation: "IU/L" },
  K_U_PER_L: { label: "Kilo-unidades por litro", abbreviation: "kU/L" },
  X10_3_PER_UL: { label: "×10³ por microlitro", abbreviation: "x10^3/µL" },
  X10_6_PER_UL: { label: "×10⁶ por microlitro", abbreviation: "x10^6/µL" },
  CELLS_PER_UL: { label: "Células por microlitro", abbreviation: "cél/µL" },
  PLATELETS_PER_UL: { label: "Plaquetas por microlitro", abbreviation: "plt/µL" },
  FL: { label: "Femtolitro", abbreviation: "fL" },
  PG: { label: "Picogramo", abbreviation: "pg" },
  G_PER_L: { label: "Gramo por litro", abbreviation: "g/L" },
  MG_PER_L: { label: "Miligramo por litro", abbreviation: "mg/L" },
  UMOL_PER_L: { label: "Micromol por litro", abbreviation: "µmol/L" },
  MS: { label: "Milisegundo", abbreviation: "ms" },
  SEC: { label: "Segundo", abbreviation: "s" },
  MIN: { label: "Minuto", abbreviation: "min" },
});
export type LabUnit = string;

export const LabUnitLabels = catalogLabels(CatalogKey.LabUnit);
export const LabUnitSymbols = catalogAbbreviations(CatalogKey.LabUnit);

export function getLabUnitLabel(unit: LabUnit): string {
  return LabUnitLabels[unit] ?? unit;
}

export function getLabUnitSymbol(unit: LabUnit): string {
  return catalogAbbreviation(CatalogKey.LabUnit, unit);
}

/** Valor + símbolo de la unidad (sin símbolo si la unidad no tiene). */
export function formatValueWithLabUnit(value: number | string, unit: LabUnit): string {
  const sym = getLabUnitSymbol(unit);
  return sym ? `${value} ${sym}` : `${value}`;
}

/** Opciones para un selector: «Nombre (símbolo)». */
export const LabUnitOptions = catalogOptions(CatalogKey.LabUnit, (i) => ({
  value: i.code,
  label: `${i.label}${i.abbreviation ? ` (${i.abbreviation})` : ""}`,
  symbol: i.abbreviation ?? "",
}));
