"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Download, Loader2, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FloatingLabelDateInput } from "@/components/floating-label-date-input";
import { Separator } from "@/components/ui/separator";
import AnimalInfoCard from "../components/animal-info-card";
import LastVisitSummary from "../components/last-visit-summary";
import ClinicalHistoryTabs from "../components/clinical-history-tabs";
import PreventiveMedicineTabs from "../components/preventive-medicine-tabs";
import DiagnosticsAndFollowUpTabs from "../components/diagnostics-and-follow-up-tabs";
import MedicalHistoryService from "../../service/medical-history-service";
import type { ClinicalHistoryDetailResponse } from "../../types/medical-history-response";
import { PageContainer } from "@/components/page/page-container";

type DateFilters = {
  from?: string;
  to?: string;
};

function normalizeHistory(data: ClinicalHistoryDetailResponse): ClinicalHistoryDetailResponse {
  return {
    ...data,
    consultations: data.consultations ?? [],
    procedures: data.procedures ?? [],
    preventiveCare: {
      vaccines: data.preventiveCare?.vaccines ?? [],
      deworming: data.preventiveCare?.deworming ?? [],
      groomingSessions: data.preventiveCare?.groomingSessions ?? [],
    },
    labResults: data.labResults ?? [],
    weightHistory: data.weightHistory ?? [],
    hospitalizations: data.hospitalizations ?? [],
  };
}

export default function MedicalHistoryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const animalId = useMemo(() => {
    const value = Array.isArray(params?.id) ? params?.id[0] : params?.id;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
  }, [params?.id]);

  const [filters, setFilters] = useState<DateFilters>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ClinicalHistoryDetailResponse | null>(null);
  const hasHistory = useRef(false);

  const fetchHistory = useCallback(async () => {
    if (!Number.isFinite(animalId)) {
      setError("Identificador de paciente inválido.");
      return;
    }

    setIsLoading(!hasHistory.current);
    setIsRefreshing(hasHistory.current);
    setError(null);
    try {
      const response = await MedicalHistoryService.getAnimalHistory({
        animalId,
        from: filters.from,
        to: filters.to,
      });
      setHistory(normalizeHistory(response));
      hasHistory.current = true;
    } catch (err) {
      console.error(err);
      setError("No pudimos cargar el historial clínico. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [animalId, filters.from, filters.to]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    if (!Number.isFinite(animalId)) {
      router.replace("/dashboard/clinical/medical-history");
    }
  }, [animalId, router]);

  const handleClearFilters = () => {
    setFilters({});
  };

  if (!Number.isFinite(animalId)) {
    return null;
  }

  if (isLoading && !history) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <div className="flex items-center gap-3 rounded-lg border bg-background px-4 py-3 text-sm text-muted-foreground shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando historial clínico...
        </div>
      </div>
    );
  }

  if (error && !history) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-6 py-5 text-center">
          <p className="text-sm font-medium text-destructive">{error}</p>
          <Button className="mt-3" variant="secondary" onClick={fetchHistory}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  if (!history) {
    return null;
  }

  const lastConsultation = history.lastConsultation ?? history.consultations[0];

  return (
    <PageContainer>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid w-full gap-3 sm:grid-cols-3">
          <FloatingLabelDateInput
            id="from"
            label="Desde"
            value={filters.from}
            onChange={(value) => setFilters((prev) => ({ ...prev, from: value || undefined }))}
            mode="date"
          />
          <FloatingLabelDateInput
            id="to"
            label="Hasta"
            value={filters.to}
            onChange={(value) => setFilters((prev) => ({ ...prev, to: value || undefined }))}
            mode="date"
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleClearFilters}
              disabled={!filters.from && !filters.to}
            >
              Limpiar
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchHistory}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Actualizando
              </>
            ) : (
              <>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Actualizar
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Download className="mr-2 h-4 w-4" /> Exportar PDF
          </Button>
        </div>
      </div>

      <Separator />

      <AnimalInfoCard patient={history.patient}>
        <Button variant="outline" size="sm" disabled>
          <Download className="mr-2 h-4 w-4" />
          Descargar ficha
        </Button>
      </AnimalInfoCard>

      {lastConsultation && <LastVisitSummary consultation={lastConsultation} />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ClinicalHistoryTabs
          consultations={history.consultations}
          procedures={history.procedures}
        />
        <PreventiveMedicineTabs preventiveCare={history.preventiveCare} />
      </div>

      <DiagnosticsAndFollowUpTabs
        labResults={history.labResults}
        weightHistory={history.weightHistory}
      />
    </PageContainer>
  );
}
