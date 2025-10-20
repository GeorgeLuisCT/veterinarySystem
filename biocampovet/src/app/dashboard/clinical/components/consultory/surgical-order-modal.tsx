"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  addClinicalAttentionSurgicalOrderSchema,
  AddClinicalAttentionSurgicalOrderRequest,
} from "../../types/clinical-attention-request";
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from "@/components/ui/form";
import { ClinicalAttentionService } from "../../service/clinical-attention-service";
import { SurgicalOrderStatus, SurgicalOrderStatusLabels } from "@/app/dashboard/schedule/enums/surgical-order-status";
import { ClinicalAttentionDetailResponse } from "../../types/clinical-attention-response";
import { useUser } from "@/context/user-context";
import ClinicalServiceService from "../../service/clinical-service-service";
import { OperatingRoomService } from "@/app/dashboard/branche/services/operating-room-service";

type CommonProps = {
  id: number;
  onClose: () => void;
  onAdded: (data: ClinicalAttentionDetailResponse) => void;
};

export function SurgicalOrderModal({ id, onClose, onAdded }: CommonProps) {
  const { userInfo } = useUser();
  const [submitting, setSubmitting] = useState(false);
  const [serviceOptions, setServiceOptions] = useState<{ value: string; label: string }[]>([]);
  const [operationRoomOptions, setOperationRoomOptions] = useState<{ value: string; label: string }[]>([]);

  const form = useForm<AddClinicalAttentionSurgicalOrderRequest>({
    resolver: zodResolver(addClinicalAttentionSurgicalOrderSchema),
    defaultValues: {
      recommendedServiceId: undefined,
      requestedByEmployeeId: userInfo?.employeeId || undefined,
      operatingRoomId: undefined,
      status: SurgicalOrderStatus.PENDING,
      notes: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (userInfo?.employeeId) {
      form.setValue("requestedByEmployeeId", userInfo.employeeId);
    }
  }, [userInfo, form]);

  useEffect(() => {
    const fetchOperationRooms = async () => {
      if (!userInfo?.selectedBranch.id) {
        setOperationRoomOptions([]);
        return;
      }
      try {
        const results = await OperatingRoomService.listByBranch(userInfo.selectedBranch.id);
        setOperationRoomOptions(results.map((room) => ({ value: String(room.id), label: room.name })));
      } catch {
        setOperationRoomOptions([]);
      }
    };
    fetchOperationRooms();
  }, [userInfo?.selectedBranch.id]);

  const handleSearchServices = async (query: string) => {
    const q = query.trim();
    if (q.length < 2) {
      setServiceOptions([]);
      return;
    }
    try {
      const results = await ClinicalServiceService.quickSearch(q, userInfo?.selectedBranch.id);
      setServiceOptions(results.map((s) => ({ value: String(s.id), label: s.name })));
    } catch {
      setServiceOptions([]);
    }
  };

  const onSubmit = async (values: AddClinicalAttentionSurgicalOrderRequest) => {
    setSubmitting(true);
    try {
      const res = await ClinicalAttentionService.addSurgicalOrder(id, values);
      onAdded(res);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const statusOptions = useMemo(
    () => Object.entries(SurgicalOrderStatusLabels).map(([value, label]) => ({ value, label })),
    []
  );

  const hasRooms = operationRoomOptions.length > 0;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="w-[min(92vw,960px)] max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-2xl sm:max-w-3xl">
        <DialogHeader className="space-y-2">
          <DialogTitle>Crear orden quirúrgica</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Indica el procedimiento recomendado, la sala de operaciones y el estado. Añade observaciones clínicas si es necesario.
          </p>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
            {/* Datos de la orden */}
            <fieldset className="rounded-2xl border p-5">
              <legend className="px-2 text-sm font-medium text-muted-foreground">Datos de la orden</legend>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Servicio recomendado */}
                <FormField
                  control={form.control}
                  name="recommendedServiceId"
                  render={({ field }) => (
                    <FormItem className="space-y-2 sm:col-span-2">
                      <FormControl>
                        <div className="w-full">
                          <FloatingLabelSelect
                            id="recommendedServiceId"
                            label="Sirugía a realizar"
                            placeholder="Buscar sirugía…"
                            options={serviceOptions}
                            onSearch={handleSearchServices}
                            value={field.value ? String(field.value) : ""}
                            onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}
                          />
                        </div>
                      </FormControl>
                      <p className="text-xs text-muted-foreground">Escribe 2+ caracteres para buscar.</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Sala de operaciones (ocupa 2 cols en desktop si quieres más aire) */}
                <FormField
                  control={form.control}
                  name="operatingRoomId"
                  render={({ field }) => (
                    <FormItem className="space-y-2 sm:col-span-2">
                      <FormControl>
                        <div className="w-full">
                          <FloatingLabelSelect
                            id="operationRoomId"
                            label="Sala de operaciones"
                            placeholder={hasRooms ? "Selecciona una sala…" : "No hay salas disponibles"}
                            options={operationRoomOptions}
                            value={field.value ? String(field.value) : ""}
                            onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}
                          />
                        </div>
                      </FormControl>
                      {!hasRooms && (
                        <p className="text-xs text-amber-600">
                          No se encontraron salas para esta sucursal. Verifica la configuración de la sede.
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </fieldset>

            {/* Observaciones */}
            <fieldset className="rounded-2xl border p-5">
              <legend className="px-2 text-sm font-medium text-muted-foreground">Observaciones</legend>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormControl>
                      <Textarea
                        id="notes"
                        rows={4}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.value)}
                        placeholder="Ej.: Observaciones: ayuno 8 h; control preanestésico; consentimiento informado."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </fieldset>

            <DialogFooter className="gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!form.formState.isValid || submitting}>
                {submitting ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
