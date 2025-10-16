"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addClinicalAttentionSurgicalOrderSchema, AddClinicalAttentionSurgicalOrderRequest } from "../../types/clinical-attention-request";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
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
      operationRoomId: undefined,
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
      if (userInfo?.selectedBranch.id) {
        try {
          const results = await OperatingRoomService.listByBranch(userInfo.selectedBranch.id);
          const options = results.map((room) => ({
            value: String(room.id),
            label: room.name,
          }));
          setOperationRoomOptions(options);
        } catch (error) {
          console.error("Error fetching operating rooms:", error);
          setOperationRoomOptions([]);
        }
      }
    };

    fetchOperationRooms();
  }, [userInfo?.selectedBranch.id]);

  const handleSearchServices = async (query: string) => {
    if (query.length < 2) {
      setServiceOptions([]);
      return;
    }
    try {
      const results = await ClinicalServiceService.quickSearch(query, userInfo?.selectedBranch.id);
      const options = results.map((service) => ({
        value: String(service.id),
        label: service.name,
      }));
      setServiceOptions(options);
    } catch (error) {
      console.error("Error searching services:", error);
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

  const statusOptions = Object.entries(SurgicalOrderStatusLabels).map(([value, label]) => ({ value, label }));

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Crear orden quirúrgica</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="recommendedServiceId"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelSelect
                      id="recommendedServiceId"
                      label="Servicio recomendado"
                      placeholder="Buscar servicio..."
                      options={serviceOptions}
                      onSearch={handleSearchServices}
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="operationRoomId"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelSelect
                      id="operationRoomId"
                      label="Sala de operaciones"
                      placeholder="Seleccionar sala de operaciones..."
                      options={operationRoomOptions}
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}
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
                      value={field.value ?? ""}
                      options={statusOptions}
                      onValueChange={(v) => field.onChange(v || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      id="notes"
                      rows={3}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.value)}
                      placeholder="Notas (opcional)"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
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