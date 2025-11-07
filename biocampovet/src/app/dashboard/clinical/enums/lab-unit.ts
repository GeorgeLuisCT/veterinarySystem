// lab-unit.ts

export enum LabUnit {
  NONE = "NONE",
  PERCENT = "PERCENT",
  G_PER_DL = "G_PER_DL",
  MG_PER_DL = "MG_PER_DL",
  UG_PER_DL = "UG_PER_DL",
  NG_PER_ML = "NG_PER_ML",
  MMOL_PER_L = "MMOL_PER_L",
  MOL_PER_L = "MOL_PER_L",
  U_PER_L = "U_PER_L",
  IU_PER_L = "IU_PER_L",
  K_U_PER_L = "K_U_PER_L",
  X10_3_PER_UL = "X10_3_PER_UL",
  X10_6_PER_UL = "X10_6_PER_UL",
  CELLS_PER_UL = "CELLS_PER_UL",
  PLATELETS_PER_UL = "PLATELETS_PER_UL",
  FL = "FL",
  PG = "PG",
  G_PER_L = "G_PER_L",
  MG_PER_L = "MG_PER_L",
  UMOL_PER_L = "UMOL_PER_L",
  MS = "MS",
  SEC = "SEC",
  MIN = "MIN",
}

// Etiquetas legibles (ES)
export const LabUnitLabels: Record<LabUnit, string> = {
  [LabUnit.NONE]: "—",
  [LabUnit.PERCENT]: "Porcentaje",
  [LabUnit.G_PER_DL]: "Gramo por decilitro",
  [LabUnit.MG_PER_DL]: "Miligramo por decilitro",
  [LabUnit.UG_PER_DL]: "Microgramo por decilitro",
  [LabUnit.NG_PER_ML]: "Nanogramo por mililitro",
  [LabUnit.MMOL_PER_L]: "Milimol por litro",
  [LabUnit.MOL_PER_L]: "Mol por litro",
  [LabUnit.U_PER_L]: "Unidades por litro",
  [LabUnit.IU_PER_L]: "Unidades internacionales por litro",
  [LabUnit.K_U_PER_L]: "Kilo-unidades por litro",
  [LabUnit.X10_3_PER_UL]: "×10³ por microlitro",
  [LabUnit.X10_6_PER_UL]: "×10⁶ por microlitro",
  [LabUnit.CELLS_PER_UL]: "Células por microlitro",
  [LabUnit.PLATELETS_PER_UL]: "Plaquetas por microlitro",
  [LabUnit.FL]: "Femtolitro",
  [LabUnit.PG]: "Picogramo",
  [LabUnit.G_PER_L]: "Gramo por litro",
  [LabUnit.MG_PER_L]: "Miligramo por litro",
  [LabUnit.UMOL_PER_L]: "Micromol por litro",
  [LabUnit.MS]: "Milisegundo",
  [LabUnit.SEC]: "Segundo",
  [LabUnit.MIN]: "Minuto",
};

// Símbolos/abreviaturas (tal cual en tu backend)
export const LabUnitSymbols: Record<LabUnit, string> = {
  [LabUnit.NONE]: "",
  [LabUnit.PERCENT]: "%",
  [LabUnit.G_PER_DL]: "g/dL",
  [LabUnit.MG_PER_DL]: "mg/dL",
  [LabUnit.UG_PER_DL]: "µg/dL",
  [LabUnit.NG_PER_ML]: "ng/mL",
  [LabUnit.MMOL_PER_L]: "mmol/L",
  [LabUnit.MOL_PER_L]: "mol/L",
  [LabUnit.U_PER_L]: "U/L",
  [LabUnit.IU_PER_L]: "IU/L",
  [LabUnit.K_U_PER_L]: "kU/L",
  [LabUnit.X10_3_PER_UL]: "x10^3/µL",
  [LabUnit.X10_6_PER_UL]: "x10^6/µL",
  [LabUnit.CELLS_PER_UL]: "cél/µL",
  [LabUnit.PLATELETS_PER_UL]: "plt/µL",
  [LabUnit.FL]: "fL",
  [LabUnit.PG]: "pg",
  [LabUnit.G_PER_L]: "g/L",
  [LabUnit.MG_PER_L]: "mg/L",
  [LabUnit.UMOL_PER_L]: "µmol/L",
  [LabUnit.MS]: "ms",
  [LabUnit.SEC]: "s",
  [LabUnit.MIN]: "min",
};

// Helpers similares a los de ProductUnitType
export function getLabUnitLabel(unit: LabUnit): string {
  return LabUnitLabels[unit] ?? unit;
}

export function getLabUnitSymbol(unit: LabUnit): string {
  return LabUnitSymbols[unit] ?? "";
}

// Formateo rápido de valor + unidad (omite símbolo si NONE)
export function formatValueWithLabUnit(
  value: number | string,
  unit: LabUnit
): string {
  const sym = getLabUnitSymbol(unit);
  return sym ? `${value} ${sym}` : `${value}`;
}

// Opciones típicas para un <Select/>
export const LabUnitOptions = Object.values(LabUnit).map((u) => ({
  value: u,
  label: `${LabUnitLabels[u]}${LabUnitSymbols[u] ? ` (${LabUnitSymbols[u]})` : ""}`,
  symbol: LabUnitSymbols[u],
}));
