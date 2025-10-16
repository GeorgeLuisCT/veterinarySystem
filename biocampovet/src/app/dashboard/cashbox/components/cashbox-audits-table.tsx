"use client";

import { SimpleDataTable } from "@/components/simple-data-table";
import { CashBoxAuditResponse } from "../types/cashbox-audit-response";

interface AuditsTableProps {
  audits: CashBoxAuditResponse[];
}

const formatDate = (dateString: string | null) =>
  dateString ? new Date(dateString).toLocaleString() : "—";

export function CashboxAuditsTable({ audits }: AuditsTableProps) {
  return (
    <SimpleDataTable
      data={audits}
      emptyMessage="No hay Corte de caja registradas."
      columns={[
        { key: "id", header: "ID", cell: (a) => a.id },
        {
          key: "auditor",
          header: "Auditor",
          cell: (a) =>
            `${a.auditedBy.fullName}`,
        },
        { key: "auditedAt", header: "Fecha de Corte", cell: (a) => formatDate(a.auditedAt) },
        { key: "observations", header: "Observaciones", cell: (a) => a.observations ?? "—" },
      ]}
    />
  );
}
