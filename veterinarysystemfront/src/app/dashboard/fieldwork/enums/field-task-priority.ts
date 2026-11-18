import { CatalogKey, catalogEnum, catalogLabels, catalogOptions } from "@/lib/catalogs";

/** Prioridades de tarea: catálogo editable (Configuración → Catálogos), de menor a mayor. */
export const FieldTaskPriority = catalogEnum(CatalogKey.FieldTaskPriority, {
  LOW: { label: "Baja" },
  MEDIUM: { label: "Media" },
  HIGH: { label: "Alta" },
  URGENT: { label: "Urgente" },
});
export type FieldTaskPriority = string;

export const FieldTaskPriorityLabels = catalogLabels(CatalogKey.FieldTaskPriority);
export const FieldTaskPriorityOptions = catalogOptions(CatalogKey.FieldTaskPriority);
