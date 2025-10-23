"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { FloatingLabelMultiSelect } from "@/components/floating-label-multi-select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";

import TaskService from "../../services/task-service";
import { createTaskSchema, CreateTaskRequest } from "../../types/task-request";
import { FieldTaskPriorityOptions, FieldTaskPriority } from "../../enums/field-task-priority";
import { FieldTaskStatus } from "../../enums/field-task-status";
import { GeoZoneService } from "../../services/geo-zone-service";
import { GeoZoneSummaryResponse } from "../../types/geo-zone-response";
import FarmService from "../../services/farm-service";
import { FarmQuickSearchResponse } from "../../types/farm-quick-search-response";
import { FieldTaskResponse } from "../../types/task-response";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (tasks: FieldTaskResponse[]) => void;
};

export function CreateTaskModal({ open, onOpenChange, onCreated }: Props) {
  const { toast } = useToast();
  const form = useForm<CreateTaskRequest>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: "",
      zoneId: undefined,
      farmIds: [],
      description: "",
      priority: FieldTaskPriority.MEDIUM,
      status: FieldTaskStatus.PENDING,
      dueAt: undefined,
    },
  });

  const [saving, setSaving] = React.useState(false);
  const [zoneOptions, setZoneOptions] = React.useState<GeoZoneSummaryResponse[]>([]);
  const [farmOptions, setFarmOptions] = React.useState<FarmQuickSearchResponse[]>([]);

  React.useEffect(() => {
    if (!open) {
      form.reset({
        title: "",
        zoneId: undefined,
        farmIds: [],
        description: "",
        priority: FieldTaskPriority.MEDIUM,
        status: FieldTaskStatus.PENDING,
        dueAt: undefined,
      } as CreateTaskRequest);
      setZoneOptions([]);
      setFarmOptions([]);
    }
  }, [open, form]);

  const handleSearchZones = React.useCallback(async (query: string) => {
    try {
      const resp = await GeoZoneService.list({ q: query, page: 0, size: 10 });
      setZoneOptions(resp.content);
    } catch {
      setZoneOptions([]);
    }
  }, []);

  const handleSearchFarms = React.useCallback(
    async (query: string) => {
      try {
        const zoneId = form.getValues("zoneId");
        const resp = await FarmService.quickSearch(query, zoneId);
        setFarmOptions(resp);
      } catch {
        setFarmOptions([]);
      }
    },
    [form]
  );

  const onSubmit = async (values: CreateTaskRequest) => {
    setSaving(true);
    try {
      const tasks = await TaskService.create(values);
      toast({ title: "Tarea creada", description: "Se registró la planificación en estado pendiente." });
      onCreated(tasks);
      onOpenChange(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: getAaxiosErrorMessage(error) ?? "No se pudo crear la tarea." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crear tarea de campo</DialogTitle>
          <DialogDescription>Registra las granjas que requieren planificación antes de asignar un equipo.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelInput id="title" label="Título" value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="zoneId"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelSelect
                        id="zoneId"
                        label="Zona (opcional)"
                        value={field.value ? String(field.value) : ""}
                        onValueChange={(val) => {
                          const parsed = val ? Number(val) : undefined;
                          field.onChange(parsed);
                          form.setValue("farmIds", [], { shouldDirty: true });
                        }}
                        options={zoneOptions.map((zone) => ({ value: String(zone.id), label: `${zone.name}${zone.parentName ? ` – ${zone.parentName}` : ""}` }))}
                        onSearch={handleSearchZones}
                        emptyMessage="Sin resultados"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelSelect
                        id="priority"
                        label="Prioridad"
                        value={field.value}
                        onValueChange={field.onChange}
                        options={FieldTaskPriorityOptions.map((opt) => ({ value: opt.value, label: opt.label }))}
                        emptyMessage="Sin resultados"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="farmIds"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelMultiSelect
                      id="farmIds"
                      label="Granjas a visitar"
                      selected={field.value}
                      onChange={(values) => field.onChange(values)}
                      options={farmOptions.map((farm) => ({ value: farm.id, label: `${farm.name}${farm.customerName ? ` – ${farm.customerName}` : ""}` }))}
                      onSearch={handleSearchFarms}
                      emptyMessage="Sin resultados"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelInput id="description" label="Descripción" value={field.value ?? ""} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueAt"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelInput
                      id="dueAt"
                      label="Fecha objetivo (opcional, ISO 8601)"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="2025-10-22T08:00"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando…" : "Crear tarea"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
