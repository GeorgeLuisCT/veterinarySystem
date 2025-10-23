"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelMultiSelect } from "@/components/floating-label-multi-select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";

import TaskService from "../../services/task-service";
import { assignTaskSchema, AssignTaskRequest } from "../../types/task-request";
import { FieldTaskSummaryResponse } from "../../types/task-response";
import { EmployeeService } from "@/app/dashboard/staff/employees/service/employee-service";
import { EmployeeQuickSearchResponse } from "@/app/dashboard/staff/employees/types/employee-quick-search-response";
import VehicleService from "../../services/vehicle-service";
import { VehicleQuickSearchResponse } from "../../types/vehicle-quick-search-response";
import { FieldVisitSummaryResponse } from "../../types/visit-response";
import { FieldTaskStatus } from "../../enums/field-task-status";

function normalizeLocalDateTimeInputSeconds(value: string): string {
  if (!value) return value;
  if (/[zZ]|[+\-]\d{2}:?\d{2}$/.test(value)) {
    const d = new Date(value);
    if (!Number.isNaN(d.valueOf())) return d.toISOString().slice(0, 19);
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return `${value}:00`;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}$/.test(value)) return value.slice(0, 19);
  return value;
}

type Props = {
  task: FieldTaskSummaryResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssigned: (visit: FieldVisitSummaryResponse) => void;
};

export function AssignTaskModal({ task, open, onOpenChange, onAssigned }: Props) {
  const { toast } = useToast();
  const form = useForm<AssignTaskRequest>({
    resolver: zodResolver(assignTaskSchema),
    defaultValues: {
      fieldVetId: undefined,
      vehicleId: undefined,
      companionIds: [],
      scheduledDateTime: "",
      objective: "",
    } as AssignTaskRequest,
  });

  const [submitting, setSubmitting] = React.useState(false);
  const [employeeOptions, setEmployeeOptions] = React.useState<EmployeeQuickSearchResponse[]>([]);
  const [vehicleOptions, setVehicleOptions] = React.useState<VehicleQuickSearchResponse[]>([]);
  const [companionOptions, setCompanionOptions] = React.useState<EmployeeQuickSearchResponse[]>([]);

  React.useEffect(() => {
    if (open && task) {
      form.reset({
        fieldVetId: task.assignedToId ?? undefined,
        vehicleId: task.vehicleId ?? undefined,
        companionIds: [],
        scheduledDateTime: "",
        objective: "",
      } as AssignTaskRequest);
      setEmployeeOptions([]);
      setVehicleOptions([]);
      setCompanionOptions([]);
    }
  }, [open, task, form]);

  const handleSearchEmployees = React.useCallback(async (query: string) => {
    try {
      const resp = await EmployeeService.searchEmployees(query.trim());
      setEmployeeOptions(resp);
    } catch {
      setEmployeeOptions([]);
    }
  }, []);

  const handleSearchVehicles = React.useCallback(async (query: string) => {
    try {
      const resp = await VehicleService.quickSearch(query.trim(), true);
      setVehicleOptions(resp);
    } catch {
      setVehicleOptions([]);
    }
  }, []);

  const handleSearchCompanions = React.useCallback(async (query: string) => {
    try {
      const resp = await EmployeeService.searchEmployees(query.trim());
      setCompanionOptions(resp);
    } catch {
      setCompanionOptions([]);
    }
  }, []);

  const onSubmit = async (values: AssignTaskRequest) => {
    if (!task) return;
    setSubmitting(true);
    try {
      const payload: AssignTaskRequest = {
        ...values,
        scheduledDateTime: normalizeLocalDateTimeInputSeconds(values.scheduledDateTime),
        companionIds: values.companionIds ?? [],
      };
      const visit = await TaskService.assign(task.id, payload);
      toast({ title: "Visita planificada", description: "La tarea fue asignada al equipo seleccionado." });
      onAssigned(visit);
      onOpenChange(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: getAaxiosErrorMessage(error) ?? "No se pudo asignar la tarea." });
    } finally {
      setSubmitting(false);
    }
  };

  const taskTarget = React.useMemo(() => {
    if (!task) return "—";
    return task.farmName ?? task.zoneName ?? "—";
  }, [task]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Asignar tarea</DialogTitle>
          <DialogDescription>
            Selecciona el veterinario, acompañantes y vehículo para planificar la visita de {taskTarget}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="rounded-md border p-3 text-xs text-muted-foreground space-y-1">
              <div><strong>Destino:</strong> {taskTarget}</div>
              {task?.zoneName && <div><strong>Zona:</strong> {task.zoneName}</div>}
              {task?.dueAt && <div><strong>Objetivo:</strong> {task.dueAt}</div>}
              <div><strong>Estado de tarea:</strong> {task?.status ?? FieldTaskStatus.PENDING}</div>
            </div>

            <FormField
              control={form.control}
              name="fieldVetId"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelSelect
                      id="fieldVetId"
                      label="Veterinario principal"
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(val) => field.onChange(val ? Number(val) : undefined)}
                      options={employeeOptions.map((emp) => ({ value: String(emp.id), label: `${emp.name}${emp.documentNumber ? ` *( ${emp.documentNumber} )*` : ""}` }))}
                      onSearch={handleSearchEmployees}
                      emptyMessage="Sin resultados"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="vehicleId"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelSelect
                        id="vehicleId"
                        label="Vehículo"
                        value={field.value ? String(field.value) : ""}
                        onValueChange={(val) => field.onChange(val ? Number(val) : undefined)}
                        options={vehicleOptions.map((vehicle) => ({ value: String(vehicle.id), label: `${vehicle.name}${vehicle.licensePlate ? ` *( ${vehicle.licensePlate} )*` : ""}` }))}
                        onSearch={handleSearchVehicles}
                        emptyMessage="Sin resultados"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scheduledDateTime"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelInput
                        id="scheduledDateTime"
                        label="Fecha/hora programada (ISO)"
                        placeholder="2025-10-22T08:30"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="companionIds"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelMultiSelect
                      id="companionIds"
                      label="Acompañantes"
                      selected={field.value ?? []}
                      onChange={(values) => field.onChange(values)}
                      options={companionOptions.map((option) => ({ value: option.id, label: `${option.name}${option.documentNumber ? ` *( ${option.documentNumber} )*` : ""}` }))}
                      onSearch={handleSearchCompanions}
                      emptyMessage="Sin resultados"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="objective"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelInput id="objective" label="Objetivo de la visita" value={field.value ?? ""} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Asignando…" : "Asignar tarea"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
