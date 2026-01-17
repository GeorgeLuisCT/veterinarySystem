export enum TreasuryAccountType {
  BANK = "BANK",
  CASH = "CASH",
  DIGITAL = "DIGITAL",
}

export const TreasuryAccountTypeLabels: Record<TreasuryAccountType, string> = {
  [TreasuryAccountType.BANK]: "Banco",
  [TreasuryAccountType.CASH]: "Efectivo",
  [TreasuryAccountType.DIGITAL]: "Digital",
};

export const TreasuryAccountTypeOptions = (
  Object.values(TreasuryAccountType) as TreasuryAccountType[]
).map((value) => ({
  value,
  label: TreasuryAccountTypeLabels[value],
}));

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