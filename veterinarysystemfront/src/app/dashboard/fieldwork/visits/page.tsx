// app/dashboard/fieldwork/visits/page.tsx
"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";
import DashboardLayoutSection from "../../dashboard-layout-section";

import VisitService from "../services/visit-service";
import type { PaginatedResponse } from "@/types/paginated-response";
import type { FieldVisitResponse, FieldVisitSummaryResponse } from "../types/visit-response";
import { FieldVisitStatus } from "../enums/field-visit-status";
import { UpdateVisitRequest } from "../types/visit-request";

import VisitFilters, { VisitFilterValue } from "../components/visits/visit-filters";
import { useUser } from "@/context/user-context";
import { RefreshCcw } from "lucide-react";
import { PageContainer } from "@/components/page/page-container";
import { PageHeader } from "@/components/page/page-header";
import DataTable, { type Action } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { Home, MapPin, PlayCircle, CheckCircle2, Eye } from "lucide-react";
import { getFieldVisitStatusTone, FieldVisitStatusLabels } from "../enums/field-visit-status";

const formatLocalDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const formatLocalDateTime = (d: Date): string => {
  const yyyyMmDd = formatLocalDate(d);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${yyyyMmDd}T${hh}:${mm}`;
};

const startOfDay = (d: Date) => {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  return dt;
};

const endOfDay = (d: Date) => {
  const dt = new Date(d);
  dt.setHours(23, 59, 0, 0);
  return dt;
};

const parseLocalDate = (v?: string | null): Date | null => {
  if (!v) return null;
  const [yStr, mStr, dStr] = v.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);
  if (!y || !m || !d) return null;
  const dt = new Date();
  dt.setFullYear(y, m - 1, d);
  dt.setHours(0, 0, 0, 0);
  return dt;
};

export default function FieldworkVisitsPage() {
  const { toast } = useToast();
  const { userInfo } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const vetId = userInfo?.employeeId || undefined;

  const today = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [filters, setFilters] = React.useState<VisitFilterValue>(() => ({
    status: (searchParams.get("status") as FieldVisitStatus | "ALL") ?? "ALL",
    startDate: parseLocalDate(searchParams.get("startDate")) ?? today,
    endDate: parseLocalDate(searchParams.get("endDate")) ?? today,
    q: searchParams.get("q") ?? "",
  }));

  const [pageData, setPageData] =
    React.useState<PaginatedResponse<FieldVisitSummaryResponse> | null>(null);
  const [pageIndex, setPageIndex] = React.useState<number>(Number(searchParams.get("page") ?? 0));
  const [pageSize, setPageSize] = React.useState<number>(Number(searchParams.get("size") ?? 10));
  const [loading, setLoading] = React.useState(false);

  const syncUrl = React.useCallback(
    (nextFilters = filters, nextPageIndex = pageIndex, nextPageSize = pageSize) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.set("page", String(nextPageIndex));
      params.set("size", String(nextPageSize));

      if (nextFilters.status === "ALL") params.delete("status");
      else params.set("status", String(nextFilters.status));

      const s =
        nextFilters.startDate instanceof Date ? formatLocalDate(nextFilters.startDate) : undefined;
      const e =
        nextFilters.endDate instanceof Date ? formatLocalDate(nextFilters.endDate) : undefined;
      if (s) params.set("startDate", s);
      else params.delete("startDate");
      if (e) params.set("endDate", e);
      else params.delete("endDate");

      if (nextFilters.q?.trim()) params.set("q", nextFilters.q.trim());
      else params.delete("q");

      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [filters, pageIndex, pageSize, pathname, router, searchParams]
  );

  const fetchVisits = React.useCallback(async () => {
    setLoading(true);
    try {
      const start = filters.startDate instanceof Date ? startOfDay(filters.startDate) : today;
      const end = filters.endDate instanceof Date ? endOfDay(filters.endDate) : today;

      const response = await VisitService.list({
        page: pageIndex,
        size: pageSize,
        q: filters.q?.trim() || undefined,
        status: filters.status === "ALL" ? undefined : (filters.status as FieldVisitStatus),
        vetId,
        from: formatLocalDateTime(start),
        to: formatLocalDateTime(end),
      });
      setPageData(response);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: getAaxiosErrorMessage(error) ?? "No se pudieron cargar las visitas.",
      });
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, filters, vetId, toast, today]);

  React.useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  React.useEffect(() => {
    syncUrl();
  }, [filters, pageIndex, pageSize, syncUrl]);

  const handlePageSizeChange = React.useCallback((size: number) => {
    setPageSize(size);
    setPageIndex(0);
  }, []);

  const navigateToDetail = React.useCallback(
    (visit: FieldVisitSummaryResponse) => {
      router.push(`/dashboard/fieldwork/visits/${visit.id}`);
    },
    [router]
  );

  const mapVisitDetailToUpdate = React.useCallback(
    (detail: FieldVisitResponse, status: FieldVisitStatus): UpdateVisitRequest => ({
      farmId: detail.farmId ?? undefined,
      zoneId: detail.zoneId ?? undefined,
      fieldVetId: detail.fieldVetId ?? 0,
      vehicleId: detail.vehicleId ?? undefined,
      companionIds: detail.companions?.map((c) => c.employeeId) ?? [],
      scheduledDateTime: detail.scheduledDateTime,
      objective: detail.objective ?? undefined,
      status,
      routeOrder: undefined,
    }),
    []
  );

  const updateVisitStatus = React.useCallback(
    async (visitId: number, nextStatus: FieldVisitStatus) => {
      try {
        const detail = await VisitService.get(visitId);
        const payload: UpdateVisitRequest = mapVisitDetailToUpdate(detail, nextStatus);
        await VisitService.update(visitId, payload);
        toast({
          title: "Visita actualizada",
          description: `La visita cambió a estado ${nextStatus}.`,
        });
        fetchVisits();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: getAaxiosErrorMessage(error) ?? "No se pudo actualizar la visita.",
        });
      }
    },
    [fetchVisits, mapVisitDetailToUpdate, toast]
  );

  const [visitToComplete, setVisitToComplete] = React.useState<FieldVisitSummaryResponse | null>(
    null
  );

  const columns = React.useMemo<ColumnDef<FieldVisitSummaryResponse>[]>(
    () => [
      {
        id: "destination",
        header: "Destino",
        cell: ({ row }) => (
          <div className="flex min-w-40 items-center gap-2 py-2 font-medium">
            {row.original.farmName ? (
              <Home className="size-4 shrink-0 text-muted-foreground" />
            ) : (
              <MapPin className="size-4 shrink-0 text-muted-foreground" />
            )}
            <span className="truncate">
              {row.original.farmName ?? row.original.zoneName ?? "—"}
            </span>
          </div>
        ),
      },
      {
        id: "when",
        header: "Fecha y hora",
        cell: ({ row }) => {
          const dt = new Date(row.original.scheduledDateTime);
          return (
            <span className="whitespace-nowrap tabular-nums">
              {dt.toLocaleDateString()}{" "}
              {dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          );
        },
      },
      {
        id: "status",
        header: "Estado",
        cell: ({ row }) => (
          <Badge variant={getFieldVisitStatusTone(row.original.status)}>
            {FieldVisitStatusLabels[row.original.status]}
          </Badge>
        ),
      },
      { id: "vet", header: "Veterinario", cell: ({ row }) => row.original.fieldVetName ?? "—" },
      { id: "vehicle", header: "Vehículo", cell: ({ row }) => row.original.vehicleName ?? "—" },
      {
        id: "objective",
        header: "Objetivo",
        cell: ({ row }) => (
          <span className="line-clamp-1 max-w-64 text-muted-foreground">
            {row.original.objective ?? "—"}
          </span>
        ),
      },
    ],
    []
  );

  const actions = React.useMemo<Action<FieldVisitSummaryResponse>[]>(
    () => [
      {
        label: "Iniciar visita",
        type: "direct",
        icon: <PlayCircle className="size-4 text-primary" />,
        isVisible: (v) => v.status === FieldVisitStatus.PLANNED,
        onClick: (v) => updateVisitStatus(v.id, FieldVisitStatus.IN_PROGRESS),
      },
      {
        label: "Finalizar visita",
        type: "direct",
        icon: <CheckCircle2 className="size-4 text-success-strong" />,
        isVisible: (v) => v.status === FieldVisitStatus.IN_PROGRESS,
        onClick: (v) => setVisitToComplete(v),
      },
      {
        label: "Ver detalle",
        type: "direct",
        icon: <Eye className="size-4" />,
        onClick: navigateToDetail,
      },
    ],
    [navigateToDetail, updateVisitStatus]
  );

  return (
    <DashboardLayoutSection>
      <PageContainer>
        <PageHeader
          title="Visitas de campo"
          description="Visualiza y gestiona tus visitas programadas y en curso."
          actions={
            <>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => fetchVisits()} className="gap-2">
                  <RefreshCcw className="h-4 w-4" />
                  Actualizar
                </Button>
              </div>
            </>
          }
        />

        <DataTable<FieldVisitSummaryResponse>
          pageData={pageData}
          columns={columns}
          actions={actions}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPageIndexChange={(p) => setPageIndex(p)}
          onPageSizeChange={handlePageSizeChange}
          loading={loading}
          headerSlotLeft={
            <VisitFilters
              value={filters}
              onChange={(next) => {
                setFilters(next);
                setPageIndex(0);
              }}
            />
          }
          getRowKey={(visit) => visit.id}
          emptyState="No hay visitas para los filtros seleccionados."
          onRowClick={navigateToDetail}
        />

        <ConfirmationDialog
          open={visitToComplete !== null}
          onClose={() => setVisitToComplete(null)}
          title="¿Finalizar esta visita?"
          description={
            <>
              Se marcará como <strong>completada</strong> la visita a{" "}
              <strong>{visitToComplete?.farmName ?? visitToComplete?.zoneName ?? "—"}</strong>.
              Verifica que el reporte, los servicios y los insumos estén registrados.
            </>
          }
          confirmText="Finalizar visita"
          onConfirm={async () => {
            if (!visitToComplete) return;
            const id = visitToComplete.id;
            setVisitToComplete(null);
            await updateVisitStatus(id, FieldVisitStatus.COMPLETED);
          }}
        />
      </PageContainer>
    </DashboardLayoutSection>
  );
}
