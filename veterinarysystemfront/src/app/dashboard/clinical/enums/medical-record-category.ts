export enum MedicalRecordCategory {
    CONSULTATION = "CONSULTATION",
    SURGERY = "SURGERY",
    GROOMING = "GROOMING",
    VACCINATION = "VACCINATION",
    LAB = "LAB",
    NOTE = "NOTE",
    MED_ADMIN = "MED_ADMIN",
    WEIGHT = "WEIGHT",
    ATTACHMENT = "ATTACHMENT",
    STATUS_CHANGE = "STATUS_CHANGE",
  }
  
  export const MedicalRecordCategoryLabels: Record<MedicalRecordCategory, string> = {
    [MedicalRecordCategory.CONSULTATION]: "Consulta",
    [MedicalRecordCategory.SURGERY]: "Cirugía",
    [MedicalRecordCategory.GROOMING]: "Peluquería",
    [MedicalRecordCategory.VACCINATION]: "Vacunación",
    [MedicalRecordCategory.LAB]: "Laboratorio",
    [MedicalRecordCategory.NOTE]: "Nota clínica",
    [MedicalRecordCategory.MED_ADMIN]: "Administración de medicamento",
    [MedicalRecordCategory.WEIGHT]: "Peso",
    [MedicalRecordCategory.ATTACHMENT]: "Adjunto",
    [MedicalRecordCategory.STATUS_CHANGE]: "Cambio de estado",
  };
  
  export const MedicalRecordCategoryOptions = (
    Object.values(MedicalRecordCategory) as MedicalRecordCategory[]
  ).map((value) => ({
    value,
    label: MedicalRecordCategoryLabels[value],
  }));
  
  // (opcional) helper por si lo usas en tablas
  export const getMedicalRecordCategoryLabel = (value: MedicalRecordCategory) =>
    MedicalRecordCategoryLabels[value];
  