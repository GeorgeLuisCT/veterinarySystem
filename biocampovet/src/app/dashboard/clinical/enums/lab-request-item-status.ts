import React from "react";
import {
  FilePlus,
  LoaderCircle,
  FlaskConical,
  BadgeCheck,
  XCircle,
} from "lucide-react";

export enum LabRequestItemStatus {
  REQUESTED = "REQUESTED",
  IN_PROGRESS = "IN_PROGRESS",
  WITH_RESULTS = "WITH_RESULTS",
  VERIFIED = "VERIFIED",
  CANCELLED = "CANCELLED",
}

export const LabRequestItemStatusLabels: Record<LabRequestItemStatus, string> = {
  [LabRequestItemStatus.REQUESTED]: "Solicitado",
  [LabRequestItemStatus.IN_PROGRESS]: "En proceso",
  [LabRequestItemStatus.WITH_RESULTS]: "Con resultados",
  [LabRequestItemStatus.VERIFIED]: "Verificado",
  [LabRequestItemStatus.CANCELLED]: "Cancelado",
};

export interface LabStatusDetails {
  label: string;
  icon: React.ElementType;
  /** Tailwind utility for background color (chips/badges) */
  bgClass: string;
  /** Tailwind utility for text color (chips/badges) */
  textClass: string;
  /** Optional Tailwind ring/border color */
  ringClass?: string;
}

export const LabRequestItemStatusDetails: Record<LabRequestItemStatus, LabStatusDetails> = {
  [LabRequestItemStatus.REQUESTED]: {
    label: "Solicitado",
    icon: FilePlus,
    bgClass: "bg-slate-100",
    textClass: "text-slate-700",
    ringClass: "ring-slate-200",
  },
  [LabRequestItemStatus.IN_PROGRESS]: {
    label: "En proceso",
    icon: LoaderCircle,
    bgClass: "bg-blue-100",
    textClass: "text-blue-700",
    ringClass: "ring-blue-200",
  },
  [LabRequestItemStatus.WITH_RESULTS]: {
    label: "Con resultados",
    icon: FlaskConical,
    bgClass: "bg-purple-100",
    textClass: "text-purple-700",
    ringClass: "ring-purple-200",
  },
  [LabRequestItemStatus.VERIFIED]: {
    label: "Verificado",
    icon: BadgeCheck,
    bgClass: "bg-green-100",
    textClass: "text-green-700",
    ringClass: "ring-green-200",
  },
  [LabRequestItemStatus.CANCELLED]: {
    label: "Cancelado",
    icon: XCircle,
    bgClass: "bg-rose-100",
    textClass: "text-rose-700",
    ringClass: "ring-rose-200",
  },
};

/** Para selects */
export const LabRequestItemStatusOptions = (
  Object.values(LabRequestItemStatus) as LabRequestItemStatus[]
).map((value) => ({
  value,
  label: LabRequestItemStatusLabels[value],
}));

/** Orden recomendado para listas/tableros */
export const LabRequestItemStatusOrder: LabRequestItemStatus[] = [
  LabRequestItemStatus.REQUESTED,
  LabRequestItemStatus.IN_PROGRESS,
  LabRequestItemStatus.WITH_RESULTS,
  LabRequestItemStatus.VERIFIED,
  LabRequestItemStatus.CANCELLED,
];

/** Helper opcional: props para un <Badge/> o chip */
export const getLabStatusBadgeClasses = (status: LabRequestItemStatus) => {
  const d = LabRequestItemStatusDetails[status];
  return `inline-flex items-center gap-1 rounded-2xl px-2.5 py-1 text-xs font-medium ${d.bgClass} ${d.textClass} ring-1 ${d.ringClass ?? "ring-transparent"}`;
};
