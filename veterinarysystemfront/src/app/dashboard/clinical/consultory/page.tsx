// app/dashboard/clinical/consultory/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { PlusCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import AttentionService from "@/app/dashboard/schedule/service/attention-service";
import ClinicalAttentionService from "../service/clinical-attention-service";
import { AttentionStatus } from "@/app/dashboard/schedule/enums/attention-status";
import { AttentionType } from "@/app/dashboard/schedule/enums/attention-type";
import { ClinicalAttentionStatus } from "../enums/clinical-attention-status";
import type { AttentionResponse } from "@/app/dashboard/schedule/types/attention-response";
import type { ClinicalAttentionSummaryResponse } from "../types/clinical-attention-response";
import ConsultationCard from "../components/consultory/consultation-card";
import ConsultoryFilters, {
  type ConsultoryFilters as Filters,
} from "../components/consultory/consultation-filters";
import NewAttentionModal from "@/app/dashboard/schedule/components/new-attention-modal";
import { AnimalBasicResponse } from "../../crm/patients/types/animal-basic-response";
import { useUser } from "@/context/user-context";
import DashboardLayoutSection from "../../dashboard-layout-section";
import { PageHeader } from "@/components/page/page-header";
import { PageContainer } from "@/components/page/page-container";

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toDateParam(v?: string | Date | null): string | undefined {
  if (!v) return undefined;
  return v instanceof Date ? formatLocalDate(v) : v;
}

type SourceType = "RECEPCION" | "CLINICA";

type UnifiedCardData = {
  id: number;
  source: SourceType;
  animalBasicResponse: AnimalBasicResponse;
  ownerName?: string;
  reason: string;
  vetName: string | null;
  startTime: string;
  attentionId: number;
  statusLabel: string;
};

export default function ConsultoryPage() {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [filters, setFilters] = useState<Filters>({
    status: "ALL",
    startDate: today,
    endDate: today,
  });

  const [waitingRoom, setWaitingRoom] = useState<AttentionResponse[]>([]);
  const [clinicalAttentions, setClinicalAttentions] = useState<ClinicalAttentionSummaryResponse[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { userInfo } = useUser();
  const selectedBranchId = userInfo?.selectedBranch?.id || undefined;

  const fetchData = useCallback(async () => {
    console.log(userInfo?.selectedBranch?.id);
    setLoading(true);
    setError(null);
    try {
      const startDateParam = toDateParam(filters.startDate);
      const endDateParam = toDateParam(filters.endDate);

      const [waitingRoomResponse, clinicalAttentionsResponse] = await Promise.all([
        AttentionService.list({
          status: AttentionStatus.WAITING,
          type: AttentionType.CLINIC,
          startDate: startDateParam,
          endDate: endDateParam,
          size: 200,
          branchId: selectedBranchId,
        }),
        ClinicalAttentionService.list({
          statuses: [
            ClinicalAttentionStatus.OPEN,
            ClinicalAttentionStatus.IN_PROGRESS,
            ClinicalAttentionStatus.WAITING_LAB,
            ClinicalAttentionStatus.READY_TO_BILL,
          ],
          startDate: startDateParam,
          endDate: endDateParam,
          size: 200,
          branchId: selectedBranchId,
        }),
      ]);
      setWaitingRoom(waitingRoomResponse.content);
      setClinicalAttentions(clinicalAttentionsResponse.content);
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar la información de las consultas.");
    } finally {
      setLoading(false);
    }
  }, [filters.startDate, filters.endDate, userInfo?.selectedBranch?.id]);

  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, 60000);
    return () => clearInterval(i);
  }, [fetchData]);

  const allItems: UnifiedCardData[] = useMemo(() => {
    const wr: UnifiedCardData[] = waitingRoom.map((att) => ({
      id: att.id,
      source: "RECEPCION",
      animalBasicResponse: att.animalBasicResponse,
      ownerName: "Dueño no disponible",
      reason: att.clinicalServiceName ?? "Recepción clínica",
      vetName: att.attendingEmployeeFullName,
      startTime: att.checkInTime,
      attentionId: att.id,
      statusLabel: "Sala de Espera",
    }));

    const ca: UnifiedCardData[] = clinicalAttentions.map((c) => ({
      id: c.id,
      source: "CLINICA",
      animalBasicResponse: c.animalBasicResponse,
      ownerName: undefined,
      reason: c.clinicalServiceName ?? "Consulta clínica",
      vetName: c.attendingEmployeeFullName,
      startTime: c.visitDate,
      attentionId: c.attentionId,
      statusLabel:
        c.status === ClinicalAttentionStatus.OPEN
          ? "En Consulta (Abierta)"
          : c.status === ClinicalAttentionStatus.IN_PROGRESS
            ? "En Consulta (En progreso)"
            : c.status === ClinicalAttentionStatus.WAITING_LAB
              ? "Esperando Exámenes"
              : "Listo para Facturar",
    }));

    return [...wr, ...ca].sort((a, b) => {
      const prioA = a.source === "RECEPCION" ? 0 : 1;
      const prioB = b.source === "RECEPCION" ? 0 : 1;
      if (prioA !== prioB) return prioA - prioB;
      const tA = new Date(a.startTime).getTime();
      const tB = new Date(b.startTime).getTime();
      if (tA !== tB) return tB - tA;
      return b.attentionId - a.attentionId || b.id - a.id;
    });
  }, [waitingRoom, clinicalAttentions]);

  const filteredItems = useMemo(() => {
    if (filters.status === "ALL") return allItems;
    if (filters.status === "WAITING") return allItems.filter((i) => i.source === "RECEPCION");
    return allItems.filter(
      (i) =>
        i.source === "CLINICA" &&
        ((filters.status === ClinicalAttentionStatus.OPEN && i.statusLabel.includes("Abierta")) ||
          (filters.status === ClinicalAttentionStatus.IN_PROGRESS &&
            i.statusLabel.includes("En progreso")) ||
          (filters.status === ClinicalAttentionStatus.WAITING_LAB &&
            i.statusLabel.includes("Esperando")) ||
          (filters.status === ClinicalAttentionStatus.READY_TO_BILL &&
            i.statusLabel.includes("Facturar")))
    );
  }, [allItems, filters.status]);

  const handleCreated = useCallback(() => {
    setIsCreateModalOpen(false);
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <div className="flex justify-center items-center h-[60vh]">Cargando consultas...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-[60vh] text-red-500">{error}</div>;
  }

  return (
    <DashboardLayoutSection>
      <PageContainer>
        <PageHeader
          title="Consultas del Día"
          description="Todas las atenciones clínicas en una sola vista."
          actions={
            <>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={fetchData} className="gap-2">
                  <RefreshCcw className="h-4 w-4" />
                  Actualizar
                </Button>
                <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Nueva Recepción
                </Button>
              </div>
            </>
          }
        />

        <div className="mb-4">
          <ConsultoryFilters value={filters} onChange={setFilters} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <ConsultationCard key={`${item.source}-${item.attentionId}-${item.id}`} data={item} />
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center text-muted-foreground mt-10">
            No hay registros para los filtros seleccionados.
          </div>
        )}

        <NewAttentionModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onCreated={handleCreated}
        />
      </PageContainer>
    </DashboardLayoutSection>
  );
}
