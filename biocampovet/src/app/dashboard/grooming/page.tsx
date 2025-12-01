// app/dashboard/grooming/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { PlusCircle, RefreshCcw, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/user-context";
import { useToast } from "@/hooks/use-toast";
import { AnimalBasicResponse } from "@/app/dashboard/crm/patients/types/animal-basic-response";
import AttentionService from "@/app/dashboard/schedule/service/attention-service";
import { AttentionStatus, AttentionStatusLabels } from "@/app/dashboard/schedule/enums/attention-status";
import { AttentionType } from "@/app/dashboard/schedule/enums/attention-type";
import type { AttentionResponse } from "@/app/dashboard/schedule/types/attention-response";
import NewAttentionModal from "@/app/dashboard/schedule/components/new-attention-modal";
import { GroomingStatus, GroomingStatusLabels } from "./enums/grooming-status";
import type { GroomingSessionSummaryResponse } from "./types/grooming-session-response";
import GroomingFilters, { type GroomingFilters as Filters } from "../clinical/components/grooming/grooming-filters";
import GroomingSessionService from "./service/grooming-session-service";
import GroomingCard from "../clinical/components/grooming/grooming-card";
import DashboardLayoutSection from "../dashboard-layout-section";

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

type SourceType = "RECEPCION" | "GROOMING";

type UnifiedCardData = {
  id: number;
  source: SourceType;
  animalBasicResponse: AnimalBasicResponse;
  reason: string;
  professionalName: string | null;
  startTime: string;
  attentionId: number;
  statusLabel: string;
};

export default function GroomingPage() {
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

  const { userInfo } = useUser();
  const selectedBranchId = userInfo?.selectedBranch?.id || undefined;
  const { toast } = useToast();

  const [waitingRoom, setWaitingRoom] = useState<AttentionResponse[]>([]);
  const [sessions, setSessions] = useState<GroomingSessionSummaryResponse[]>([]);
  const [attendingRoom, setAttendingRoom] = useState<AttentionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const startDateParam = toDateParam(filters.startDate);
      const endDateParam = toDateParam(filters.endDate);

      const [waitingRoomResponse, inConsultationResponse, inProgressResponse, sessionsResponse] = await Promise.all([
        AttentionService.list({
          status: AttentionStatus.WAITING,
          type: AttentionType.GROOMING,
          startDate: startDateParam,
          endDate: endDateParam,
          size: 200,
          branchId: selectedBranchId,
        }),
        AttentionService.list({
          status: AttentionStatus.IN_CONSULTATION,
          type: AttentionType.GROOMING,
          startDate: startDateParam,
          endDate: endDateParam,
          size: 200,
          branchId: selectedBranchId,
        }),
        AttentionService.list({
          status: AttentionStatus.IN_PROGRESS,
          type: AttentionType.GROOMING,
          startDate: startDateParam,
          endDate: endDateParam,
          size: 200,
          branchId: selectedBranchId,
        }),
        GroomingSessionService.list({
          statuses: [
            GroomingStatus.DRAFT,
            GroomingStatus.BATHING,
            GroomingStatus.DRYING,
            GroomingStatus.FINISHING,
            GroomingStatus.READY_FOR_PICKUP,
          ],
          startDate: startDateParam,
          endDate: endDateParam,
          size: 200,
          branchId: selectedBranchId,
        }),
      ]);

      setWaitingRoom(waitingRoomResponse.content);
      const mergedAttending: AttentionResponse[] = [];
      const seen = new Set<number>();
      const addUnique = (list: AttentionResponse[]) => {
        list.forEach((att) => {
          if (seen.has(att.id)) return;
          seen.add(att.id);
          mergedAttending.push(att);
        });
      };
      addUnique(inConsultationResponse.content);
      addUnique(inProgressResponse.content);
      setAttendingRoom(mergedAttending);
      setSessions(sessionsResponse.content);
    } catch (e) {
      setError("No se pudo cargar la información de peluquería.");
    } finally {
      setLoading(false);
    }
  }, [filters.startDate, filters.endDate, selectedBranchId]);

  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, 60000);
    return () => clearInterval(i);
  }, [fetchData]);

  const allItems: UnifiedCardData[] = useMemo(() => {
    const sessionAttentionIds = new Set(sessions.map((s) => s.attentionId));

    const wr: UnifiedCardData[] = waitingRoom.map((att) => ({
      id: att.id,
      source: "RECEPCION",
      animalBasicResponse: att.animalBasicResponse,
      reason: att.clinicalServiceName ?? "Recepción de peluquería",
      professionalName: att.attendingEmployeeFullName,
      startTime: att.checkInTime,
      attentionId: att.id,
      statusLabel: "Sala de Espera",
    }));

    const attending: UnifiedCardData[] = attendingRoom
      .filter((att) => !sessionAttentionIds.has(att.id))
      .map((att) => ({
        id: att.id,
        source: "GROOMING",
        animalBasicResponse: att.animalBasicResponse,
        reason: att.clinicalServiceName ?? "Servicio de peluquería",
        professionalName: att.attendingEmployeeFullName,
        startTime: att.checkInTime,
        attentionId: att.id,
        statusLabel: att.status ? AttentionStatusLabels[att.status] ?? "En atención" : "En atención",
      }));

    const gs: UnifiedCardData[] = sessions.map((s) => ({
      id: s.id,
      source: "GROOMING",
      animalBasicResponse: s.animalBasicResponse,
      reason: s.serviceName ?? "Servicio de peluquería",
      professionalName: s.assignedProfessionalFullName ?? null,
      startTime: s.startedAt ?? new Date().toISOString(),
      attentionId: s.attentionId,
      statusLabel: GroomingStatusLabels[s.status],
    }));

    return [...wr, ...attending, ...gs].sort((a, b) => {
      const prioA = a.source === "RECEPCION" ? 0 : 1;
      const prioB = b.source === "RECEPCION" ? 0 : 1;
      if (prioA !== prioB) return prioA - prioB;
      const tA = new Date(a.startTime).getTime();
      const tB = new Date(b.startTime).getTime();
      if (tA !== tB) return tB - tA;
      return (b.attentionId - a.attentionId) || (b.id - a.id);
    });
  }, [waitingRoom, attendingRoom, sessions]);

  const filteredItems = useMemo(() => {
    if (filters.status === "ALL") return allItems;
    if (filters.status === "WAITING") return allItems.filter((i) => i.source === "RECEPCION");
    return allItems.filter(
      (i) => i.source === "GROOMING" && i.statusLabel === GroomingStatusLabels[filters.status as GroomingStatus]
    );
  }, [allItems, filters.status]);

  const handleCreated = useCallback(() => {
    setIsCreateModalOpen(false);
    fetchData();
    toast({ title: "Recepción creada", description: "Se actualizó el tablero." });
  }, [fetchData, toast]);

  if (loading) {
    return <div className="flex justify-center items-center h-[60vh]">Cargando sesiones de peluquería...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-[60vh] text-red-500">{error}</div>;
  }

  return (
    <DashboardLayoutSection>
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Peluquería</h1>
              <p className="text-gray-600 mt-1">Todas las atenciones y sesiones en una sola vista.</p>
            </div>
          </div>
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
        </div>

        <div className="mb-4">
          <GroomingFilters value={filters} onChange={setFilters} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <GroomingCard key={`${item.source}-${item.attentionId}-${item.id}`} data={item} />
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center text-gray-500 mt-10">No hay registros para los filtros seleccionados.</div>
        )}

        <NewAttentionModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onCreated={handleCreated}
          origin="GROOMING"
        />
      </div>
    </DashboardLayoutSection>
  );
}
