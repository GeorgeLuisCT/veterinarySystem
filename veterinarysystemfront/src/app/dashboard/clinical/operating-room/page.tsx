"use client";

import { Button } from "@/components/ui/button";
import { useUser } from "@/context/user-context";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, RefreshCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { SurgicalReportStatus } from "../enums/surgical-report-status";
import SurgicalReportService from "../service/surgical-report-service";
import type { SurgicalReportSummaryResponse } from "../types/surgical-report-response";

import { SurgicalOrderStatus } from "../../schedule/enums/surgical-order-status";
import SurgicalOrderService from "../../schedule/service/surgical-order-service";
import type { SurgicalOrderResponse } from "../../schedule/types/surgical-order-response";

import { AttentionStatus } from "@/app/dashboard/schedule/enums/attention-status";
import { AttentionType } from "@/app/dashboard/schedule/enums/attention-type";
import AttentionService from "@/app/dashboard/schedule/service/attention-service";
import type { AttentionResponse } from "@/app/dashboard/schedule/types/attention-response";

import { CreateSurgicalOrderModal } from "../components/operating-room/create-surgical-order-modal";
import SurgeryCard, { type SurgeryCardData } from "../components/operating-room/surgery-card";
import SurgeryFilters, {
  type SurgeryFilters as Filters,
} from "../components/operating-room/surgery-filters";
import SurgicalOrderCard from "../components/operating-room/surgical-order-card";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page/page-header";

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

