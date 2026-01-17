import { Hourglass, Stethoscope, Workflow, CheckCircle } from "lucide-react";
import React from "react";

export enum AttentionStatus {
  WAITING = "WAITING",
  IN_CONSULTATION = "IN_CONSULTATION",
  IN_PROGRESS = "IN_PROGRESS",
  FINISHED = "FINISHED",
}

export const AttentionStatusLabels: Record<AttentionStatus, string> = {
  [AttentionStatus.WAITING]: "En espera",
  [AttentionStatus.IN_CONSULTATION]: "En atención",
  [AttentionStatus.IN_PROGRESS]: "En progreso",
  [AttentionStatus.FINISHED]: "Finalizada",
};

export interface AttentionStatusDetailsType {
  label: string;
  icon: React.ElementType;
  colorClass: string;
}

export const AttentionStatusDetails: Record<AttentionStatus, AttentionStatusDetailsType> = {
  [AttentionStatus.WAITING]: {
    label: "En espera",
    icon: Hourglass,
    colorClass: "bg-amber-500",
  },
  [AttentionStatus.IN_CONSULTATION]: {
    label: "En atención",
    icon: Stethoscope,
    colorClass: "bg-blue-500",
  },
  [AttentionStatus.IN_PROGRESS]: {
    label: "En progreso",
    icon: Workflow,
    colorClass: "bg-violet-500",
  },
  [AttentionStatus.FINISHED]: {
    label: "Finalizada",
    icon: CheckCircle,
    colorClass: "bg-emerald-600",
  },
};

export const AttentionStatusOptions = (
  Object.values(AttentionStatus) as AttentionStatus[]
).map((value) => ({
  value,
  label: AttentionStatusLabels[value],
}));
