"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Activity,
  CheckCircle2,
  Ban,
  CalendarClock,
  Plus,
  RefreshCw,
  Loader2,
  Stethoscope,
  Building,
  Users,
  FileCheck2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import SurgicalReportService from "../service/surgical-report-service";
import { SurgicalReportSummaryResponse } from "../types/surgical-report-response";
import {
  SurgicalReportStatus,
  SurgicalReportStatusLabels,
} from "../enums/surgical-report-status";
import { CreateSurgicalOrderModal } from "../components/operating-room/create-surgical-order-modal";
import SurgicalOrderService from "../../schedule/service/surgical-order-service";
import { SurgicalOrderResponse } from "../../schedule/types/surgical-order-response";
import { SurgicalOrderStatus } from "../../schedule/enums/surgical-order-status";
import { SurgicalOrderStatusLabels } from "../../schedule/enums/surgical-order-status";
import { useUser } from "@/context/user-context";

// NEW: Attentions (WAITING/SURGERY)
import AttentionService from "@/app/dashboard/schedule/service/attention-service";
import { AttentionResponse } from "@/app/dashboard/schedule/types/attention-response";
import { AttentionStatus } from "@/app/dashboard/schedule/enums/attention-status";
import { AttentionType } from "@/app/dashboard/schedule/enums/attention-type";

type KanbanColumnConfig = {
  status: SurgicalReportStatus;
  title: string;
  icon: React.ReactNode;
  accentClass: string;
};

// UPDATED: Quitamos COMPLETED y CANCELLED; añadimos READY_TO_BILL
const columnsConfig: KanbanColumnConfig[] = [
  {
    status: SurgicalReportStatus.DRAFT,
    title: "Borradores",
    icon: <ClipboardList className="h-4 w-4 text-slate-500" />,
    accentClass: "border-t-slate-400",
  },
  {
    status: SurgicalReportStatus.IN_PROGRESS,
    title: "En curso",
    icon: <Activity className="h-4 w-4 text-blue-500" />,
    accentClass: "border-t-blue-500",
  },
  {
    status: SurgicalReportStatus.READY_TO_BILL,
    title: "Listos para facturar",
    icon: <FileCheck2 className="h-4 w-4 text-emerald-600" />,
    accentClass: "border-t-emerald-600",
  },
];

