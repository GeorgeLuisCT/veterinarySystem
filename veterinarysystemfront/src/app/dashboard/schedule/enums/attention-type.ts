import { Stethoscope, Scissors, Syringe } from "lucide-react";
import React from "react";

export enum AttentionType {
  CLINIC = "CLINIC",
  GROOMING = "GROOMING",
  SURGERY = "SURGERY",
}

export const AttentionTypeLabels: Record<AttentionType, string> = {
  [AttentionType.CLINIC]: "Clínica",
  [AttentionType.GROOMING]: "Peluquería",
  [AttentionType.SURGERY]: "Cirugía",
};

export interface AttentionTypeDetailsType {
  label: string;
  icon: React.ElementType;
  colorClass: string;
}

export const AttentionTypeDetails: Record<AttentionType, AttentionTypeDetailsType> = {
  [AttentionType.CLINIC]: {
    label: "Clínica",
    icon: Stethoscope,
    colorClass: "bg-blue-500",
  },
  [AttentionType.GROOMING]: {
    label: "Peluquería",
    icon: Scissors,
    colorClass: "bg-pink-500",
  },
  [AttentionType.SURGERY]: {
    label: "Cirugía",
    icon: Syringe,
    colorClass: "bg-rose-500",
  },
};

export const AttentionTypeOptions = (Object.values(AttentionType) as AttentionType[]).map((value) => ({
  value,
  label: AttentionTypeLabels[value],
}));
export const AttentionTypeOptionsWithIcons = (
  Object.values(AttentionType) as AttentionType[]
).map((value) => ({
  value,
  label: AttentionTypeDetails[value].label,
  icon: AttentionTypeDetails[value].icon,
  colorClass: AttentionTypeDetails[value].colorClass,
}));
