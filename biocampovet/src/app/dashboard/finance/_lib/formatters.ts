import { AccountMovementType, TreasuryAccountType } from "../_enums/accounts-enums";

export const PEN = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", minimumFractionDigits: 2 });
export const DATE_TIME = new Intl.DateTimeFormat("es-PE", { dateStyle: "short", timeStyle: "short" });

export const accountBadges: Record<TreasuryAccountType, string> = {
  CASH: "bg-emerald-50 text-emerald-700",
  BANK: "bg-blue-50 text-blue-700",
  DIGITAL: "bg-purple-50 text-purple-700",
};
