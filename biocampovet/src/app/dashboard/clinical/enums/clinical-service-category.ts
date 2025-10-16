export enum ClinicalServiceCategory {
  CONSULTATION = "CONSULTATION",
  VACCINATION = "VACCINATION",
  DEWORMING = "DEWORMING",
  SURGERY = "SURGERY",
  LABORATORY = "LABORATORY",
  GROOMING = "GROOMING",
}

export const ClinicalServiceCategoryLabels: Record<ClinicalServiceCategory, string> = {
  [ClinicalServiceCategory.CONSULTATION]: "Consulta",
  [ClinicalServiceCategory.VACCINATION]: "Vacunación",
  [ClinicalServiceCategory.DEWORMING]: "Desparasitación",
  [ClinicalServiceCategory.SURGERY]: "Cirugía",
  [ClinicalServiceCategory.LABORATORY]: "Laboratorio",
  [ClinicalServiceCategory.GROOMING]: "Peluquería",
};

export const ClinicalServiceCategoryOptions = (
  Object.values(ClinicalServiceCategory) as ClinicalServiceCategory[]
).map((value) => ({
  value,
  label: ClinicalServiceCategoryLabels[value],
}));
