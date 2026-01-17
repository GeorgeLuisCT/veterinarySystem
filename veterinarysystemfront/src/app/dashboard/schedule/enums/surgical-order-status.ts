export enum SurgicalOrderStatus {
  PENDING = "PENDING",
  SCHEDULED = "SCHEDULED",
  COMPLETED = "COMPLETED",
  CANCELED = "CANCELED",
}

export const SurgicalOrderStatusLabels: Record<SurgicalOrderStatus, string> = {
  [SurgicalOrderStatus.PENDING]: "Pendiente",
  [SurgicalOrderStatus.SCHEDULED]: "Programada",
  [SurgicalOrderStatus.COMPLETED]: "Completada",
  [SurgicalOrderStatus.CANCELED]: "Cancelada",
};

export const SurgicalOrderStatusOptions = (Object.values(SurgicalOrderStatus) as SurgicalOrderStatus[]).map(
  (value) => ({
    value,
    label: SurgicalOrderStatusLabels[value],
  })
);

