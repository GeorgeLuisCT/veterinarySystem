// ../enums/hospitalization-status.ts
export enum HospitalizationStatus {
  ADMITTED = "ADMITTED",
  IN_TREATMENT = "IN_TREATMENT",
  STABLE = "STABLE",
  OBSERVATION = "OBSERVATION",
  CRITICAL = "CRITICAL",
  DISCHARGED = "DISCHARGED",
  CANCELLED = "CANCELLED",
}

export const HospitalizationStatusLabels: Record<HospitalizationStatus, string> = {
  [HospitalizationStatus.ADMITTED]: "Admitido",
  [HospitalizationStatus.IN_TREATMENT]: "En tratamiento",
  [HospitalizationStatus.STABLE]: "Estable",
  [HospitalizationStatus.OBSERVATION]: "En observación",
  [HospitalizationStatus.CRITICAL]: "Crítico",
  [HospitalizationStatus.DISCHARGED]: "Alta",
  [HospitalizationStatus.CANCELLED]: "Cancelado",
};

export const HospitalizationStatusColors: Record<HospitalizationStatus, { color: string; text: string; bg: string }> = {
  [HospitalizationStatus.STABLE]: { color: "border-green-500", text: "text-green-700", bg: "bg-green-50" },
  [HospitalizationStatus.IN_TREATMENT]: { color: "border-blue-500", text: "text-blue-700", bg: "bg-blue-50" },
  [HospitalizationStatus.ADMITTED]: { color: "border-blue-500", text: "text-blue-700", bg: "bg-blue-50" },
  [HospitalizationStatus.OBSERVATION]: { color: "border-amber-500", text: "text-amber-700", bg: "bg-amber-50" },
  [HospitalizationStatus.CRITICAL]: { color: "border-red-500", text: "text-red-700", bg: "bg-red-50" },
  [HospitalizationStatus.DISCHARGED]: { color: "border-gray-500", text: "text-gray-700", bg: "bg-gray-50" },
  [HospitalizationStatus.CANCELLED]: { color: "border-gray-500", text: "text-gray-700", bg: "bg-gray-50" },
};

export const HospitalizationStatusOptions = Object.values(HospitalizationStatus).map((v) => ({
  value: v,
  label: HospitalizationStatusLabels[v],
}));
