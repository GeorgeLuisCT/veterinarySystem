// app/dashboard/grooming/components/grooming/grooming-session-form.tsx
"use client";

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, PathValue } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { FloatingLabelDateInput } from "@/components/floating-label-date-input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, User2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddGroomingMaterialModal } from "./add-material-modal";
import { ProductUnitTypeLabels } from "@/app/dashboard/inventory/_enums/product-unit-type";
import { GroomingSessionDetailResponse } from "../types/grooming-session-response";
import { AddGroomingMaterialRequest, UpdateGroomingSessionRequest, updateGroomingSessionSchema } from "../types/grooming-session-request";
import GroomingSessionService from "../service/grooming-session-service";
import { GroomingStatusLabels, GroomingStatusOptions } from "../enums/grooming-status";

export type Option = { value: string; label: string };

const fromInputDateTime = (v?: string | null) => {
  if (!v || v === "") return null;
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(v) ? v : `${v}:00`;
};

export interface GroomingSessionFormHandle {
  triggerSaveAll: () => Promise<void>;
}

interface Props {
  sessionId: number;
  detail: GroomingSessionDetailResponse;
  setDetail: (d: GroomingSessionDetailResponse) => void;
  employeeOptions: Option[];
  employeesLoading: boolean;
}

type FormShape = UpdateGroomingSessionRequest;

