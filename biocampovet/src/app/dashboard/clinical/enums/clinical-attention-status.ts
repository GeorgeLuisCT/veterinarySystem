export enum ClinicalAttentionStatus {
    OPEN = "OPEN",
    IN_PROGRESS = "IN_PROGRESS",
    WAITING_LAB = "WAITING_LAB",
    READY_TO_BILL = "READY_TO_BILL",
    CLOSED = "CLOSED",
    CANCELED = "CANCELED",
  }
  
  export const ClinicalAttentionStatusLabels: Record<ClinicalAttentionStatus, string> = {
    [ClinicalAttentionStatus.OPEN]: "Abierta",
    [ClinicalAttentionStatus.IN_PROGRESS]: "En progreso",
    [ClinicalAttentionStatus.WAITING_LAB]: "Esperando a laboratorio",
    [ClinicalAttentionStatus.READY_TO_BILL]: "Listo para facturar",
    [ClinicalAttentionStatus.CLOSED]: "Cerrada",
    [ClinicalAttentionStatus.CANCELED]: "Cancelada",
  };
  
  export const ClinicalAttentionStatusOptions = (
    Object.values(ClinicalAttentionStatus) as ClinicalAttentionStatus[]
  ).map((value) => ({
    value,
    label: ClinicalAttentionStatusLabels[value],
  }));
  