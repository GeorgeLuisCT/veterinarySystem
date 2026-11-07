"use client";

import * as React from "react";
import VisitService from "../../services/visit-service";
import { FieldVisitStatus } from "../../enums/field-visit-status";
import type { FieldVisitSummaryResponse, FieldVisitListParams } from "../../types/visit-response";
import type { PaginatedResponse } from "@/types/paginated-response";
import { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CalendarClock, Home, Truck, Filter, MapPin, Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FieldVisitStatusLabels: Record<FieldVisitStatus, string> = {
  PLANNED: "Planificada",
  IN_PROGRESS: "En progreso",
  COMPLETED: "Completada",
  CANCELED: "Cancelada",
};

const statusBadgeClass = (status: FieldVisitStatus) =>
  cn(
    "rounded-full px-2 py-1 text-xs",
    status === FieldVisitStatus.IN_PROGRESS && "bg-warning-soft text-warning-strong",
    status === FieldVisitStatus.PLANNED && "bg-info-soft text-info-strong",
    status === FieldVisitStatus.COMPLETED && "bg-success-soft text-success-strong",
    status === FieldVisitStatus.CANCELED && "bg-danger-soft text-danger-strong"
  );

const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");
}

export default function PlannedVisitsTable() {
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [pageData, setPageData] = React.useState<PaginatedResponse<FieldVisitSummaryResponse> | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<FieldVisitStatus | undefined>(undefined);

  const columns = React.useMemo<ColumnDef<FieldVisitSummaryResponse>[]>(
    () => [
      {
        id: "visit",
        header: "Visita",
        cell: ({ row }) => {
          const v = row.original;
          const dest = v.farmName ?? v.zoneName ?? "—";
          return (
            <div className="flex items-start gap-3 p-2">
              <div className="mt-0.5 rounded-md bg-muted p-1">
                <Home className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold leading-none truncate max-w-[30ch]" title={dest}>
                    {dest}
                  </span>
                  {v.zoneName && (
                    <Badge variant="secondary" className="rounded-full text-xs">
                      <MapPin className="mr-1 size-3" /> {v.zoneName}
                    </Badge>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarClock className="size-4 shrink-0" />
                  <span className="truncate" title={fmtDate(v.scheduledDateTime)}>
                    {fmtDate(v.scheduledDateTime)}
                  </span>
                </div>
              </div>
            </div>
          );
        },
      },
      {
        header: "Estado",
        id: "status",
        accessorFn: (row) => row.status,
        cell: ({ row }) => {
          const s = row.original.status;
          return <span className={statusBadgeClass(s)}>{FieldVisitStatusLabels[s]}</span>;
        },
      },
      {
        header: "Veterinario",
        accessorKey: "fieldVetName",
        cell: ({ row }) => {
          const name = row.original.fieldVetName ?? "—";
          return (
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="size-6">
                <AvatarFallback className="text-[10px]">{initials(name)}</AvatarFallback>
              </Avatar>
              <span className="truncate">{name}</span>
            </div>
          );
        },
      },
      {
        header: "Vehículo",
        accessorKey: "vehicleName",
        cell: ({ row }) => (
          <Badge variant="outline" className="rounded-full text-xs">
            <Truck className="mr-1 size-3" /> {row.original.vehicleName ?? "—"}
          </Badge>
        ),
      },
      {
        id: "companions",
        header: "Compañía",
        cell: ({ row }) => {
          const companions = row.original.companions ?? [];
          const count = companions.length;
          const toShow = companions.slice(0, 3);
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <div className="-space-x-2 flex">
                      {toShow.map((c) => (
                        <Avatar key={c.employeeId} className="size-6 ring-2 ring-background">
                          <AvatarFallback className="text-[10px]">
                            {initials(c.employeeName)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <Badge variant="secondary" className="rounded-full text-xs">
                      <Users className="mr-1 size-3" /> {count}
                    </Badge>
                  </div>
                </TooltipTrigger>
                {count > 0 && (
                  <TooltipContent>
                    <p className="max-w-[36ch] text-xs">
                      {companions.map((c) => c.employeeName ?? "—").join(", ")}
                    </p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          );
        },
      },
      {
        header: "Objetivo",
        accessorKey: "objective",
        cell: ({ row }) => {
          const text = row.original.objective ?? "—";
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="line-clamp-1 max-w-[34ch] text-muted-foreground" title={text}>
                    {text}
                  </span>
                </TooltipTrigger>
                {text !== "—" && (
                  <TooltipContent>
                    <p className="max-w-[44ch] text-xs">{text}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          );
        },
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
    <div className="mb-0">
      <h3 className="text-base font-semibold leading-tight">Visitas planificadas</h3>
      <p className="text-sm text-muted-foreground">Revisa las visitas, zonas y su estado.</p>
    </div>
  );

  const headerRight = (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        <Filter className="size-4 text-muted-foreground" />
        <Select
          value={status ?? "ALL"}
          onValueChange={(val) => {
            const next = val === "ALL" ? undefined : (val as FieldVisitStatus);
            setStatus(next);
            setPageIndex(0);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los estados</SelectItem>
            <SelectItem value={FieldVisitStatus.PLANNED}>{FieldVisitStatusLabels.PLANNED}</SelectItem>
            <SelectItem value={FieldVisitStatus.IN_PROGRESS}>{FieldVisitStatusLabels.IN_PROGRESS}</SelectItem>
            <SelectItem value={FieldVisitStatus.COMPLETED}>{FieldVisitStatusLabels.COMPLETED}</SelectItem>
            <SelectItem value={FieldVisitStatus.CANCELED}>{FieldVisitStatusLabels.CANCELED}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="h-full overflow-auto">
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
        searchPlaceholder="Buscar por destino o zona…"
      />
    </div>
  );
}
