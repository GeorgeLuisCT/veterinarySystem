import { CatalogKey, catalogEnum, catalogLabels, catalogOptions } from "@/lib/catalogs";

/** Tipos de cuenta de tesorería: catálogo editable (Configuración → Catálogos). */
export const TreasuryAccountType = catalogEnum(CatalogKey.TreasuryAccountType, {
  BANK: { label: "Banco" },
  CASH: { label: "Efectivo" },
  DIGITAL: { label: "Digital" },
});
export type TreasuryAccountType = string;

export const TreasuryAccountTypeLabels = catalogLabels(CatalogKey.TreasuryAccountType);
export const TreasuryAccountTypeOptions = catalogOptions(CatalogKey.TreasuryAccountType);

export enum AccountMovementType {
  CASHBOX_CLOSING = "CASHBOX_CLOSING",
  SUPPLIER_PAYMENT = "SUPPLIER_PAYMENT",
  EXPENSE = "EXPENSE",
  TRANSFER = "TRANSFER",
  MANUAL_ENTRY = "MANUAL_ENTRY",
}

export const AccountMovementTypeLabels: Record<AccountMovementType, string> = {
  [AccountMovementType.CASHBOX_CLOSING]: "Cierre de Caja",
  [AccountMovementType.SUPPLIER_PAYMENT]: "Pago a Proveedor",
  [AccountMovementType.EXPENSE]: "Gasto",
  [AccountMovementType.TRANSFER]: "Transferencia",
  [AccountMovementType.MANUAL_ENTRY]: "Ingreso Manual",
};

export const AccountMovementTypeOptions = (
  Object.values(AccountMovementType) as AccountMovementType[]
).map((value) => ({
  value,
  label: AccountMovementTypeLabels[value],
}));