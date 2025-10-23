"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/components/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";
import { FieldVisitStatus } from "../enums/field-visit-status";
import VisitService from "../services/visit-service";
import type { FieldVisitResponse, FieldVisitSummaryResponse } from "../types/visit-response";
import { UpdateVisitRequest } from "../types/visit-request";
import { FloatingLabelInput } from "@/components/floating-label-input";

type Filters = {
  status?: FieldVisitStatus;
  vetId?: number;
  vehicleId?: number;
};

export default function FieldworkVisitsPage() {
  const { toast } = useToast();
  const [pageData, setPageData] = useState<import("@/types/paginated-response").PaginatedResponse<FieldVisitSummaryResponse> | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Filters>({});

  const columns = useMemo<ColumnDef<FieldVisitSummaryResponse>[]>(() => [
    {
      accessorKey: "scheduledDateTime",
      header: "Fecha/Hora",
      cell: ({ row }) => new Date(row.original.scheduledDateTime).toLocaleString(),
    },
    {
      id: "target",
      header: "Destino",
      cell: ({ row }) => row.original.farmName ?? row.original.zoneName ?? "—",
    },
    {
      accessorKey: "fieldVetName",
      header: "Veterinario",
    },
    {
      accessorKey: "vehicleName",
      header: "Vehículo",
    },
    {
      accessorKey: "status",
      header: "Estado",
    },
  ], []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await VisitService.list({
        page: pageIndex,
        size: pageSize,
        q: searchQuery || undefined,
        status: filters.status,
        vetId: filters.vetId,
        vehicleId: filters.vehicleId,
      });
      setPageData(resp);
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: getAaxiosErrorMessage(e) ?? "No se pudieron cargar las visitas." });
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, searchQuery, filters, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onSearch = (q: string) => { setSearchQuery(q); setPageIndex(0); };

  const navigateToDetail = useCallback((visit: FieldVisitSummaryResponse) => {
    window.location.href = `/dashboard/fieldwork/visits/${visit.id}`;
  }, []);

  const updateVisitStatus = useCallback(async (visitId: number, nextStatus: FieldVisitStatus) => {
    try {
      const detail = await VisitService.get(visitId);
      const payload: UpdateVisitRequest = mapVisitDetailToUpdate(detail, nextStatus);
      await VisitService.update(visitId, payload);
      toast({ title: "Visita actualizada", description: `La visita cambió a estado ${nextStatus}.` });
      fetchData();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: getAaxiosErrorMessage(error) ?? "No se pudo actualizar la visita." });
    }
  }, [fetchData, toast]);

  const actions = useMemo(() => [
    {
      label: "Iniciar visita",
      type: "direct" as const,
      onClick: (row: FieldVisitSummaryResponse) => updateVisitStatus(row.id, FieldVisitStatus.IN_PROGRESS),
      visible: (row: FieldVisitSummaryResponse) => row.status === FieldVisitStatus.PLANNED,
    },
    {
      label: "Finalizar visita",
      onClick: (row: FieldVisitSummaryResponse) => updateVisitStatus(row.id, FieldVisitStatus.COMPLETED),
      visible: (row: FieldVisitSummaryResponse) => row.status === FieldVisitStatus.IN_PROGRESS,
    },
    {
      label: "Ver detalle",
      onClick: (row: FieldVisitSummaryResponse) => navigateToDetail(row),
      visible: () => true,
    },
  ], [updateVisitStatus, navigateToDetail]);

  const headerRight = (
    <div className="flex flex-wrap items-center gap-3">
      <select
        className="rounded-md border bg-background p-2 text-sm"
        value={filters.status ?? ""}
        onChange={(event) => { setFilters((prev) => ({ ...prev, status: (event.target.value || undefined) as FieldVisitStatus | undefined })); setPageIndex(0); }}
      >
        <option value="">Todos</option>
        {Object.values(FieldVisitStatus).map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
      <FloatingLabelInput
        id="filterVet"
        label="ID Veterinario"
        value={filters.vetId ? String(filters.vetId) : ""}
        onChange={(value) => {
          const parsed = value ? Number(value) : undefined;
          setFilters((prev) => ({ ...prev, vetId: Number.isFinite(parsed) ? parsed : undefined }));
          setPageIndex(0);
        }}
      />
      <FloatingLabelInput
        id="filterVehicle"
        label="ID Vehículo"
        value={filters.vehicleId ? String(filters.vehicleId) : ""}
        onChange={(value) => {
          const parsed = value ? Number(value) : undefined;
          setFilters((prev) => ({ ...prev, vehicleId: Number.isFinite(parsed) ? parsed : undefined }));
          setPageIndex(0);
        }}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setFilters({});
          setSearchQuery("");
          setPageIndex(0);
        }}
      >
        Limpiar filtros
      </Button>
    </div>
  );

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <CardTitle>Visitas de campo</CardTitle>
          <CardDescription>Visualiza las visitas programadas y su progreso.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable<FieldVisitSummaryResponse>
          pageData={pageData}
          columns={columns}
          actions={actions}
          loading={loading}
          onSearch={onSearch}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPageIndexChange={setPageIndex}
          onPageSizeChange={setPageSize}
          getRowKey={(row) => row.id}
          headerSlotRight={headerRight}
          searchPlaceholder="Buscar por finca, zona u objetivo…"
          onRowClick={navigateToDetail}
        />
      </CardContent>
    </Card>
  );
}

function mapVisitDetailToUpdate(detail: FieldVisitResponse, status: FieldVisitStatus): UpdateVisitRequest {
  return {
    farmId: detail.farmId ?? undefined,
    zoneId: detail.zoneId ?? undefined,
    fieldVetId: detail.fieldVetId ?? 0,
    vehicleId: detail.vehicleId ?? undefined,
    companionIds: detail.companions?.map((c) => c.employeeId) ?? [],
    scheduledDateTime: detail.scheduledDateTime,
    objective: detail.objective ?? undefined,
    status,
    routeOrder: undefined,
  };
}
