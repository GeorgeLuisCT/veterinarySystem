export enum LabRequestStatus {
    REQUESTED = "REQUESTED",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    CANCELED = "CANCELED",
  }
  
  export const LabRequestStatusLabels: Record<LabRequestStatus, string> = {
    [LabRequestStatus.REQUESTED]: "Solicitado",
    [LabRequestStatus.IN_PROGRESS]: "En progreso",
    [LabRequestStatus.COMPLETED]: "Completado",
    [LabRequestStatus.CANCELED]: "Cancelado",
  };
  
  export const LabRequestStatusOptions = (
    Object.values(LabRequestStatus) as LabRequestStatus[]
  ).map((value) => ({
    value,
    label: LabRequestStatusLabels[value],
  }));
  