const dateFormatter = new Intl.DateTimeFormat("es-PE", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("es-PE", {
  hour: "2-digit",
  minute: "2-digit",
});

const formatDate = (value?: string | null) => {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value as string;
  return dateFormatter.format(date);
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "Sin programación";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value as string;
  return `${dateFormatter.format(date)} • ${timeFormatter.format(date)}`;
};

const filterReports = (reports: SurgicalReportSummaryResponse[], term: string) => {
  if (!term) return reports;
  const normalized = term.trim().toLowerCase();
  return reports.filter((report) => {
    const haystack = [
      report.animalName,
      report.surgeonFullName,
      report.anesthesiologistFullName,
      report.operatingRoomName,
      report.branch?.name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized) || String(report.attentionId).includes(normalized);
  });
};

// UPDATED: Seed inicial solo para los estados que renderizamos
const groupByStatus = (reports: SurgicalReportSummaryResponse[]) =>
  columnsConfig.reduce<Record<SurgicalReportStatus, SurgicalReportSummaryResponse[]>>(
    (acc, column) => {
      acc[column.status] = reports.filter((report) => report.status === column.status);
      return acc;
    },
    {
      [SurgicalReportStatus.DRAFT]: [],
      [SurgicalReportStatus.IN_PROGRESS]: [],
      [SurgicalReportStatus.READY_TO_BILL]: [],
      // Los demás estados se omiten del tablero
      [SurgicalReportStatus.COMPLETED]: [],
      [SurgicalReportStatus.CANCELLED]: [],
    }
  );

const KpiCard = ({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-semibold">{value}</div>
    </CardContent>
  </Card>
);

const SurgicalReportCard = ({
  report,
  onView,
}: {
  report: SurgicalReportSummaryResponse;
  onView: (reportId: number) => void;
}) => (
  <Card className="shadow-sm">
    <CardContent className="p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-base font-semibold text-slate-900">{report.animalName}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <ClipboardList className="h-3 w-3" />
            <span>Atención #{report.attentionId}</span>
          </div>
        </div>
        <Badge variant="outline">{SurgicalReportStatusLabels[report.status]}</Badge>
      </div>
      <div className="space-y-2 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-blue-500" />
          <span>{formatDate(report.surgeryStartAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-blue-500" />
          <span>{formatDate(report.surgeryEndAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Stethoscope className="h-4 w-4 text-emerald-500" />
          <span>{report.surgeonFullName ?? "Cirujano no asignado"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-sky-500" />
          <span>{report.anesthesiologistFullName ?? "Anestesista no asignado"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-purple-500" />
          <span>{report.operatingRoomName ?? "Quirófano sin asignar"}</span>
        </div>
      </div>
      <Button
        variant="outline"
        className="w-full"
        onClick={() => onView(report.id)}
      >
        Ver detalles
      </Button>
    </CardContent>
  </Card>
);

// NEW: Card para "por atención" (WAITING/SURGERY)
const WaitingSurgeryCard = ({ attention }: { attention: AttentionResponse }) => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(t);
  }, []);

  const diff = now.getTime() - new Date(attention.checkInTime ?? Date.now()).getTime();
  const minutes = Math.max(0, Math.floor(diff / 60000));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const timeInStatus = days > 0 ? `${days}d ${hours % 24}h` : hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes} min`;

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-base font-semibold text-slate-900">{attention.animalName}</p>
            <p className="text-xs text-muted-foreground">Atención #{attention.id}</p>
          </div>
          <span className="text-xs text-slate-500 inline-flex items-center"><Clock className="h-3 w-3 mr-1" />{timeInStatus}</span>
        </div>
        <div className="space-y-2 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            <span>{attention.attendingEmployeeFullName ?? "Profesional no asignado"}</span>
          </div>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            <span>{attention.clinicalServiceName ?? "Procedimiento quirúrgico"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function OperatingRoomPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { userInfo } = useUser();
  const branchId = userInfo?.selectedBranch.id;

  const [reports, setReports] = useState<SurgicalReportSummaryResponse[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsRefreshing, setReportsRefreshing] = useState(false);
  const [orders, setOrders] = useState<SurgicalOrderResponse[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // NEW: Attentions en espera para cirugía
  const [waitingSurgery, setWaitingSurgery] = useState<AttentionResponse[]>([]);
  const [waitingLoading, setWaitingLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadReports = useCallback(
    async (silent = false) => {
      if (!silent) setReportsLoading(true);
      try {
        const response = await SurgicalReportService.list({
          page: 0,
          size: 150,
          branchId: branchId ?? undefined,
        });
        setReports(response.content);
      } catch (error) {
        console.error("Error loading surgical reports:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los reportes quirúrgicos.",
        });
      } finally {
        if (!silent) setReportsLoading(false);
      }
    },
    [toast, branchId]
  );

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const response = await SurgicalOrderService.list({
        page: 0,
        size: 25,
        branchId: branchId ?? undefined,
        status: SurgicalOrderStatus.PENDING,
      });

      console.log(response);
      setOrders(response.content);
    } catch (error) {
      console.error("Error loading surgical orders:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las órdenes quirúrgicas.",
      });
    } finally {
      setOrdersLoading(false);
    }
  }, [toast, branchId]);

  // NEW: cargar atenciones en espera (quirúrgicas)
  const loadWaitingSurgery = useCallback(async () => {
    setWaitingLoading(true);
    try {
      const resp = await AttentionService.list({
        status: AttentionStatus.WAITING,
        type: AttentionType.SURGERY,
        size: 100,
        branchId: branchId ?? undefined,
      });
      setWaitingSurgery(resp.content);
    } catch (error) {
      console.error("Error loading waiting surgical attentions:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las atenciones quirúrgicas en espera.",
      });
    } finally {
      setWaitingLoading(false);
    }
  }, [toast, branchId]);

  useEffect(() => {
    void loadReports();
    void loadOrders();
    void loadWaitingSurgery();
  }, [loadReports, loadOrders, loadWaitingSurgery]);

  const handleRefresh = async () => {
    setReportsRefreshing(true);
    await Promise.all([loadReports(true), loadOrders(), loadWaitingSurgery()]);
    setReportsRefreshing(false);
  };

  const filteredReports = useMemo(
    () => filterReports(reports, searchTerm),
    [reports, searchTerm]
  );

  const groupedReports = useMemo(
    () => groupByStatus(filteredReports),
    [filteredReports]
  );

  const draftCount = groupedReports[SurgicalReportStatus.DRAFT]?.length ?? 0;
  const inProgressCount = groupedReports[SurgicalReportStatus.IN_PROGRESS]?.length ?? 0;
  const readyToBillCount = groupedReports[SurgicalReportStatus.READY_TO_BILL]?.length ?? 0;

  const handleViewReport = (reportId: number) => {
    router.push(`/dashboard/clinical/operating-room/${reportId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Sala de operaciones</h1>
            <p className="text-sm text-muted-foreground">
              Seguimiento de reportes quirúrgicos, atenciones en espera y coordinación de órdenes.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={reportsRefreshing}>
              {reportsRefreshing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Actualizando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualizar
                </>
              )}
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva orden
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <KpiCard title="Borradores activos" value={String(draftCount)} icon={<ClipboardList className="h-5 w-5 text-slate-500" />} />
          <KpiCard title="Cirugías en curso" value={String(inProgressCount)} icon={<Activity className="h-5 w-5 text-blue-500" />} />
          <KpiCard title="Listos para facturar" value={String(readyToBillCount)} icon={<FileCheck2 className="h-5 w-5 text-emerald-600" />} />
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-xl">Tablero quirúrgico</CardTitle>
              <p className="text-sm text-muted-foreground">
                Organiza los reportes por estado y accede rápidamente al detalle.
              </p>
            </div>
            <Input
              placeholder="Buscar por paciente, cirujano, quirófano o atención..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full lg:w-80"
            />
          </CardHeader>
          <CardContent>
            {reportsLoading ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Cargando reportes quirúrgicos...
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {columnsConfig.map((column) => (
                  <div
                    key={column.status}
                    className={`bg-gray-100 rounded-lg p-3 border-t-4 ${column.accentClass}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        {column.icon}
                        <span>{column.title}</span>
                      </div>
                      <span className="inline-flex h-6 min-w-[2rem] items-center justify-center rounded-full bg-white px-2 text-xs font-semibold text-slate-600 shadow-sm">
                        {groupedReports[column.status]?.length ?? 0}
                      </span>
                    </div>
                    <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                      {(groupedReports[column.status] ?? []).length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          No hay reportes en este estado.
                        </p>
                      ) : (
                        groupedReports[column.status]!.map((report) => (
                          <SurgicalReportCard
                            key={report.id}
                            report={report}
                            onView={handleViewReport}
                          />
                        ))
                      )}
                    </div>
                  </div>
                ))}

                {/* NEW: Columna "Por atención (quirúrgica)" - WAITING + SURGERY */}
                <div className={`bg-gray-100 rounded-lg p-3 border-t-4 border-t-amber-500`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Users className="h-4 w-4 text-amber-600" />
                      <span>Por atención (quirúrgica)</span>
                    </div>
                    <span className="inline-flex h-6 min-w-[2rem] items-center justify-center rounded-full bg-white px-2 text-xs font-semibold text-slate-600 shadow-sm">
                      {waitingSurgery.length}
                    </span>
                  </div>
                  <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                    {waitingLoading ? (
                      <p className="text-xs text-muted-foreground flex items-center"><Loader2 className="h-4 w-4 mr-2 animate-spin" />Cargando atenciones...</p>
                    ) : waitingSurgery.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No hay atenciones quirúrgicas en espera.</p>
                    ) : (
                      waitingSurgery.map((att) => (
                        <WaitingSurgeryCard key={att.id} attention={att} />
                      ))
                    )}
                  </div>
                </div>
                {/* FIN columna nueva */}
              </div>
            )}
          </CardContent>
        </Card>

        <Table className="[caption-side:bottom]">
          <TableCaption>
            Mostrando {orders.length} órdenes con estado pendiente
            {branchId ? ` en ${userInfo?.selectedBranch.name}` : ""}.
          </TableCaption>

          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Servicio recomendado</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Solicitante</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Programación</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>{order.id}</TableCell>
                <TableCell>{order.recommendedServiceName}</TableCell>
                <TableCell>{order.animalName}</TableCell>
                <TableCell>{order.requestedByFullName ?? "Sin asignar"}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {SurgicalOrderStatusLabels[order.status]}
                  </Badge>
                </TableCell>
                <TableCell>{formatDateTime(order.scheduledAppointmentStart)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {showCreateModal && (
        <CreateSurgicalOrderModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            void loadReports(true);
            toast({
              title: "Tablero actualizado",
              description: "El nuevo reporte ya está disponible en el tablero.",
            });
          }}
        />
      )}
    </div>
  );
}
