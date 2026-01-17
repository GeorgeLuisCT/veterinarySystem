"use client";

import * as React from "react";
import { useMemo, useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { Textarea } from "@/components/ui/textarea";

import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";
import { useUser } from "@/context/user-context";

import {
  createHospitalizationSchema,
  type CreateHospitalizationRequest,
} from "../../types/hospitalization-request";
import HospitalizationService from "../../service/hospitalization-service";
import { ClinicalAttentionDetailResponse } from "../../types/clinical-attention-response";

import {
  AdmissionTiming,
  AdmissionTimingOptions,
} from "../../enums/admission-timing";
import {
  HospitalizationCause,
  HospitalizationCauseOptions,
} from "../../enums/hospitalization-cause";

import { ClinicalServiceCategory } from "../../enums/clinical-service-category";
import CageService from "../../service/cage-service";
import { PaginatedResponse } from "@/types/paginated-response";
import { CageResponse } from "../../types/cage-response";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detail: ClinicalAttentionDetailResponse;
  onCreated?: (created: unknown) => void;
};

export default function DeriveHospitalizationModal({ open, onOpenChange, detail, onCreated }: Props) {
  const { toast } = useToast();
  const { userInfo } = useUser();

  const selectedBranchId = userInfo?.selectedBranch?.id ?? null;
  const branchId = useMemo(
    () => selectedBranchId ?? detail.attention?.branchId ?? null,
    [selectedBranchId, detail.attention?.branchId]
  );

  const animalId = useMemo(
    () => detail.attention?.animalId ?? null,
    [detail.attention?.animalId]
  );

  // Trae los servicios de la atención con su categoría
  const serviceItems = useMemo(() => detail.serviceItems ?? [], [detail.serviceItems]);

  console.log("detail", detail);
  console.log("serviceItems", serviceItems);
  console.log("detail.serviceItems", detail.serviceItems);

  // Timing limitado: DURING_ATTENTION / AFTER_ATTENTION
  const timingOptionsLimited = useMemo(
    () =>
      AdmissionTimingOptions.filter(
        (o) =>
          o.value === AdmissionTiming.DURING_ATTENTION ||
          o.value === AdmissionTiming.AFTER_ATTENTION
      ),
    []
  );

  const form = useForm<CreateHospitalizationRequest>({
    resolver: zodResolver(createHospitalizationSchema),
    defaultValues: {
      animalId: animalId ?? 0,
      cageId: 0,
      attentionId: detail.attention?.id ?? null,
      admissionTiming: AdmissionTiming.DURING_ATTENTION,
      cause: null,
      clinicalServiceId: null,
      admissionNotes: "",
    },
    mode: "onChange",
  });

  // Reset de valores al abrir
  useEffect(() => {
    if (!open) return;
    form.reset({
      animalId: animalId ?? 0,
      cageId: 0,
      attentionId: detail.attention?.id ?? null,
      admissionTiming: AdmissionTiming.DURING_ATTENTION,
      cause: null,
      clinicalServiceId: null,
      admissionNotes: "",
    });
  }, [open, animalId, detail.attention?.id, form]);

  // Cargar jaulas de la sucursal (solo libres)
  const [cagesLoading, setCagesLoading] = useState(false);
  const [cages, setCages] = useState<CageResponse[]>([]);

  useEffect(() => {
    if (!open || !branchId) return;
    setCagesLoading(true);
    (async () => {
      try {
        const resp: PaginatedResponse<CageResponse> = await CageService.list({
          branchId,
          isOccupied: false,
          page: 0,
          pageSize: 50,
        });
        setCages(resp.content ?? []);
      } catch (e) {
        toast({
          variant: "destructive",
          title: "Error",
          description:
            getAaxiosErrorMessage(e) ??
            "No se pudieron cargar las jaulas disponibles.",
        });
        setCages([]);
      } finally {
        setCagesLoading(false);
      }
    })();
  }, [open, branchId, toast]);

  // Observa el servicio elegido para limitar las causas
  const selectedServiceId = useWatch({
    control: form.control,
    name: "clinicalServiceId",
  });

  const selectedServiceCategory: ClinicalServiceCategory | null = useMemo(() => {
    if (!selectedServiceId) return null;
    const found = serviceItems.find(
      (s) => s.clinicalServiceId === selectedServiceId
    );
    return found?.clinicalServiceCategory ?? null;
  }, [selectedServiceId, serviceItems]);


  const allowedCauseOptions = useMemo(() => {
    const byCategory: Record<ClinicalServiceCategory | "DEFAULT", HospitalizationCause[]> = {
      [ClinicalServiceCategory.SURGERY]: [
        HospitalizationCause.PRE_SURGERY,
        HospitalizationCause.MEDICATION_MONITORING,
      ],
      [ClinicalServiceCategory.GROOMING]: [
        HospitalizationCause.PRE_GROOMING,
        HospitalizationCause.MEDICATION_MONITORING,
      ],
      [ClinicalServiceCategory.CONSULTATION]: [
        HospitalizationCause.CLINICAL_OBSERVATION,
        HospitalizationCause.MEDICATION_MONITORING,
      ],
      [ClinicalServiceCategory.VACCINATION]: [
        HospitalizationCause.CLINICAL_OBSERVATION,
        HospitalizationCause.MEDICATION_MONITORING,
      ],
      [ClinicalServiceCategory.DEWORMING]: [
        HospitalizationCause.CLINICAL_OBSERVATION,
        HospitalizationCause.MEDICATION_MONITORING,
      ],
      [ClinicalServiceCategory.LABORATORY]: [
        HospitalizationCause.CLINICAL_OBSERVATION,
        HospitalizationCause.MEDICATION_MONITORING,
      ],
      [ClinicalServiceCategory.OTHER]: [
        HospitalizationCause.CLINICAL_OBSERVATION,
        HospitalizationCause.MEDICATION_MONITORING,
      ],
      DEFAULT: [
        HospitalizationCause.CLINICAL_OBSERVATION,
        HospitalizationCause.MEDICATION_MONITORING,
      ],
    };

    const cat = selectedServiceCategory ?? "DEFAULT";
    const allowed = new Set(byCategory[cat] ?? byCategory.DEFAULT);

    return HospitalizationCauseOptions.filter(opt => allowed.has(opt.value));
  }, [selectedServiceCategory]);


  // Si la causa actual no está permitida, ajusta a una por defecto
  const currentCause = useWatch({ control: form.control, name: "cause" });
  useEffect(() => {
    if (!open) return;
    if (!allowedCauseOptions.length) return;
    const allowedValues = new Set(allowedCauseOptions.map((o) => o.value));
    if (!currentCause || !allowedValues.has(currentCause)) {
      form.setValue("cause", allowedCauseOptions[0]?.value ?? null, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [allowedCauseOptions, open]);

  const submitting = form.formState.isSubmitting;

  const handleClose = (next: boolean) => {
    if (submitting) return;
    onOpenChange(next);
  };

  const onSubmit = async (values: CreateHospitalizationRequest) => {
    try {
      const payload: CreateHospitalizationRequest = {
        ...values,
        clinicalServiceId: values.clinicalServiceId ?? null,
        cause: values.cause ?? null,
        attentionId: values.attentionId ?? null,
      };
      const created = await HospitalizationService.create(payload);
      toast({
        title: "Derivación creada",
        description: "La hospitalización se creó correctamente.",
      });
      onCreated?.(created);
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al crear hospitalización",
        description:
          getAaxiosErrorMessage(error) ??
          "Revisa los datos e inténtalo nuevamente.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Derivar a hospitalización</DialogTitle>
        </DialogHeader>

        {/* Cabecera de contexto (no inputs) */}
        <div className="mb-2 -mt-2">
          <div className="rounded-xl border bg-muted/40 p-3">
            <div className="text-xs text-muted-foreground">Paciente</div>
            <div className="text-sm font-medium">
              {detail.summary.animalBasicResponse.animalName ?? "—"}
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            {/* Jaula */}
            <FormField
              control={form.control}
              name="cageId"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelSelect
                      id="derive-cageId"
                      label="Jaula"
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(v) => field.onChange(Number(v))}
                      options={cages.map((c) => ({
                        value: String(c.id),
                        label: `${c.name} • ${c.size} • ${c.branchName}`,
                      }))}
                      disabled={cagesLoading || submitting}
                      emptyMessage={
                        cagesLoading
                          ? "Cargando jaulas..."
                          : "No hay jaulas disponibles."
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Servicio asociado (no indicar “opcional” en la UI) */}
            <FormField
              control={form.control}
              name="clinicalServiceId"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelSelect
                      id="derive-serviceId"
                      label="Servicio asociado"
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(v) =>
                        field.onChange(v ? Number(v) : null)
                      }
                      options={serviceItems.map((si) => ({
                        value: String(si.clinicalServiceId),
                        label: si.clinicalServiceName,
                      }))}
                      disabled={submitting}
                      emptyMessage="No hay servicios en esta atención."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Causa limitada por la categoría del servicio seleccionado */}
            <FormField
              control={form.control}
              name="cause"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelSelect
                      id="derive-cause"
                      label="Causa"
                      value={field.value ?? ""}
                      onValueChange={(v) =>
                        field.onChange((v as HospitalizationCause) || null)
                      }
                      options={allowedCauseOptions.map((opt) => ({
                        value: opt.value,
                        label: opt.label,
                      }))}
                      disabled={submitting}
                      emptyMessage="Sin resultados."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Momento de admisión: solo DURING / AFTER */}
            <FormField
              control={form.control}
              name="admissionTiming"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelSelect
                      id="derive-admissionTiming"
                      label="Momento de admisión"
                      value={field.value}
                      onValueChange={(v) =>
                        field.onChange(v as AdmissionTiming)
                      }
                      options={timingOptionsLimited.map((opt) => ({
                        value: opt.value,
                        label: opt.label,
                      }))}
                      disabled={submitting}
                      emptyMessage="Sin resultados."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notas */}
            <FormField
              control={form.control}
              name="admissionNotes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      id="derive-admissionNotes"
                      placeholder="Describe brevemente el motivo de la derivación…"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value)}
                      rows={3}
                      disabled={submitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Derivando…" : "Derivar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
