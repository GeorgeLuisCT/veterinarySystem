"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";
import TaskService from "../../services/task-service";
import VisitService from "../../services/visit-service";
import type { FieldTaskSummaryResponse, FieldTaskResponse } from "../../types/task-response";
import type { FieldVisitSummaryResponse } from "../../types/visit-response";
import { FieldTaskPriorityLabels } from "../../enums/field-task-priority";
import { FieldTaskStatus } from "../../enums/field-task-status";
import { CreateTaskModal } from "./create-task-modal";
import { AssignTaskModal } from "./assign-task-modal";

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
      toast({ variant: "destructive", title: "Error", description: getAaxiosErrorMessage(error) ?? "No se pudieron obtener las tareas." });
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

  const onAssigned = async (_visit: FieldVisitSummaryResponse) => {
    setSelectedTask(null);
    await loadPending();
    toast({ title: "Visita programada", description: "Se asignó el equipo correctamente." });
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Tareas pendientes</CardTitle>
          <p className="text-sm text-muted-foreground">Planificaciones sin equipo asignado.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={loadPending} disabled={loading}>Actualizar</Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>Crear tarea</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {pendingTasks.map((task) => (
            <div key={task.id} className="flex flex-col gap-2 rounded-xl border p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-semibold leading-tight">{task.title}</div>
                <div className="text-xs text-muted-foreground">Destino: {task.farmName ?? task.zoneName ?? "—"} · Prioridad: {FieldTaskPriorityLabels[task.priority]}</div>
                {task.dueAt && <div className="text-xs text-muted-foreground">Fecha objetivo: {new Date(task.dueAt).toLocaleString()}</div>}
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => setSelectedTask(task)}>Asignar</Button>
              </div>
            </div>
          ))}
          {!loading && pendingTasks.length === 0 && <div className="text-sm text-muted-foreground">No hay tareas pendientes. ¡Excelente!</div>}
          {loading && <div className="text-sm text-muted-foreground">Cargando tareas…</div>}
        </div>
      </CardContent>

      <CreateTaskModal open={createOpen} onOpenChange={setCreateOpen} onCreated={onCreated} />
      <AssignTaskModal task={selectedTask} open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)} onAssigned={onAssigned} />
    </Card>
  );
}

