"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, X } from "lucide-react";

import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";

import VisitService from "../services/visit-service";
import { createVisitSchema, updateVisitSchema, CreateVisitRequest, UpdateVisitRequest } from "../types/visit-request";
import { FieldVisitResponse, FieldVisitCompanionResponse } from "../types/visit-response";
import { FieldVisitStatus } from "../enums/field-visit-status";
import { FarmQuickSearchResponse } from "../types/farm-quick-search-response";
import { GeoZoneService } from "../services/geo-zone-service";
import { GeoZoneSummaryResponse } from "../types/geo-zone-response";
import { GeoZoneType } from "../enums/geo-zone-type";
import FarmService from "../services/farm-service";
import VehicleService from "../services/vehicle-service";
import { VehicleQuickSearchResponse } from "../types/vehicle-quick-search-response";
import { EmployeeService } from "@/app/dashboard/staff/service/employee-service";
import { EmployeeQuickSearchResponse } from "@/app/dashboard/staff/types/employee-quick-search-response";

function toLocalDateTimeStringSeconds(d: Date) {
  return d.toISOString().slice(0, 19);
}

function normalizeLocalDateTimeInputSeconds(value: string): string {
  if (!value) return value;
  if (/[zZ]|[+\-]\d{2}:?\d{2}$/.test(value)) {
    const d = new Date(value);
    if (!Number.isNaN(d.valueOf())) return toLocalDateTimeStringSeconds(d);
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return `${value}:00`;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}$/.test(value)) return value.slice(0, 19);
  return value;
}

export type VisitFormProps = {
  visitId?: number;
  onSuccess?: (visit: FieldVisitResponse) => void;
  onCancel?: () => void;
  showStatusField?: boolean;
};

