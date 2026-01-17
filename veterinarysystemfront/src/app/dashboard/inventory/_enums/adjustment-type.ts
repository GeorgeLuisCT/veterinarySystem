export enum AdjustmentType {
  ENTRY = "ENTRY",
  EXIT = "EXIT",
}

export const AdjustmentTypeLabels: Record<AdjustmentType, string> = {
  [AdjustmentType.ENTRY]: "Entrada",
  [AdjustmentType.EXIT]: "Salida",
};
