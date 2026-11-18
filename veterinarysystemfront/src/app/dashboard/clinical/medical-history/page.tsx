"use client";

import { AnimalSpeciesLabels } from "@/app/dashboard/crm/patients/enums/animal-species";
import DataTable, { type Action } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { PaginatedResponse } from "@/types/paginated-response";
import type { ColumnDef } from "@tanstack/react-table";
import { ClipboardList, Eye, FlaskConical, Loader2, Mail, PawPrint, Phone, Scissors, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayoutSection from "../../dashboard-layout-section";
import MedicalHistoryService, { type ClinicalHistoryListParams } from "../service/medical-history-service";
import type { ClinicalHistoryAnimalSummaryResponse } from "../types/medical-history-response";

import MedicalHistoryFilterBar, {
  type FilterState,
  DEFAULTS as DEFAULT_FILTERS,
} from "./components/medical-history-filter-bar";
import { PageContainer } from "@/components/page/page-container";
import { PageHeader } from "@/components/page/page-header";

type Row = ClinicalHistoryAnimalSummaryResponse;

const EMPTY_PAGE: PaginatedResponse<Row> = {
  content: [],
  totalPages: 0,
  totalElements: 0,
  pageSize: 10,
  currentPage: 0,
};

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString("es-PE") : null;
}

export default function MedicalHistoryPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageData, setPageData] = useState<PaginatedResponse<Row>>(EMPTY_PAGE);

  const fetchAnimals = useCallback(async () => {
    const params: ClinicalHistoryListParams = {
      page: pageIndex,
      size: pageSize,
      query: filters.query || undefined,
      species: filters.species.length ? filters.species : undefined,
      active: filters.active,
    };

    setLoading(true);
    setError(null);
    try {
      setPageData(await MedicalHistoryService.listAnimals(params));
    } catch (err) {
      console.error(err);
      setError("No pudimos obtener los pacientes. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }, [filters.active, filters.query, filters.species, pageIndex, pageSize]);

  useEffect(() => {
    fetchAnimals();
  }, [fetchAnimals]);

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setPageIndex(0);
    setFilters(newFilters);
  }, []);

  const handleFilterReset = useCallback(() => {
    setPageIndex(0);
    setFilters(DEFAULT_FILTERS);
  }, []);

  const openHistory = useCallback(
    (row: Row) => router.push(`/dashboard/clinical/medical-history/${row.animalId}`),
    [router]
  );

  const columns: ColumnDef<Row>[] = useMemo(
    () => [
      {
        id: "patient",
        header: "Paciente",
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center gap-3 py-2">
              <div className="rounded-full bg-primary/10 p-1.5 text-primary">
                <PawPrint className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground">{item.animalName}</p>
                <p className="text-xs text-muted-foreground">
                  #{item.animalId}
                  {item.microchip ? ` · Microchip ${item.microchip}` : ""}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        id: "species",
        header: "Especie / Raza",
        cell: ({ row }) => (
          <div className="py-2">
            <p>{row.original.speciesLabel ?? AnimalSpeciesLabels[row.original.species]}</p>
            <p className="text-xs text-muted-foreground">{row.original.breed || "Sin raza"}</p>
          </div>
        ),
      },
      {
        id: "age",
        header: "Edad",
        cell: ({ row }) => <span className="whitespace-nowrap">{row.original.age ?? "—"}</span>,
      },
      {
        id: "owner",
        header: "Propietario",
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="py-2">
              <p>{item.ownerName ?? "No disponible"}</p>
              <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                {item.ownerPhone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {item.ownerPhone}
                  </span>
                )}
                {item.ownerEmail && (
                  <span className="inline-flex items-center gap-1 break-all">
                    <Mail className="h-3 w-3" />
                    {item.ownerEmail}
                  </span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        id: "lastVisit",
        header: "Última visita",
        cell: ({ row }) => {
          const date = formatDate(row.original.lastVisitDate);
          return (
            <div className="py-2">
              <p className={date ? "" : "text-muted-foreground"}>{date ?? "Sin registro"}</p>
              {row.original.lastVisitService && (
                <p className="text-xs text-muted-foreground">{row.original.lastVisitService}</p>
              )}
            </div>
          );
        },
      },
      {
        id: "records",
        header: "Registros",
        cell: ({ row }) => {
          const item = row.original;
          const stats = [
            { label: "Consultas", value: item.totalConsultations ?? 0, icon: ClipboardList },
            { label: "Laboratorios", value: item.totalLabRequests ?? 0, icon: FlaskConical },
            { label: "Procedimientos", value: item.totalProcedures ?? 0, icon: Scissors },
          ];
          return (
            <div className="flex items-center gap-3 text-sm">
              {stats.map((stat) => (
                <span key={stat.label} className="inline-flex items-center gap-1" title={stat.label}>
                  <stat.icon className="h-3.5 w-3.5 text-primary" />
                  {stat.value}
                </span>
              ))}
            </div>
          );
        },
      },
      {
        id: "status",
        header: "Estado",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={row.original.active ? "text-success-strong" : "text-muted-foreground"}
          >
            {row.original.active ? "Activo" : "Inactivo"}
          </Badge>
        ),
      },
    ],
    []
  );

  const actions: Action<Row>[] = [
    {
      label: "Ver historial",
      type: "direct",
      icon: <Eye className="h-4 w-4" />,
      onClick: openHistory,
    },
  ];

  return (
    <DashboardLayoutSection>
      <PageContainer>
        <PageHeader
          title="Historial clínico de pacientes"
          description="Consulta el resumen clínico de cada animal y accede al detalle de visitas, procedimientos y exámenes."
          actions={
            <Button variant="outline" onClick={fetchAnimals} disabled={loading} size="sm">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Actualizando
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" /> Refrescar
                </>
              )}
            </Button>
          }
        />

        <MedicalHistoryFilterBar
          value={filters}
          onChange={handleFilterChange}
          onReset={handleFilterReset}
          onRefresh={fetchAnimals}
        />

        <Separator />

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <DataTable<Row>
          pageData={pageData}
          columns={columns}
          actions={actions}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPageIndexChange={setPageIndex}
          onPageSizeChange={(size) => {
            setPageIndex(0);
            setPageSize(size);
          }}
          loading={loading}
          getRowKey={(row) => row.animalId}
          onRowClick={openHistory}
          headerSlotLeft={
            <span className="text-sm text-muted-foreground">
              {pageData.totalElements} paciente{pageData.totalElements === 1 ? "" : "s"}
            </span>
          }
          emptyState={
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <PawPrint className="h-8 w-8" />
              <p>No encontramos pacientes que coincidan con tu búsqueda.</p>
            </div>
          }
        />
      </PageContainer>
    </DashboardLayoutSection>
  );
}
