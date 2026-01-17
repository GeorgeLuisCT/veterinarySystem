"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";
import TaskService from "../../services/task-service";
import type { FieldTaskSummaryResponse, FieldTaskResponse } from "../../types/task-response";
import { FieldTaskPriority, FieldTaskPriorityLabels } from "../../enums/field-task-priority";
import { FieldTaskStatus } from "../../enums/field-task-status";
import { CreateTaskModal } from "./create-task-modal";
import { AssignTaskModal } from "./assign-task-modal";
import {
  AlertTriangle,
  RefreshCw,
  PlusCircle,
  MapPin,
  Home,
  CalendarClock,
  User2,
  Truck,
  ChevronRight,
  SendHorizonal,
} from "lucide-react";

export default function PendingTasksCard() {
  const { toast } = useToast();
  const [pendingTasks, setPendingTasks] = React.useState<FieldTaskSummaryResponse[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [selectedTask, setSelectedTask] = React.useState<FieldTaskSummaryResponse | null>(null);

  const loadPending = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await TaskService.list({ status: FieldTaskStatus.PENDING, size: 100, page: 0 });
      setPendingTasks(res.content ?? []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: getAaxiosErrorMessage(error) ?? "No se pudieron obtener las tareas.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    loadPending();
  }, [loadPending]);

  const onCreated = (tasks: FieldTaskResponse[]) => {
    if (!tasks?.length) return;
    loadPending();
  };

  const onAssigned = async () => {
    setSelectedTask(null);
    await loadPending();
    toast({ title: "Visita programada", description: "Se asignó el equipo correctamente." });
  };

  const priorityClasses = {
    [FieldTaskPriority.URGENT]: "bg-red-200/70 text-red-800 ring-1 ring-red-300",
    [FieldTaskPriority.HIGH]: "bg-red-100/80 text-red-700 ring-1 ring-red-200",
    [FieldTaskPriority.MEDIUM]: "bg-amber-100/80 text-amber-700 ring-1 ring-amber-200",
    [FieldTaskPriority.LOW]: "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200",
  } as const satisfies Record<FieldTaskPriority, string>;

  const leftBarClasses = {
    [FieldTaskPriority.URGENT]: "bg-red-700",
    [FieldTaskPriority.HIGH]: "bg-red-500",
    [FieldTaskPriority.MEDIUM]: "bg-amber-500",
    [FieldTaskPriority.LOW]: "bg-zinc-400",
  } as const satisfies Record<FieldTaskPriority, string>;

  const priorityOrder: Record<FieldTaskPriority, number> = {
    [FieldTaskPriority.URGENT]: 0,
    [FieldTaskPriority.HIGH]: 1,
    [FieldTaskPriority.MEDIUM]: 2,
    [FieldTaskPriority.LOW]: 3,
  };

  const fmt = (iso?: string | null) =>
    iso
      ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso))
      : null;

  const groups = React.useMemo(() => {
    const byZone = new Map<
      string,
      { zoneName: string; tasks: FieldTaskSummaryResponse[]; counts: Record<FieldTaskPriority, number> }
    >();

    for (const t of pendingTasks) {
      const key = t.zoneName ?? "Sin zona";
      if (!byZone.has(key)) {
        byZone.set(key, {
          zoneName: key,
          tasks: [],
          counts: {
            [FieldTaskPriority.URGENT]: 0,
            [FieldTaskPriority.HIGH]: 0,
            [FieldTaskPriority.MEDIUM]: 0,
            [FieldTaskPriority.LOW]: 0,
          },
        });
      }
      const g = byZone.get(key)!;
      g.tasks.push(t);
      g.counts[t.priority]++;
    }

    return Array.from(byZone.values()).sort((a, b) => {
      for (const p of [FieldTaskPriority.URGENT, FieldTaskPriority.HIGH, FieldTaskPriority.MEDIUM, FieldTaskPriority.LOW]) {
        const diff = b.counts[p] - a.counts[p];
        if (diff !== 0) return diff;
      }
      return a.zoneName.localeCompare(b.zoneName);
    });
  }, [pendingTasks]);

  const ZoneHeader = ({
    name,
    counts,
    total,
  }: {
    name: string;
    counts: Record<FieldTaskPriority, number>;
    total: number;
  }) => (
    // Sin borde, layout horizontal
    <div className="flex w-full items-center justify-between gap-3 px-1">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-full bg-primary/10">
          <MapPin className="size-4 text-primary" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate font-semibold">{name}</span>
            <Badge variant="secondary" className="shrink-0">
              {total} tareas
            </Badge>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {counts[FieldTaskPriority.URGENT] > 0 && (
          <Badge variant="secondary" className={priorityClasses[FieldTaskPriority.URGENT]}>
            {counts[FieldTaskPriority.URGENT]} urgentes
          </Badge>
        )}
        {counts[FieldTaskPriority.HIGH] > 0 && (
          <Badge variant="secondary" className={priorityClasses[FieldTaskPriority.HIGH]}>
            {counts[FieldTaskPriority.HIGH]} altas
          </Badge>
        )}
        {counts[FieldTaskPriority.MEDIUM] > 0 && (
          <Badge variant="secondary" className={priorityClasses[FieldTaskPriority.MEDIUM]}>
            {counts[FieldTaskPriority.MEDIUM]} medias
          </Badge>
        )}
        {counts[FieldTaskPriority.LOW] > 0 && (
          <Badge variant="secondary" className={priorityClasses[FieldTaskPriority.LOW]}>
            {counts[FieldTaskPriority.LOW]} bajas
          </Badge>
        )}
      </div>
    </div>
  );

  return (
    <Card className="h-full gap-2 overflow-y-auto">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">Tareas por Asignar</CardTitle>
          <p className="text-sm text-muted-foreground">Planificaciones sin equipo asignado, agrupadas por zona.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={loadPending} disabled={loading} className="gap-1">
            <RefreshCw className="size-4" />
            Actualizar
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1">
            <PlusCircle className="size-4" />
            Crear Tarea
          </Button>
          <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)} className="gap-1">
            <AlertTriangle className="size-4" />
            Crear Tarea Urgente
          </Button>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="py-0 px-2">
        {loading ? (
          <div className="space-y-2 p-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border bg-background p-3">
                <div className="h-full w-1 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-64 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-48 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-8 w-24 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : pendingTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-10 text-center">
            <AlertTriangle className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No hay tareas pendientes. ¡Excelente!</p>
            <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1">
              <PlusCircle className="size-4" />
              Crear tarea
            </Button>
          </div>
        ) : (
          <div className="py-0">
            <Accordion type="multiple" className="space-y-1">
              {groups.map((group, idx) => {
                const total = group.tasks.length;
                const sorted = [...group.tasks].sort((a, b) => {
                  const pa = priorityOrder[a.priority];
                  const pb = priorityOrder[b.priority];
                  if (pa !== pb) return pa - pb;
                  const ad = a.dueAt ? new Date(a.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
                  const bd = b.dueAt ? new Date(b.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
                  return ad - bd;
                });

                return (
                  <AccordionItem
                    key={group.zoneName + idx}
                    value={group.zoneName + idx}
                    className="rounded-xl border-primary bg-card border-t-0 border-x-0"
                  >
                    <AccordionTrigger className="px-0 py-2 hover:no-underline">
                      <ZoneHeader name={group.zoneName} counts={group.counts} total={total} />
                    </AccordionTrigger>
                    <AccordionContent className="pb-2">
                      <div className="divide-y">
                        {sorted.map((task) => {
                          const destination = task.farmName ?? "—";
                          const due = fmt(task.dueAt);
                          return (
                            <div
                              key={task.id}
                              className="relative flex items-stretch gap-3 p-3 transition-colors hover:bg-accent/30"
                            >
                              <div
                                className={`absolute left-0 top-0 h-full w-1 rounded-r ${leftBarClasses[task.priority]}`}
                              />
                              <div className="flex w-full items-center gap-4 pl-2">
                                <div className="flex min-w-0 flex-1 items-center gap-3">
                                  <Badge variant="secondary" className={priorityClasses[task.priority]}>
                                    {FieldTaskPriorityLabels[task.priority]}
                                  </Badge>

                                  <div className="min-w-0 flex align-center justify-center gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="truncate font-semibold">{task.title}</span>
                                      <ChevronRight className="size-4 text-muted-foreground" />
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        <Home className="size-3.5" />
                                        {destination !== "—" ? destination : "Sin granja"}
                                      </span>
                                      {due && (
                                        <span className="flex items-center gap-1">
                                          <CalendarClock className="size-3.5" />
                                          {due}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="hidden shrink-0 items-center gap-2 md:flex">
                                  {task.assignedToName && (
                                    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs text-foreground/80">
                                      <User2 className="size-3.5" />
                                      {task.assignedToName}
                                    </span>
                                  )}
                                  {task.vehicleName && (
                                    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs text-foreground/80">
                                      <Truck className="size-3.5" />
                                      {task.vehicleName}
                                    </span>
                                  )}
                                </div>

                                <div className="flex shrink-0 items-center">
                                  <Button size="sm" variant="secondary" className="gap-1 cursor-pointer" onClick={() => setSelectedTask(task)}>
                                    <SendHorizonal className="size-4" />
                                    Asignar
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        )}
      </CardContent>

      <CreateTaskModal open={createOpen} onOpenChange={setCreateOpen} onCreated={onCreated} />
      <AssignTaskModal
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
        onAssigned={onAssigned}
      />
    </Card>
  );
}
