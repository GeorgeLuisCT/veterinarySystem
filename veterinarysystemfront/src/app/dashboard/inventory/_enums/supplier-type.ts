import { CatalogKey, catalogEnum, catalogLabels, catalogOptions } from "@/lib/catalogs";

/** Tipos de proveedor: catálogo editable (Configuración → Catálogos). */
export const SupplierType = catalogEnum(CatalogKey.SupplierType, {
  NATURAL: { label: "Persona Natural" },
  JURIDICAL: { label: "Persona Jurídica" },
  COMPANY: { label: "Empresa" },
});
export type SupplierType = string;

export const SupplierTypeLabels = catalogLabels(CatalogKey.SupplierType);
export const SupplierTypeOptions = catalogOptions(CatalogKey.SupplierType);
