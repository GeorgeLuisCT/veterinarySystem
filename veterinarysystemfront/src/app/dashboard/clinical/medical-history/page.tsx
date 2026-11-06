"use client";

import { AnimalSpeciesLabels } from "@/app/dashboard/crm/patients/enums/animal-species";
import PaginatedList from "@/components/paginated-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  CalendarClock,
  ClipboardList,
  FlaskConical,
  Loader2,
  Mail,
  PawPrint,
  Phone,
  Scissors,
  Search,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import DashboardLayoutSection from "../../dashboard-layout-section";
import MedicalHistoryService, {
  type ClinicalHistoryListParams,
} from "../service/medical-history-service";
import type { ClinicalHistoryAnimalSummaryResponse } from "../types/medical-history-response";

import MedicalHistoryFilterBar, {
  type FilterState,
  DEFAULTS as DEFAULT_FILTERS,
} from "./components/medical-history-filter-bar";
import { PageContainer } from "@/components/page/page-container";

import { PageHeader } from "@/components/page/page-header";
type PaginationState = {
  page: number;
  size: number;
};

export default function MedicalHistoryPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [pagination, setPagination] = useState<PaginationState>({ page: 0, size: 6 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ClinicalHistoryAnimalSummaryResponse[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const hasFetched = useRef(false);

  const fetchAnimals = useCallback(async () => {
    const params: ClinicalHistoryListParams = {
      page: pagination.page,
      size: pagination.size,
      query: filters.query || undefined,
      species: filters.species.length ? filters.species : undefined,
      active: filters.active,
    };

    setIsLoading(!hasFetched.current);
    setIsRefreshing(hasFetched.current);
    setError(null);
    try {
      const response = await MedicalHistoryService.listAnimals(params);
      setData(response.content);
      setTotalPages(response.totalPages ?? 0);
      setTotalElements(response.totalElements ?? 0);
      hasFetched.current = true;
    } catch (err) {
      console.error(err);
      setError("No pudimos obtener los pacientes. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filters.active, filters.query, filters.species, pagination.page, pagination.size]);

  useEffect(() => {
    fetchAnimals();
  }, [fetchAnimals]);

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setPagination((prev) => ({ ...prev, page: 0 }));
    setFilters(newFilters);
  }, []);

  const handleFilterReset = useCallback(() => {
    setPagination((prev) => ({ ...prev, page: 0 }));
    setFilters(DEFAULT_FILTERS);
  }, []);

  const handleNavigate = (animalId: number) => {
    router.push(`/dashboard/clinical/medical-history/${animalId}`);
  };

  const handlePaginate = (nextPage: number) => {
    setPagination((prev) => ({ ...prev, page: nextPage }));
  };

  return (
    <DashboardLayoutSection>
      <PageContainer>
        <PageHeader
          title="Historial clínico de pacientes"
          description="Consulta el resumen clínico de cada animal y accede al detalle de visitas, procedimientos y exámenes."
          actions={
            <>
              <Button variant="outline" onClick={fetchAnimals} disabled={isRefreshing} size="sm">
                {isRefreshing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Actualizando
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" /> Refrescar
                  </>
                )}
              </Button>
            </>
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

        {isLoading && !data.length ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex items-center gap-3 rounded-lg border bg-background px-4 py-3 text-sm text-muted-foreground shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando pacientes...
            </div>
          </div>
        ) : data.length === 0 ? (
          <PaginatedList
            items={[]}
            renderItem={() => null}
            pageIndex={pagination.page}
            pageSize={pagination.size}
            totalElements={totalElements}
            totalPages={totalPages}
            onPageIndexChange={handlePaginate}
            emptyState={
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                  <PawPrint className="h-8 w-8" />
                  <p>No encontramos pacientes que coincidan con tu búsqueda.</p>
                </CardContent>
              </Card>
            }
          />
        ) : (
          <PaginatedList
            items={data}
            renderItem={(item) => (
              <MedicalHistoryListItem
                item={item}
                onNavigate={() => handleNavigate(item.animalId)}
              />
            )}
            pageIndex={pagination.page}
            pageSize={pagination.size}
            totalElements={totalElements}
            totalPages={totalPages}
            onPageIndexChange={handlePaginate}
            isBusy={isRefreshing}
            getItemKey={(item) => item.animalId}
            emptyState={
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                  <PawPrint className="h-8 w-8" />
                  <p>No encontramos pacientes que coincidan con tu búsqueda.</p>
                </CardContent>
              </Card>
            }
          />
        )}
      </PageContainer>
    </DashboardLayoutSection>
  );
}

type MedicalHistoryListItemProps = {
  item: ClinicalHistoryAnimalSummaryResponse;
  onNavigate: () => void;
};

function MedicalHistoryListItem({ item, onNavigate }: MedicalHistoryListItemProps) {
  const visitDate = item.lastVisitDate
    ? new Date(item.lastVisitDate).toLocaleDateString("es-PE")
    : "Sin registro";
  const ownerName = item.ownerName ?? "Propietario no disponible";
  const stats = [
    { label: "Consultas", value: item.totalConsultations ?? 0, icon: ClipboardList },
    { label: "Laboratorios", value: item.totalLabRequests ?? 0, icon: FlaskConical },
    { label: "Procedimientos", value: item.totalProcedures ?? 0, icon: Scissors },
  ];

  return (
    <Card
      className={cn(
        "overflow-hidden border bg-background shadow-sm transition hover:-translate-y-0.5 hover:shadow-sm",
        !item.active && "border-dashed border-muted-foreground/40 bg-muted/40"
      )}
    >
      <CardHeader className="gap-3 border-b bg-muted/20 px-4 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-4">
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <PawPrint className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-xl leading-tight text-foreground">
                  {item.animalName}
                </CardTitle>
                <Badge variant="outline" className="text-xs uppercase tracking-wide">
                  Paciente #{item.animalId}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {item.speciesLabel ?? AnimalSpeciesLabels[item.species]}
                </Badge>
                {item.breed && (
                  <span className="text-xs uppercase text-muted-foreground">
                    Raza: {item.breed}
                  </span>
                )}
                <span className="text-xs uppercase text-muted-foreground">
                  Edad: {item.age ?? "No disponible"}
                </span>
              </div>
              {item.microchip && (
                <p className="text-xs text-muted-foreground">
                  Microchip: <span className="font-medium text-foreground">{item.microchip}</span>
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={item.active ? "default" : "secondary"}
              className={cn(!item.active && "bg-muted-foreground/50 text-foreground")}
            >
              {item.active ? "Activo" : "Inactivo"}
            </Badge>
            {stats.map((stat) => (
              <span
                key={stat.label}
                className="inline-flex items-center gap-1 rounded-full border border-muted-foreground/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                <stat.icon className="h-3.5 w-3.5 text-primary" />
                {stat.label}: {stat.value}
              </span>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 py-4">
        <div className="grid gap-4 text-sm text-muted-foreground lg:grid-cols-2">
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-muted-foreground/30 bg-background/70 p-4">
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <CalendarClock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide">Última visita</p>
              <p className="text-base font-semibold text-foreground">{visitDate}</p>
              {item.lastVisitService && (
                <p className="text-xs text-muted-foreground">Servicio: {item.lastVisitService}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-muted-foreground/30 bg-background/70 p-4">
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <User className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide">Propietario</p>
              <p className="text-sm font-semibold text-foreground">{ownerName}</p>
              <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                {item.ownerPhone && (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-primary" />
                    {item.ownerPhone}
                  </span>
                )}
                {item.ownerEmail && (
                  <span className="inline-flex items-center gap-1.5 break-all">
                    <Mail className="h-3.5 w-3.5 text-primary" />
                    {item.ownerEmail}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 border-t bg-muted/30 px-4 py-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <span className="text-xs text-muted-foreground">
          Actualizado automáticamente con cada atención registrada.
        </span>
        <Button size="sm" onClick={onNavigate} className="w-full md:w-auto">
          Ver historial
        </Button>
      </CardFooter>
    </Card>
  );
}
