"use client";

// 1. Asegúrate de importar 'useCallback'
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PawPrint, Search, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import MedicalHistoryService, { type ClinicalHistoryListParams } from "../service/medical-history-service";
import type { ClinicalHistoryAnimalSummaryResponse } from "../types/medical-history-response";
import { AnimalSpeciesLabels } from "@/app/dashboard/crm/patients/enums/animal-species";
import { cn } from "@/lib/utils";
import DashboardLayoutSection from "../../dashboard-layout-section";

import MedicalHistoryFilterBar, {
  type FilterState,
  DEFAULTS as DEFAULT_FILTERS,
} from "./components/medical-history-filter-bar";


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

  // 2. ENVUELVE 'fetchAnimals' EN useCallback
  //    Ahora esta función solo se recreará si sus dependencias cambian.
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
    // Añade las dependencias correctas
  }, [filters.active, filters.query, filters.species, pagination.page, pagination.size]);

  useEffect(() => {
    fetchAnimals();
  }, [fetchAnimals]); // Este useEffect ahora es seguro

  // 3. ENVUELVE 'handleFilterChange' EN useCallback
  //    El array vacío [] significa que NUNCA se recreará.
  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setPagination((prev) => ({ ...prev, page: 0 }));
    setFilters(newFilters);
  }, []); // <--- Dependencias vacías

  // 4. ENVUELVE 'handleFilterReset' EN useCallback
  const handleFilterReset = useCallback(() => {
    setPagination((prev) => ({ ...prev, page: 0 }));
    setFilters(DEFAULT_FILTERS);
  }, []); // <--- Dependencias vacías

  const handleNavigate = (animalId: number) => {
    router.push(`/dashboard/clinical/medical-history/${animalId}`);
  };

  const handlePaginate = (nextPage: number) => {
    setPagination((prev) => ({ ...prev, page: nextPage }));
  };

  const pageLabel = useMemo(() => {
    if (!totalElements) return "Sin resultados";
    const start = pagination.page * pagination.size + 1;
    const end = Math.min((pagination.page + 1) * pagination.size, totalElements);
    return `Mostrando ${start} - ${end} de ${totalElements}`;
  }, [pagination.page, pagination.size, totalElements]);

  return (
    <DashboardLayoutSection>
      <div className="flex min-h-screen flex-col bg-muted/40">
        <main className="flex-1 p-4 sm:p-6">
          <div className="mx-auto flex max-w-8xl flex-col gap-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
                  <PawPrint className="h-6 w-6 text-primary" /> Historial clínico de pacientes
                </h1>
                <p className="text-sm text-muted-foreground">
                  Consulta el resumen clínico de cada animal y accede al detalle de visitas, procedimientos y exámenes.
                </p>
              </div>
              {/* 5. PASA LAS FUNCIONES ESTABLES */}
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
            </div>

            {/* 6. ESTAS PROPS AHORA SON ESTABLES Y NO CAUSARÁN BUCLES */}
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
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                  <PawPrint className="h-8 w-8" />
                  <p>No encontramos pacientes que coincidan con tu búsqueda.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {data.map((item) => (
                  <Card key={item.animalId} className={cn(!item.active && "border-dashed border-muted-foreground/50 bg-muted/40")}>
                    <CardHeader className="gap-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <PawPrint className="h-5 w-5 text-primary" />
                        {item.animalName}
                      </CardTitle>
                      <CardDescription className="flex flex-wrap items-center gap-2 text-xs">
                        <Badge variant="outline">{item.speciesLabel ?? AnimalSpeciesLabels[item.species]}</Badge>
                        {item.breed && <span>• {item.breed}</span>}
                        {item.microchip && (
                          <span className="inline-flex items-center gap-1">
                            • <span>Microchip:</span> {item.microchip}
                          </span>
                        )}
                        <span>• {item.age ?? "Edad no disponible"}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid gap-2 text-sm text-muted-foreground">
                        <p className="flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" />
                          {item.ownerName ?? "Propietario no disponible"}
                          {item.ownerPhone && <span>• {item.ownerPhone}</span>}
                          {item.ownerEmail && <span>• {item.ownerEmail}</span>}
                        </p>
                        <p>Última visita: {item.lastVisitDate ? new Date(item.lastVisitDate).toLocaleDateString("es-PE") : "Sin registro"}</p>
                        {item.lastVisitService && <p>Servicio: {item.lastVisitService}</p>}
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div className="rounded-md border p-2">
                          <p className="text-xs text-muted-foreground">Consultas</p>
                          <p className="text-base font-semibold text-foreground">{item.totalConsultations}</p>
                        </div>
                        <div className="rounded-md border p-2">
                          <p className="text-xs text-muted-foreground">Laboratorios</p>
                          <p className="text-base font-semibold text-foreground">{item.totalLabRequests}</p>
                        </div>
                        <div className="rounded-md border p-2">
                          <p className="text-xs text-muted-foreground">Procedimientos</p>
                          <p className="text-base font-semibold text-foreground">{item.totalProcedures}</p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex items-center justify-between gap-2">
                      <Badge variant={item.active ? "default" : "secondary"} className={cn(!item.active && "bg-muted-foreground/50 text-foreground")}>
                        {item.active ? "Activo" : "Inactivo"}
                      </Badge>
                      <Button size="sm" onClick={() => handleNavigate(item.animalId)}>
                        Ver historial
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between rounded-md border bg-background px-4 py-3 text-sm">
                <span className="text-muted-foreground">
                  {pageLabel}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePaginate(Math.max(0, pagination.page - 1))}
                    disabled={pagination.page === 0}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePaginate(Math.min(totalPages - 1, pagination.page + 1))}
                    disabled={pagination.page >= totalPages - 1}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </DashboardLayoutSection>
  );
}