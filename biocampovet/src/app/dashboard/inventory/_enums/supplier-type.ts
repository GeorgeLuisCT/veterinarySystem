export enum SupplierType {
  NATURAL = "NATURAL",
  JURIDICAL = "JURIDICAL",
  COMPANY = "COMPANY",
}

export const SupplierTypeLabels: Record<SupplierType, string> = {
  [SupplierType.NATURAL]: "Persona Natural",
  [SupplierType.JURIDICAL]: "Persona Jurídica",
  [SupplierType.COMPANY]: "Empresa",
};