export function VisitForm({ visitId, onSuccess, onCancel, showStatusField }: VisitFormProps) {
  const isEdit = typeof visitId === "number";
  const { toast } = useToast();
  const schema = React.useMemo(() => (isEdit ? updateVisitSchema : createVisitSchema), [isEdit]);
  const form = useForm<CreateVisitRequest | UpdateVisitRequest>({
    resolver: zodResolver(schema),
    defaultValues: {
      farmId: undefined,
      zoneId: undefined,
      fieldVetId: undefined,
      vehicleId: undefined,
      scheduledDateTime: "",
      objective: "",
      companionIds: [],
      ...(isEdit ? { status: FieldVisitStatus.PLANNED as FieldVisitStatus } : {}),
    } as any,
  });

  const [loading, setLoading] = React.useState(isEdit);
  const [submitting, setSubmitting] = React.useState(false);

  const [farmOptions, setFarmOptions] = React.useState<FarmQuickSearchResponse[]>([]);
  const [zoneOptions, setZoneOptions] = React.useState<GeoZoneSummaryResponse[]>([]);
  const [vetOptions, setVetOptions] = React.useState<EmployeeQuickSearchResponse[]>([]);
  const [vehicleOptions, setVehicleOptions] = React.useState<VehicleQuickSearchResponse[]>([]);
  const [companionOptions, setCompanionOptions] = React.useState<EmployeeQuickSearchResponse[]>([]);
  const [selectedCompanions, setSelectedCompanions] = React.useState<FieldVisitCompanionResponse[]>([]);
  const [companionSelectValue, setCompanionSelectValue] = React.useState("");

  React.useEffect(() => {
    if (!isEdit) {
      setSelectedCompanions([]);
      form.setValue("companionIds", [], { shouldDirty: false, shouldValidate: false });
    }
  }, [isEdit, form]);

  React.useEffect(() => {
    if (!isEdit || !visitId) return;
    let mounted = true;
    setLoading(true);
    VisitService.get(visitId)
      .then((data) => {
        if (!mounted) return;
        form.reset({
          farmId: data.farmId ?? undefined,
          zoneId: data.zoneId ?? undefined,
          fieldVetId: data.fieldVetId ?? undefined,
          vehicleId: data.vehicleId ?? undefined,
          scheduledDateTime: data.scheduledDateTime,
          objective: data.objective ?? "",
          status: data.status,
          companionIds: data.companions?.map((c) => c.employeeId) ?? [],
        } as any);
        setSelectedCompanions(data.companions ?? []);
        if (data.farmId && data.farmName) {
          setFarmOptions([{ id: data.farmId, name: data.farmName, customerName: undefined, zoneId: data.zoneId ?? null, zoneName: data.zoneName ?? null }]);
        }
        if (data.zoneId && data.zoneName) {
          setZoneOptions([{ id: data.zoneId, name: data.zoneName, type: GeoZoneType.SECTOR, parentId: undefined, parentName: undefined, active: true }]);
        }
        if (data.fieldVetId && data.fieldVetName) {
          setVetOptions([{ id: data.fieldVetId, name: data.fieldVetName, documentNumber: "" } as any]);
        }
        if (data.vehicleId && data.vehicleName) {
          setVehicleOptions([{ id: data.vehicleId, name: data.vehicleName, licensePlate: undefined, active: true }]);
        }
      })
      .catch((error) => {
        toast({ variant: "destructive", title: "Error", description: getAaxiosErrorMessage(error) ?? "No se pudo cargar la visita." });
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [isEdit, visitId, form, toast]);

  const handleSearchFarms = React.useCallback(async (query: string) => {
    try {
      const zoneId = form.getValues("zoneId") as number | undefined;
      const items = await FarmService.quickSearch(query, zoneId);
      setFarmOptions(items);
    } catch {
      setFarmOptions([]);
    }
  }, [form]);

  const handleSearchZones = React.useCallback(async (query: string) => {
    try {
      const resp = await GeoZoneService.list({ q: query, size: 10, page: 0 });
      setZoneOptions(resp.content);
    } catch {
      setZoneOptions([]);
    }
  }, []);

  const handleSearchEmployees = React.useCallback(async (query: string) => {
    try {
      const items = await EmployeeService.searchEmployees(query.trim());
      setVetOptions(items);
    } catch {
      setVetOptions([]);
    }
  }, []);

  const handleSearchVehicles = React.useCallback(async (query: string) => {
    try {
      const items = await VehicleService.quickSearch(query.trim(), true);
      setVehicleOptions(items);
    } catch {
      setVehicleOptions([]);
    }
  }, []);

  const handleSearchCompanions = React.useCallback(async (query: string) => {
    try {
      const items = await EmployeeService.searchEmployees(query.trim());
      setCompanionOptions(items);
    } catch {
      setCompanionOptions([]);
    }
  }, []);

  const addCompanion = (employee: EmployeeQuickSearchResponse) => {
    const currentIds = form.getValues("companionIds") as number[];
    if (currentIds.includes(employee.id)) {
      setCompanionSelectValue("");
      return;
    }
    const updatedIds = [...currentIds, employee.id];
    form.setValue("companionIds", updatedIds, { shouldDirty: true, shouldValidate: true });
    setSelectedCompanions((prev) => [...prev, { employeeId: employee.id, employeeName: employee.name }]);
    setCompanionSelectValue("");
  };

  const removeCompanion = (employeeId: number) => {
    const currentIds = form.getValues("companionIds") as number[];
    const updatedIds = currentIds.filter((id) => id !== employeeId);
    form.setValue("companionIds", updatedIds, { shouldDirty: true, shouldValidate: true });
    setSelectedCompanions((prev) => prev.filter((c) => c.employeeId !== employeeId));
  };

  const onSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      const payload: CreateVisitRequest | UpdateVisitRequest = {
        ...values,
        scheduledDateTime: normalizeLocalDateTimeInputSeconds(values.scheduledDateTime),
      };
      const response = isEdit && visitId ? await VisitService.update(visitId, payload as UpdateVisitRequest) : await VisitService.create(payload as CreateVisitRequest);
      onSuccess?.(response);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: getAaxiosErrorMessage(error) ?? "No se pudo guardar la visita." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form {...(form as any)}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        {loading ? (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Cargando visita…
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="farmId"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelSelect
                        id="farmId"
                        label="Finca"
                        value={field.value ? String(field.value) : ""}
                        onValueChange={(v) => {
                          const selected = farmOptions.find((f) => String(f.id) === v);
                          field.onChange(v ? Number(v) : undefined);
                          if (selected?.zoneId) {
                            form.setValue("zoneId", selected.zoneId, { shouldDirty: true, shouldValidate: true });
                            setZoneOptions((prev) => {
                              if (prev.some((z) => z.id === selected.zoneId)) return prev;
                              return [
                                ...prev,
                                {
                                  id: selected.zoneId,
                                  name: selected.zoneName ?? "Zona asociada",
                                  type: GeoZoneType.SECTOR,
                                  parentId: undefined,
                                  parentName: undefined,
                                  active: true,
                                },
                              ];
                            });
                          } else {
                            form.setValue("zoneId", undefined, { shouldDirty: true, shouldValidate: true });
                          }
                        }}
                        options={farmOptions.map((f) => ({ value: String(f.id), label: `${f.name}${f.customerName ? ` *( ${f.customerName} )*` : ""}` }))}
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
                name="zoneId"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelSelect
                        id="zoneId"
                        label="Zona"
                        value={field.value ? String(field.value) : ""}
                        onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}
                        options={zoneOptions.map((z) => ({ value: String(z.id), label: `${z.name}${z.parentName ? ` – ${z.parentName}` : ""}` }))}
                        onSearch={handleSearchZones}
                        emptyMessage="Sin resultados"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="fieldVetId"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelSelect
                        id="fieldVetId"
                        label="Veterinario/a principal"
                        value={field.value ? String(field.value) : ""}
                        onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}
                        options={vetOptions.map((e) => ({ value: String(e.id), label: `${e.name}${e.documentNumber ? ` *( ${e.documentNumber} )*` : ""}` }))}
                        onSearch={handleSearchEmployees}
                        emptyMessage="Sin resultados"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vehicleId"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelSelect
                        id="vehicleId"
                        label="Vehículo asignado"
                        value={field.value ? String(field.value) : ""}
                        onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}
                        options={vehicleOptions.map((v) => ({ value: String(v.id), label: `${v.name}${v.licensePlate ? ` *( ${v.licensePlate} )*` : ""}` }))}
                        onSearch={handleSearchVehicles}
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
              name="scheduledDateTime"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelInput
                      id="scheduledDateTime"
                      label="Fecha y hora (ISO 8601)"
                      value={field.value as string}
                      onChange={field.onChange}
                      placeholder="2025-10-22T14:30"
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
                    <FloatingLabelInput id="objective" label="Objetivo" value={(field.value as string) ?? ""} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FloatingLabelSelect
                id="companionAdder"
                label="Agregar acompañante"
                value={companionSelectValue}
                onValueChange={(v) => {
                  setCompanionSelectValue(v);
                  const option = companionOptions.find((c) => String(c.id) === v);
                  if (option) {
                    addCompanion(option);
                  }
                }}
                options={companionOptions.map((c) => ({ value: String(c.id), label: `${c.name}${c.documentNumber ? ` *( ${c.documentNumber} )*` : ""}` }))}
                onSearch={handleSearchCompanions}
                emptyMessage="Sin resultados"
              />
              <div className="flex flex-wrap gap-2">
                {selectedCompanions.map((companion) => (
                  <span key={companion.employeeId} className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs">
                    {companion.employeeName}
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => removeCompanion(companion.employeeId)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {selectedCompanions.length === 0 && (
                  <span className="text-xs text-muted-foreground">Sin acompañantes seleccionados</span>
                )}
              </div>
            </div>

            {isEdit && (showStatusField ?? true) && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelSelect
                        id="status"
                        label="Estado"
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                        options={Object.values(FieldVisitStatus).map((status) => ({ value: status, label: status }))}
                        emptyMessage="Sin resultados"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-2 pt-2">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
                  Cancelar
                </Button>
              )}
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? "Guardar" : "Crear"}
              </Button>
            </div>
          </>
        )}
      </form>
    </Form>
  );
}
