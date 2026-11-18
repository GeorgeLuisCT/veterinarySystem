import { CatalogKey, catalogEnum, catalogLabels, catalogOptions } from "@/lib/catalogs";

/** Categorías de registro médico: catálogo editable (Configuración → Catálogos). */
export const MedicalRecordCategory = catalogEnum(CatalogKey.MedicalRecordCategory, {
  CONSULTATION: { label: "Consulta" },
  SURGERY: { label: "Cirugía" },
  GROOMING: { label: "Peluquería" },
  VACCINATION: { label: "Vacunación" },
  LAB: { label: "Laboratorio" },
  NOTE: { label: "Nota clínica" },
  MED_ADMIN: { label: "Administración de medicamento" },
  WEIGHT: { label: "Peso" },
  ATTACHMENT: { label: "Adjunto" },
  STATUS_CHANGE: { label: "Cambio de estado" },
});
export type MedicalRecordCategory = string;

export const MedicalRecordCategoryLabels = catalogLabels(CatalogKey.MedicalRecordCategory);
export const MedicalRecordCategoryOptions = catalogOptions(CatalogKey.MedicalRecordCategory);

export const getMedicalRecordCategoryLabel = (value: MedicalRecordCategory) => MedicalRecordCategoryLabels[value];
