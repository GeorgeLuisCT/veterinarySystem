"use client";

import * as React from "react";
import VisitService from "../../services/visit-service";
import { FieldVisitStatus } from "../../enums/field-visit-status";
import type { FieldVisitSummaryResponse, FieldVisitListParams } from "../../types/visit-response";
import { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const statusClass = (status: FieldVisitStatus) =>
  cn(
    "rounded-full px-2 py-1 text-xs",
    status === FieldVisitStatus.IN_PROGRESS && "bg-yellow-100 text-yellow-800",
    status === FieldVisitStatus.PLANNED && "bg-blue-100 text-blue-700",
    status === FieldVisitStatus.COMPLETED && "bg-green-100 text-green-700",
    status === FieldVisitStatus.CANCELED && "bg-red-100 text-red-700"
  );

export default function PlannedVisitsTable() {
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [pageData, setPageData] = React.useState<import("@/types/paginated-response").PaginatedResponse<FieldVisitSummaryResponse> | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<FieldVisitStatus | undefined>(undefined);

  const columns = React.useMemo<ColumnDef<FieldVisitSummaryResponse>[]>(
    () => [
      {
        header: "Fecha",
        accessorKey: "scheduledDateTime",
        cell: ({ row }) => new Date(row.original.scheduledDateTime).toLocaleString(),
      },
      {
        header: "Destino",
        accessorKey: "farmName",
        cell: ({ row }) => row.original.farmName ?? row.original.zoneName ?? "—",
      },
      {
        header: "Veterinario",
        accessorKey: "fieldVetName",
        cell: ({ row }) => row.original.fieldVetName ?? "—",
      },
      {
        header: "Vehículo",
        accessorKey: "vehicleName",
        cell: ({ row }) => row.original.vehicleName ?? "—",
      },
      {
        id: "estado",
        header: "Estado",
        cell: ({ row }) => <span className={statusClass(row.original.status)}>{row.original.status}</span>,
      },
    ],
    []
  );

  const fetchPage = React.useCallback(async () => {
    setLoading(true);
    try {
      const params: FieldVisitListParams = { page: pageIndex, size: pageSize, status };
      const res = await VisitService.list(params);
      setPageData(res);
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, status]);

  React.useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  const headerLeft = (
    <div className="flex flex-wrap items-center gap-2">
      <select
        className="rounded-md border bg-background p-2 text-sm"
        value={status ?? ""}
        onChange={(e) => {
          const val = (e.target.value || undefined) as FieldVisitStatus | undefined;
          setStatus(val);
          setPageIndex(0);
        }}
      >
        <option value="">Todos los estados</option>
        {Object.values(FieldVisitStatus).map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );

  const headerRight = (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          setStatus(undefined);
          setPageIndex(0);
        }}
        disabled={loading}
      >
        Limpiar filtros
      </Button>
    </div>
  );

  return (
    <div className="h-full rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold leading-tight">Visitas planificadas</h3>
          <p className="text-sm text-muted-foreground">Revisa las visitas y su estado.</p>
        </div>
      </div>
      <DataTable<FieldVisitSummaryResponse>
        pageData={pageData}
        columns={columns}
        pageIndex={pageIndex}
        pageSize={pageSize}
        onPageIndexChange={setPageIndex}
        onPageSizeChange={setPageSize}
        loading={loading}
        headerSlotLeft={headerLeft}
        headerSlotRight={headerRight}
        getRowKey={(row) => row.id}
        searchPlaceholder="Buscar por destino…"
      />
    </div>
  );
}
