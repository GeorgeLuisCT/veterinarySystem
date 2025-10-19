// app/dashboard/grooming/page.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Scissors,
  RefreshCw,
  Loader2,
  CalendarClock,
  Users,
  ClipboardList,
  Bath,
  Wind,
  ScissorsSquare,
  CheckCircle2,
  FileSearch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/context/user-context";
import { GroomingStatus, GroomingStatusLabels } from "../enums/grooming-status";
import { GroomingSessionSummaryResponse } from "../types/grooming-session-response";
import GroomingSessionService from "../service/grooming-session-service";

type KanbanColumnConfig = {
  status: GroomingStatus;
  title: string;
  icon: React.ReactNode;
  accentClass: string;
};

const columnsConfig: KanbanColumnConfig[] = [
  {
    status: GroomingStatus.WAITING,
    title: "Esperando",
    icon: <ClipboardList className="h-4 w-4 text-slate-500" />,
    accentClass: "border-t-slate-400",
  },
  {
    status: GroomingStatus.DRAFT,
    title: "Borradores",
    icon: <FileSearch className="h-4 w-4 text-gray-500" />,
    accentClass: "border-t-gray-500",
  },
  {
    status: GroomingStatus.BATHING,
    title: "Baño",
    icon: <Bath className="h-4 w-4 text-cyan-600" />,
    accentClass: "border-t-cyan-600",
  },
  {
    status: GroomingStatus.DRYING,
    title: "Secado",
    icon: <Wind className="h-4 w-4 text-sky-600" />,
    accentClass: "border-t-sky-600",
  },
  {
    status: GroomingStatus.FINISHING,
    title: "Corte/Acabado",
    icon: <ScissorsSquare className="h-4 w-4 text-indigo-600" />,
    accentClass: "border-t-indigo-600",
  },
  {
    status: GroomingStatus.READY_FOR_PICKUP,
    title: "Listos para recoger",
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
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

const filterSessions = (sessions: GroomingSessionSummaryResponse[], term: string) => {
  if (!term) return sessions;
  const normalized = term.trim().toLowerCase();
  return sessions.filter((s) => {
    const haystack = [
      s.animalName,
      s.assignedProfessionalFullName,
      s.branch?.name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized) || String(s.attentionId).includes(normalized);
  });
};

const groupByStatus = (sessions: GroomingSessionSummaryResponse[]) =>
  columnsConfig.reduce<Record<GroomingStatus, GroomingSessionSummaryResponse[]>>(
    (acc, column) => {
      acc[column.status] = sessions.filter((s) => s.status === column.status);
      return acc;
    },
    {
      [GroomingStatus.WAITING]: [],
      [GroomingStatus.DRAFT]: [],
      [GroomingStatus.BATHING]: [],
      [GroomingStatus.DRYING]: [],
      [GroomingStatus.FINISHING]: [],
      [GroomingStatus.READY_FOR_PICKUP]: [],
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

const SessionCard = ({
  item,
  onView,
}: {
  item: GroomingSessionSummaryResponse;
  onView: (attentionId: number) => void;
}) => (
  <Card className="shadow-sm">
    <CardContent className="p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-base font-semibold text-slate-900">{item.animalName}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <ClipboardList className="h-3 w-3" />
            <span>Atención #{item.attentionId}</span>
          </div>
        </div>
        <Badge variant="outline">{GroomingStatusLabels[item.status]}</Badge>
      </div>
      <div className="space-y-2 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-blue-500" />
          <span>{formatDateTime(item.startedAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-blue-500" />
          <span>{formatDateTime(item.finishedAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-emerald-600" />
          <span>{item.assignedProfessionalFullName ?? "Profesional no asignado"}</span>
        </div>
      </div>
      <Button
        variant="outline"
        className="w-full"
        onClick={() => onView(item.attentionId)}
      >
        Atender
      </Button>
    </CardContent>
  </Card>
);

export default function GroomingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { userInfo } = useUser();
  const branchId = userInfo?.selectedBranch.id;

  const [sessions, setSessions] = useState<GroomingSessionSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const response = await GroomingSessionService.list({
          page: 0,
          size: 200,
          branchId: branchId ?? undefined,
        });
        setSessions(response.content);
      } catch {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar las sesiones de peluquería.",
        });
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [toast, branchId]
  );

  useEffect(() => {
    void load();
  }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  };

  const filtered = useMemo(() => filterSessions(sessions, searchTerm), [sessions, searchTerm]);
  const grouped = useMemo(() => groupByStatus(filtered), [filtered]);

  const waitingCount = grouped[GroomingStatus.WAITING]?.length ?? 0;
  const inBath = grouped[GroomingStatus.BATHING]?.length ?? 0;
  const finishingCount = grouped[GroomingStatus.FINISHING]?.length ?? 0;
  const readyCount = grouped[GroomingStatus.READY_FOR_PICKUP]?.length ?? 0;

  const handleView = (attentionId: number) => {
    router.push(`/dashboard/grooming/${attentionId}`);
  };

  return (
    <div className="h-full bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Scissors className="h-7 w-7 text-pink-600" />
              Peluquería
            </h1>
            <p className="text-sm text-muted-foreground">Seguimiento del flujo de trabajo de sesiones de grooming.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? (
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
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <KpiCard title="Esperando" value={String(waitingCount)} icon={<ClipboardList className="h-5 w-5 text-slate-500" />} />
          <KpiCard title="En baño" value={String(inBath)} icon={<Bath className="h-5 w-5 text-cyan-600" />} />
          <KpiCard title="En acabado" value={String(finishingCount)} icon={<ScissorsSquare className="h-5 w-5 text-indigo-600" />} />
          <KpiCard title="Listos" value={String(readyCount)} icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />} />
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-xl">Tablero de sesiones</CardTitle>
              <p className="text-sm text-muted-foreground">Organiza las sesiones por estado y accede rápidamente al detalle.</p>
            </div>
            <Input
              placeholder="Buscar por paciente, profesional o atención..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full lg:w-80"
            />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Cargando sesiones...
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
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
                        {grouped[column.status]?.length ?? 0}
                      </span>
                    </div>
                    <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                      {(grouped[column.status] ?? []).length === 0 ? (
                        <p className="text-xs text-muted-foreground">No hay sesiones en este estado.</p>
                      ) : (
                        grouped[column.status]!.map((item) => (
                          <SessionCard key={item.id} item={item} onView={handleView} />
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
