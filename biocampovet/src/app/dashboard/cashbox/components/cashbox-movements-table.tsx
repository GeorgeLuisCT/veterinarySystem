"use client";

import { SimpleDataTable } from "@/components/simple-data-table";
import { CashboxMovementReasonLabels } from "../enums/cashbox-movement-reason";
import { CashboxMovementResponse } from "../types/cashbox-movement-response";

interface MovementsTableProps {
  movements: CashboxMovementResponse[];
}

const formatDate = (dateString: string | null) =>
  dateString ? new Date(dateString).toLocaleString() : "—";

export function CashBoxMovementsTable({ movements }: MovementsTableProps) {
  return (
    <SimpleDataTable
      data={movements}
      emptyMessage="No hay movimientos registrados."
      columns={[
        { key: "id", header: "ID", cell: (m) => <span className="font-medium">{m.id}</span> },
        { key: "reason", header: "Razón", cell: (m) => CashboxMovementReasonLabels[m.reason] },
        { key: "amount", header: "Monto", cell: (m) => <span className="font-medium">S/ {m.amount.toFixed(2)}</span> },
        { key: "registeredAt", header: "Fecha Registro", cell: (m) => formatDate(m.registeredAt) },
        { key: "description", header: "Descripción", cell: (m) => m.description ?? "—" },
        { key: "documentReference", header: "Ref. Doc.", cell: (m) => m.documentReference ?? "—" },
        { key: "operationNumber", header: "No. Operación", cell: (m) => m.operationNumber ?? "—" },
        { key: "notes", header: "Notas", cell: (m) => m.notes ?? "—" },
      ]}
    />
  );
}