export default function OperatingRoomPage() {
  const { toast } = useToast();
  const { userInfo } = useUser();
  const selectedBranchId = userInfo?.selectedBranch?.id || undefined;

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

  const [search] = useState("");
  const [activeTab, setActiveTab] = useState<"board" | "orders">("board");

  const [reports, setReports] = useState<SurgicalReportSummaryResponse[]>([]);
  const [orders, setOrders] = useState<SurgicalOrderResponse[]>([]);
  const [waitingSurgery, setWaitingSurgery] = useState<AttentionResponse[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadReports = useCallback(async () => {
    const startDate = toDateParam(filters.startDate);
    const endDate = toDateParam(filters.endDate);

    const statuses =
      filters.status === "ALL" || filters.status === "WAITING"
        ? [
            SurgicalReportStatus.DRAFT,
            SurgicalReportStatus.IN_PROGRESS,
            SurgicalReportStatus.READY_TO_BILL,
          ]
        : [filters.status];

    const resp = await SurgicalReportService.list({
      page: 0,
      size: 200,
      statuses,
      branchId: selectedBranchId,
      startDate,
      endDate,
    });
    setReports(resp.content);
  }, [filters.status, filters.startDate, filters.endDate, selectedBranchId]);

  const loadOrders = useCallback(async () => {
    const resp = await SurgicalOrderService.list({
      page: 0,
      size: 200,
      branchId: selectedBranchId,
      status: SurgicalOrderStatus.PENDING,
    });
    setOrders(resp.content);
  }, [selectedBranchId]);

  const loadWaiting = useCallback(async () => {
    const startDate = toDateParam(filters.startDate);
    const endDate = toDateParam(filters.endDate);

    const resp = await AttentionService.list({
      status: AttentionStatus.WAITING,
      type: AttentionType.SURGERY,
      size: 200,
      branchId: selectedBranchId,
      startDate,
      endDate,
    });
    setWaitingSurgery(resp.content);
  }, [filters.startDate, filters.endDate, selectedBranchId]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadReports(), loadOrders(), loadWaiting()]);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar la información de quirófano.",
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [loadReports, loadOrders, loadWaiting, toast]);

  useEffect(() => {
    if (showCreateModal) return;

    void fetchAll();
    const i = setInterval(fetchAll, 60000);
    return () => clearInterval(i);
  }, [fetchAll, showCreateModal]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadReports(), loadOrders(), loadWaiting()]);
    } finally {
      setRefreshing(false);
    }
  }, [loadReports, loadOrders, loadWaiting]);

  const unifiedItems: SurgeryCardData[] = useMemo(() => {
    const waitingItems: SurgeryCardData[] = waitingSurgery.map((att) => ({
      kind: "WAITING",
      id: att.id,
      attentionId: att.id,
      animalName: att.animalBasicResponse?.animalName ?? "Paciente",
      species: att.animalBasicResponse?.animalSpecies,
      breed: att.animalBasicResponse?.animalBreed,
      vetName: att.attendingEmployeeFullName ?? null,
      reason: att.clinicalServiceName ?? "Procedimiento quirúrgico",
      startTime: att.checkInTime ?? new Date().toISOString(),
      badgeLabel: "Sala de Espera",
    }));

    const reportItems: SurgeryCardData[] = reports.map((r) => ({
      kind: "REPORT",
      id: r.id,
      attentionId: r.attentionId,
      animalName: r.animalBasicResponse?.animalName ?? "Paciente",
      species: r.animalBasicResponse?.animalSpecies,
      breed: r.animalBasicResponse?.animalBreed,
      vetName: r.surgeonFullName ?? null,
      reason: r.clinicalServiceName ?? "Reporte quirúrgico",
      startTime: r.surgeryStartAt ?? new Date().toISOString(),
      badgeLabel:
        r.status === SurgicalReportStatus.IN_PROGRESS
          ? "En curso"
          : r.status === SurgicalReportStatus.READY_TO_BILL
            ? "Listo para Facturar"
            : "Borrador",
      reportStatus: r.status,
      operatingRoomName: r.operatingRoomName ?? undefined,
    }));

    const list = [...waitingItems, ...reportItems];

    const prio = (it: SurgeryCardData) => {
      if (it.kind === "WAITING") return 0;
      if (it.reportStatus === SurgicalReportStatus.IN_PROGRESS) return 1;
      if (it.reportStatus === SurgicalReportStatus.READY_TO_BILL) return 2;
      return 3;
    };

    return list
      .filter((it) => {
        if (filters.status === "ALL") return true;
        if (filters.status === "WAITING") return it.kind === "WAITING";
        return it.kind === "REPORT" && it.reportStatus === filters.status;
      })
      .filter((it) => {
        if (!search.trim()) return true;
        const haystack = [
          it.animalName,
          it.vetName ?? "",
          it.reason ?? "",
          it.operatingRoomName ?? "",
          String(it.attentionId ?? ""),
          String(it.id ?? ""),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(search.trim().toLowerCase());
      })
      .sort((a, b) => {
        const pa = prio(a);
        const pb = prio(b);
        if (pa !== pb) return pa - pb;
        const ta = new Date(a.startTime).getTime();
        const tb = new Date(b.startTime).getTime();
        if (ta !== tb) return tb - ta;
        return (b.attentionId ?? 0) - (a.attentionId ?? 0) || b.id - a.id;
      });
  }, [waitingSurgery, reports, filters.status, search]);

  const filteredOrders = useMemo(() => {
    const inRange = (d?: string | null) => {
      if (!filters.startDate || !filters.endDate) return true;
      if (!d) return false;
      const dt = new Date(d);
      const start = new Date(
        filters.startDate instanceof Date ? filters.startDate : new Date(filters.startDate)
      );
      const end = new Date(
        filters.endDate instanceof Date ? filters.endDate : new Date(filters.endDate)
      );
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return dt.getTime() >= start.getTime() && dt.getTime() <= end.getTime();
    };

    return orders
      .filter((o) => inRange(o.scheduledAppointmentStart))
      .filter((o) => {
        if (!search.trim()) return true;
        const haystack = [
          o.recommendedServiceName ?? "",
          o.animalName ?? "",
          o.requestedByFullName ?? "",
          String(o.id),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(search.trim().toLowerCase());
      })
      .sort((a, b) => {
        const ta = timeNum(a.scheduledAppointmentStart);
        const tb = timeNum(b.scheduledAppointmentStart);
        if (ta !== tb) return ta - tb;
        return a.id - b.id;
      });

    function timeNum(s?: string | null) {
      return s ? new Date(s).getTime() : Number.MAX_SAFE_INTEGER;
    }
  }, [orders, filters.startDate, filters.endDate, search]);

  if (loading) {
    return <div className="flex justify-center items-center h-[60vh]">Cargando quirófano...</div>;
  }

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-4">
        <PageHeader
          title="Sala de Operaciones"
          description="Reportes quirúrgicos, atenciones y órdenes en una sola vista."
          actions={
            <>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  className="gap-2"
                  disabled={refreshing}
                >
                  <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                  {refreshing ? "Actualizando..." : "Actualizar"}
                </Button>
                <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Nueva Orden
                </Button>
              </div>
            </>
          }
        />

        <div className="mb-4 flex flex-col gap-3">
          <SurgeryFilters value={filters} onChange={setFilters} />
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "board" | "orders")}
          className="w-full"
        >
          <TabsList className="mb-4">
            <TabsTrigger value="board">Tablero</TabsTrigger>
            <TabsTrigger value="orders">Órdenes</TabsTrigger>
          </TabsList>

          <TabsContent value="board">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {unifiedItems.map((item) => (
                <SurgeryCard
                  key={`${item.kind}-${item.attentionId ?? "na"}-${item.id}`}
                  data={item}
                />
              ))}
            </div>
            {unifiedItems.length === 0 && (
              <div className="text-center text-muted-foreground mt-10">
                No hay registros para los filtros seleccionados.
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {filteredOrders.map((o) => (
                <SurgicalOrderCard key={o.id} order={o} />
              ))}
            </div>
            {filteredOrders.length === 0 && (
              <div className="text-center text-muted-foreground mt-10">
                No hay órdenes pendientes para los filtros seleccionados.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {showCreateModal && (
        <CreateSurgicalOrderModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            Promise.all([loadReports(), loadOrders(), loadWaiting()]).then(() => {
              toast({
                title: "Tablero actualizado",
                description: "La nueva orden/reporte está disponible.",
              });
            });
          }}
        />
      )}
    </div>
  );
}
