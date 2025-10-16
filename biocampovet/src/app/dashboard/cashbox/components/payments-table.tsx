"use client";

import { SimpleDataTable } from "@/components/simple-data-table";
import { FileText } from "lucide-react";

interface Payment {
  id: number;
  paymentType: string;
  method: string;
  amount: number;
  receivedBy: string;
  paidAt: string | null;
  notes?: string | null;
}

interface PaymentsTableProps {
  payments: Payment[];
}

const formatDate = (dateString: string | null) =>
  dateString ? new Date(dateString).toLocaleString() : "—";

export function PaymentsTable({ payments }: PaymentsTableProps) {
  return (
    <SimpleDataTable
      data={payments}
      emptyMessage="No hay pagos registrados."
      emptyIcon={<FileText className="h-12 w-12 mx-auto mb-4" />}
      columns={[
        { key: "id", header: "ID", cell: (p) => p.id },
        { key: "type", header: "Tipo", cell: (p) => p.paymentType },
        { key: "method", header: "Método", cell: (p) => p.method },
        { key: "amount", header: "Monto", cell: (p) => `S/ ${p.amount.toFixed(2)}` },
        { key: "paidAt", header: "Fecha Pago", cell: (p) => formatDate(p.paidAt) },
        { key: "notes", header: "Notas", cell: (p) => p.notes ?? "—" },
      ]}
    />
  );
}
