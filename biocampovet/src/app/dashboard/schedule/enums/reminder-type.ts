export enum ReminderType {
  VACCINATION = "VACCINATION",
  DEWORMING = "DEWORMING",
  CHECKUP = "CHECKUP",
  LAB_TEST = "LAB_TEST",
  SURGERY_FOLLOWUP = "SURGERY_FOLLOWUP",
  MEDICATION_REFILL = "MEDICATION_REFILL",
  GROOMING = "GROOMING",
  DENTAL_CARE = "DENTAL_CARE",
  OTHER = "OTHER",
}

export const ReminderTypeLabels: Record<ReminderType, string> = {
  [ReminderType.VACCINATION]: "Vacunación",
  [ReminderType.DEWORMING]: "Desparasitación",
  [ReminderType.CHECKUP]: "Consulta de control",
  [ReminderType.LAB_TEST]: "Examen de laboratorio",
  [ReminderType.SURGERY_FOLLOWUP]: "Seguimiento post quirúrgico",
  [ReminderType.MEDICATION_REFILL]: "Reposición de medicación",
  [ReminderType.GROOMING]: "Grooming",
  [ReminderType.DENTAL_CARE]: "Cuidado dental",
  [ReminderType.OTHER]: "Otro",
};

export const ReminderTypeOptions = (Object.values(ReminderType) as ReminderType[]).map((value) => ({
  value,
  label: ReminderTypeLabels[value],
}));
