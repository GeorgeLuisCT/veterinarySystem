// app/dashboard/finance/_components/accounts-payable-table.tsx
"use client";
import * as React from "react";
import DataTable from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import type { PaginatedResponse } from "@/types/paginated-response";
import { AccountPayableStatus, AccountPayableSummary } from "../_types/account-payable";

const PEN = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", minimumFractionDigits: 2 });
const DATE_TIME_FMT = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short" });

type Props = {
  pageData: PaginatedResponse<AccountPayableSummary> | null;
  loading: boolean;
  pageIndex: number;
  pageSize: number;
  onPageIndexChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
  onRowClick: (row: AccountPayableSummary) => void;
};

export default function AccountsPayableTable({
  pageData,
  loading,
  pageIndex,
  pageSize,
  onPageIndexChange,
  onPageSizeChange,
  onRowClick,
}: Props) {
  const columns = React.useMemo<ColumnDef<AccountPayableSummary>[]>(
    () => [
      {
        accessorKey: "description",
        header: "Descripción",
        cell: ({ row }) => {
          const it = row.original;
          return (
            <div>
              <div className="font-medium">{it.description}</div>
              <div className="text-xs text-muted-foreground">
                {it.supplierName || ""}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "issueDateTime",
        header: "Emisión",
        cell: ({ row }) => (
          <div className="text-sm">
            {DATE_TIME_FMT.format(new Date(row.original.issueDateTime))}
          </div>
        ),
      },
      {
        accessorKey: "totalAmount",
        header: "Total",
        cell: ({ row }) => <div className="text-right">{PEN.format(row.original.totalAmount)}</div>,
      },
      {
        accessorKey: "amountPaid",
        header: "Pagado",
        cell: ({ row }) => <div className="text-right">{PEN.format(row.original.amountPaid)}</div>,
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => {
          const s = row.original.status;
          const variant =
            s === AccountPayableStatus.PAID ? "default" : s === AccountPayableStatus.PARTIALLY_PAID ? "secondary" : "outline";
          const label = s === AccountPayableStatus.PAID ? "Pagada" : s === AccountPayableStatus.PARTIALLY_PAID ? "Parcial" : "Pendiente";
          return <Badge variant={variant as any}>{label}</Badge>;
        },
      },
    ],
    []
  );

  return (
    <DataTable<AccountPayableSummary>
      pageData={pageData}
      columns={columns}
      actions={[]}
      pageIndex={pageIndex}
      pageSize={pageSize}
      onPageIndexChange={onPageIndexChange}
      onPageSizeChange={onPageSizeChange}
      loading={loading}
      onRowClick={(row) => onRowClick(row)}
    />
  );
}
