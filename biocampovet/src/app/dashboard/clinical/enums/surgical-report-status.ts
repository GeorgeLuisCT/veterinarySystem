export enum SurgicalReportStatus {
  DRAFT = "DRAFT",
  IN_PROGRESS = "IN_PROGRESS",
  READY_TO_BILL = "READY_TO_BILL",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export const SurgicalReportStatusLabels: Record<SurgicalReportStatus, string> = {
  [SurgicalReportStatus.DRAFT]: "Borrador",
  [SurgicalReportStatus.IN_PROGRESS]: "En progreso",
  [SurgicalReportStatus.READY_TO_BILL]: "Listo para facturar",
  [SurgicalReportStatus.COMPLETED]: "Completado",
  [SurgicalReportStatus.CANCELLED]: "Cancelado",
};

export const SurgicalReportStatusOptions = (
  Object.values(SurgicalReportStatus) as SurgicalReportStatus[]
).map((value) => ({
  value,
  label: SurgicalReportStatusLabels[value],
}));