const GroomingSessionForm = forwardRef<GroomingSessionFormHandle, Props>(
  ({ sessionId, detail, setDetail, employeeOptions, employeesLoading }, ref) => {
    const { toast } = useToast();
    const form = useForm<FormShape>({
      resolver: zodResolver(updateGroomingSessionSchema),
      defaultValues: {
        version: detail.version,
        status: detail.status,
        startedAt: detail.startedAt ?? null,
        finishedAt: detail.finishedAt ?? null,
        assignedProfessionalId: detail.assignedProfessionalId ?? null,
        chargedPrice: detail.chargedPrice ?? null,
        behaviorNotes: detail.behaviorNotes ?? null,
        clinicalObservations: detail.clinicalObservations ?? null,
      },
      mode: "onChange",
    });

    const versionRef = useRef<number>(detail.version);

    useEffect(() => {
      form.reset({
        version: detail.version,
        status: detail.status,
        startedAt: detail.startedAt ?? null,
        finishedAt: detail.finishedAt ?? null,
        assignedProfessionalId: detail.assignedProfessionalId ?? null,
        chargedPrice: detail.chargedPrice ?? null,
        behaviorNotes: detail.behaviorNotes ?? null,
        clinicalObservations: detail.clinicalObservations ?? null,
      });
      versionRef.current = detail.version;
    }, [detail, form]);

    const patchField = useCallback(
      async (field: keyof Omit<FormShape, "version">, value: unknown) => {
        const body: UpdateGroomingSessionRequest = { version: versionRef.current } as UpdateGroomingSessionRequest;
        (body as Record<string, unknown>)[field] = value === "" ? null : value;
        const res = await GroomingSessionService.patch(sessionId, body);
        versionRef.current = res.version;
        form.setValue("version", res.version, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
        if (res.updated && res.updated[field as string] !== undefined) {
          form.setValue(field, res.updated[field as string] as PathValue<FormShape, typeof field>, { shouldDirty: false });
        }
      },
      [form, sessionId]
    );

    const debouncers = useRef<Record<string, NodeJS.Timeout>>({});
    const autosave = useCallback(
      (field: keyof Omit<FormShape, "version">, value: unknown) => {
        const key = String(field);
        if (debouncers.current[key]) clearTimeout(debouncers.current[key]);
        debouncers.current[key] = setTimeout(() => {
          patchField(field, value).catch(() => {
            toast({ variant: "destructive", description: "Conflicto de edición. Se revirtió el campo." });
          });
        }, 600);
      },
      [patchField, toast]
    );

    const saveAll = useCallback(
      async (values: FormShape) => {
        if (values.startedAt && values.finishedAt && values.finishedAt < values.startedAt) {
          toast({ variant: "destructive", description: "La hora de fin no puede ser anterior al inicio." });
          return;
        }
        const payload: UpdateGroomingSessionRequest = {
          version: versionRef.current,
          status: values.status ?? null,
          startedAt: values.startedAt ? fromInputDateTime(values.startedAt) : null,
          finishedAt: values.finishedAt ? fromInputDateTime(values.finishedAt) : null,
          assignedProfessionalId: values.assignedProfessionalId ?? null,
          chargedPrice: values.chargedPrice ?? null,
          behaviorNotes: values.behaviorNotes ?? null,
          clinicalObservations: values.clinicalObservations ?? null,
        };
        const res = await GroomingSessionService.patch(sessionId, payload);
        versionRef.current = res.version;
        form.setValue("version", res.version, { shouldDirty: false });
      },
      [form, sessionId, toast]
    );

    useImperativeHandle(
      ref,
      () => ({
        triggerSaveAll: () => form.handleSubmit(saveAll)(),
      }),
      [form, saveAll]
    );

    const [openMaterial, setOpenMaterial] = useState(false);
    const materialsEmpty = detail.materialsUsed.length === 0;

    const handleAddMaterial = async (data: AddGroomingMaterialRequest) => {
      const updated = await GroomingSessionService.addMaterial(sessionId, data);
      setDetail(updated);
      form.setValue("version", updated.version, { shouldDirty: false });
      versionRef.current = updated.version;
    };

    const statusBadge = useMemo(() => GroomingStatusLabels[detail.status], [detail.status]);

    return (
      <Form {...form}>
        <form className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detalles de la sesión</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <FormField
                control={form.control}
                name="startedAt"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelDateInput
                        id="startedAt"
                        label="Inicio"
                        mode="datetime"
                        value={field.value ?? ""}
                        onChange={(value) => {
                          const normalized = fromInputDateTime(value ?? null);
                          field.onChange(normalized);
                          autosave("startedAt", normalized);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="finishedAt"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelDateInput
                        id="finishedAt"
                        label="Fin"
                        mode="datetime"
                        value={field.value ?? ""}
                        onChange={(value) => {
                          const normalized = fromInputDateTime(value ?? null);
                          field.onChange(normalized);
                          autosave("finishedAt", normalized);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelSelect
                        id="status"
                        label="Estado"
                        options={GroomingStatusOptions}
                        value={field.value ?? ""}
                        onValueChange={(value) => {
                          field.onChange(value || null);
                          autosave("status", value || null);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="assignedProfessionalId"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelSelect
                        id="assignedProfessionalId"
                        label="Profesional"
                        options={employeeOptions}
                        value={field.value ? String(field.value) : ""}
                        onValueChange={(value) => {
                          const v = value ? Number(value) : null;
                          field.onChange(v);
                          autosave("assignedProfessionalId", v);
                        }}
                        disabled={employeesLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="chargedPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelInput
                        id="chargedPrice"
                        type="number"
                        step="0.01"
                        label="Precio cobrado"
                        value={field.value !== undefined && field.value !== null ? String(field.value) : ""}
                        onChange={(v) => {
                          const num = v === "" ? null : Number(v);
                          field.onChange(num);
                          autosave("chargedPrice", num);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{statusBadge}</Badge>
                <div className="text-sm text-muted-foreground inline-flex items-center gap-1">
                  <User2 className="h-4 w-4" />
                  {detail.assignedProfessionalFullName ?? "Sin asignar"}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notas de comportamiento</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="behaviorNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        id="behaviorNotes"
                        rows={4}
                        value={field.value ?? ""}
                        onChange={(event) => {
                          const v = event.target.value === "" ? null : event.target.value;
                          field.onChange(v);
                          autosave("behaviorNotes", v);
                        }}
                        placeholder="Ej.: Nervioso con el secador, tolera bien el baño."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Observaciones clínicas</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="clinicalObservations"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        id="clinicalObservations"
                        rows={4}
                        value={field.value ?? ""}
                        onChange={(event) => {
                          const v = event.target.value === "" ? null : event.target.value;
                          field.onChange(v);
                          autosave("clinicalObservations", v);
                        }}
                        placeholder="Ej.: Dermatitis leve en flanco derecho."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                <CardTitle>Materiales utilizados</CardTitle>
              </div>
              <Button type="button" variant="outline" onClick={() => setOpenMaterial(true)}>
                Agregar material
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {materialsEmpty ? (
                <p className="text-sm text-muted-foreground">No se registraron materiales.</p>
              ) : (
                detail.materialsUsed.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-lg border bg-white p-3 shadow-sm">
                    <div>
                      <p className="font-semibold text-slate-900">{m.productName ?? m.unregisteredProductName ?? "Material"}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.quantity} {ProductUnitTypeLabels[m.unitType]}
                        {m.unitPrice !== null ? ` • PU ${m.unitPrice}` : ""} {m.subtotal !== null ? ` • Subtotal ${m.subtotal}` : ""}
                      </p>
                    </div>
                    <Badge variant="outline">{ProductUnitTypeLabels[m.unitType]}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <AddGroomingMaterialModal
            sessionId={sessionId}
            open={openMaterial}
            onClose={() => setOpenMaterial(false)}
            onSubmit={handleAddMaterial}
          />
        </form>
      </Form>
    );
  }
);

GroomingSessionForm.displayName = "GroomingSessionForm";
export default GroomingSessionForm;
