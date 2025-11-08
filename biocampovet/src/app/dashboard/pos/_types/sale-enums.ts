export enum SaleStatus {
  DRAFT = "DRAFT",
  COMPLETED = "COMPLETED",
  VOIDED = "VOIDED",
}

export enum SalesDocumentType {
  BOLETA = "BOLETA",
  FACTURA = "FACTURA",
  NOTA_VENTA = "NOTA_VENTA",
  NONE = "NONE"
}

export enum SaleItemKind {
  PRODUCT = "PRODUCT",
  SERVICE = "SERVICE",
}

export enum BillableServiceType {
  CLINICAL_SERVICE_ITEM = "CLINICAL_SERVICE_ITEM",
  GROOMING_SESSION = "GROOMING_SESSION",
  SURGICAL_REPORT = "SURGICAL_REPORT",
  HOSPITALIZATION_CHARGE = "HOSPITALIZATION_CHARGE",
  LABORATORY_ITEM = "LABORATORY_ITEM",
  MEDICATION_ADMINISTRATION = "MEDICATION_ADMINISTRATION",
  OTHER_SERVICE = "OTHER_SERVICE",
}

export enum PaymentMethod {
  CASH = "CASH",
  CREDIT_CARD = "CREDIT_CARD",
  DEBIT_CARD = "DEBIT_CARD",
  YAPE = "YAPE",
  PLIN = "PLIN",
  BANK_TRANSFER = "BANK_TRANSFER",
  MOBILE_PAYMENT = "MOBILE_PAYMENT",
  CHECK = "CHECK",
  OTHER = "OTHER",
}

export const SaleStatusLabels: Record<SaleStatus, string> = {
  [SaleStatus.DRAFT]: "Borrador",
  [SaleStatus.COMPLETED]: "Completada",
  [SaleStatus.VOIDED]: "Anulada",
};

export const SaleStatusOptions = (Object.values(SaleStatus) as SaleStatus[]).map((value) => ({
  value,
  label: SaleStatusLabels[value],
}));

export const SalesDocumentTypeLabels: Record<SalesDocumentType, string> = {
  [SalesDocumentType.BOLETA]: "Boleta",
  [SalesDocumentType.FACTURA]: "Factura",
  [SalesDocumentType.NOTA_VENTA]: "Nota de venta",
  [SalesDocumentType.NONE]: "Sin documento",
};

export const SalesDocumentTypeOptions = (
  Object.values(SalesDocumentType) as SalesDocumentType[]
).map((value) => ({
  value,
  label: SalesDocumentTypeLabels[value],
}));

export const SaleItemKindLabels: Record<SaleItemKind, string> = {
  [SaleItemKind.PRODUCT]: "Producto",
  [SaleItemKind.SERVICE]: "Servicio",
};

export const SaleItemKindOptions = (
  Object.values(SaleItemKind) as SaleItemKind[]
).map((value) => ({
  value,
  label: SaleItemKindLabels[value],
}));

export const BillableServiceTypeLabels: Record<BillableServiceType, string> = {
  [BillableServiceType.CLINICAL_SERVICE_ITEM]: "Ítem clínico",
  [BillableServiceType.GROOMING_SESSION]: "Sesión de grooming",
  [BillableServiceType.SURGICAL_REPORT]: "Informe quirúrgico",
  [BillableServiceType.HOSPITALIZATION_CHARGE]: "Cargo por hospitalización",
  [BillableServiceType.LABORATORY_ITEM]: "Ítem de laboratorio",
  [BillableServiceType.MEDICATION_ADMINISTRATION]: "Administración de medicamento",
  [BillableServiceType.OTHER_SERVICE]: "Otro servicio",
};

export const BillableServiceTypeOptions = (
  Object.values(BillableServiceType) as BillableServiceType[]
).map((value) => ({
  value,
  label: BillableServiceTypeLabels[value],
}));

export const PaymentMethodLabels: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: "Efectivo",
  [PaymentMethod.CREDIT_CARD]: "Tarjeta de crédito",
  [PaymentMethod.DEBIT_CARD]: "Tarjeta de débito",
  [PaymentMethod.YAPE]: "Yape",
  [PaymentMethod.PLIN]: "Plin",
  [PaymentMethod.BANK_TRANSFER]: "Transferencia bancaria",
  [PaymentMethod.MOBILE_PAYMENT]: "Pago móvil",
  [PaymentMethod.CHECK]: "Cheque",
  [PaymentMethod.OTHER]: "Otro",
};

export const PaymentMethodOptions = (
  Object.values(PaymentMethod) as PaymentMethod[]
).map((value) => ({
  value,
  label: PaymentMethodLabels[value],
}));
