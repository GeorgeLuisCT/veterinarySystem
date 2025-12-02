"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { FloatingLabelDateInput } from "@/components/floating-label-date-input";
import { Textarea } from "@/components/ui/textarea";
import { ClinicalAttentionService } from "../../service/clinical-attention-service";
import ProductService from "@/app/dashboard/inventory/_service/product-service";
import type { ProductResponse } from "@/app/dashboard/inventory/_types/product-response";
import {
  addClinicalAttentionMedicationSchema,
  AddClinicalAttentionMedicationRequest,
} from "../../types/clinical-attention-request";
import { ClinicalAttentionDetailResponse } from "../../types/clinical-attention-response";
import { AdministrationRouteLabels } from "@/app/dashboard/inventory/_enums/administration-route";
import { ProductUnitType, ProductUnitTypeLabels } from "@/app/dashboard/inventory/_enums/product-unit-type";
import { FrequencyUnitLabels } from "../../enums/frequency-unit";
import { useUser } from "@/context/user-context";
import { useToast } from "@/hooks/use-toast";

type CommonProps = {
  id: number;
  onClose: () => void;
  onAdded: (data: ClinicalAttentionDetailResponse) => void;
};

export function MedicationModal({ id, onClose, onAdded }: CommonProps) {
  const { userInfo } = useUser();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [productOptions, setProductOptions] = useState<{ value: string; label: string }[]>([]);
  const [selectedProductDetails, setSelectedProductDetails] = useState<ProductResponse | null>(null);
  const [productDetailsLoading, setProductDetailsLoading] = useState(false);

  const form = useForm<AddClinicalAttentionMedicationRequest>({
    resolver: zodResolver(addClinicalAttentionMedicationSchema),
    defaultValues: {
      productId: undefined,
      administeredAt: new Date().toISOString().slice(0, 16),
      doseAmount: null,
      doseUnit: null,
      route: null,
      frequencyValue: null,
      frequencyUnit: null,
      administeredByEmployeeId: userInfo?.employeeId || null,
      notes: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (userInfo?.employeeId) {
      form.setValue("administeredByEmployeeId", userInfo.employeeId);
    }
  }, [userInfo, form]);

  const selectedProductId = form.watch("productId");

  useEffect(() => {
    let cancelled = false;

    async function fetchProductDetails(productId: number) {
      setProductDetailsLoading(true);
      setSelectedProductDetails(null);
      try {
        const details = await ProductService.getProduct(productId);
        if (cancelled) return;
        setSelectedProductDetails(details);
        const availableUnits: ProductUnitType[] = details.saleModes?.length
          ? details.saleModes.map((mode) => mode.unitType)
          : [details.unitType];
        const currentUnit = form.getValues("doseUnit");
        if (!currentUnit || !availableUnits.includes(currentUnit)) {
          const defaultUnit =
            details.saleModes?.find((mode) => mode.baseMode)?.unitType ?? availableUnits[0] ?? null;
          form.setValue("doseUnit", defaultUnit ?? null, { shouldValidate: true });
        }
        const availableRoutes = details.administrationRoutes ?? [];
        const currentRoute = form.getValues("route");
        if (!currentRoute || !availableRoutes.includes(currentRoute)) {
          form.setValue("route", availableRoutes[0] ?? null, { shouldValidate: true });
        }
      } catch {
        if (cancelled) return;
        toast({
          variant: "destructive",
          title: "No se pudo cargar el producto",
          description: "Intenta seleccionar nuevamente el producto.",
        });
        setSelectedProductDetails(null);
        form.setValue("doseUnit", null, { shouldValidate: true });
        form.setValue("route", null, { shouldValidate: true });
      } finally {
        if (!cancelled) setProductDetailsLoading(false);
      }
    }

    if (!selectedProductId) {
      setSelectedProductDetails(null);
      setProductDetailsLoading(false);
      form.setValue("doseUnit", null, { shouldValidate: true });
      form.setValue("route", null, { shouldValidate: true });
      return () => {
        cancelled = true;
      };
    }

    fetchProductDetails(selectedProductId);
    return () => {
      cancelled = true;
    };
  }, [selectedProductId, form, toast]);

  const handleSearchProducts = async (query: string) => {
    if (query.trim().length < 2) {
      setProductOptions([]);
      return;
    }
    try {
      const results = await ProductService.searchProducts(query.trim(), userInfo?.selectedBranch.id);
      setProductOptions(results.map((p) => ({ value: String(p.id), label: p.name })));
    } catch {
      setProductOptions([]);
    }
  };

  const onSubmit = async (values: AddClinicalAttentionMedicationRequest) => {
    setSubmitting(true);
    try {
      const res = await ClinicalAttentionService.addMedication(id, values);
      onAdded(res);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const frequencyUnitOptions = useMemo(
    () => Object.entries(FrequencyUnitLabels).map(([value, label]) => ({ value, label })),
    []
  );
  const doseUnitOptions = useMemo(() => {
    if (!selectedProductDetails) return [];
    const saleModeOptions = selectedProductDetails.saleModes?.length
      ? selectedProductDetails.saleModes.map((mode) => ({
          value: mode.unitType,
          label: ProductUnitTypeLabels[mode.unitType] || mode.unitType,
        }))
      : [];
    if (saleModeOptions.length > 0) return saleModeOptions;
    return [
      {
        value: selectedProductDetails.unitType,
        label: ProductUnitTypeLabels[selectedProductDetails.unitType] || selectedProductDetails.unitType,
      },
    ];
  }, [selectedProductDetails]);
  const routeOptions = useMemo(() => {
    if (!selectedProductDetails?.administrationRoutes?.length) return [];
    return selectedProductDetails.administrationRoutes.map((route) => ({
      value: route,
      label: AdministrationRouteLabels[route] || route,
    }));
  }, [selectedProductDetails]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="w-[min(92vw,840px)] max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-2xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl">Registrar medicación</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Selecciona el medicamento, la fecha y hora de la primera aplicación, la dosis y la frecuencia.
          </p>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
            {/* Producto */}
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelSelect
                      id="productId"
                      label="Producto *"
                      placeholder="Buscar producto…"
                      options={productOptions}
                      onSearch={handleSearchProducts}
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">Escribe al menos 2 caracteres para buscar.</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Fecha y hora */}
            <FormField
              control={form.control}
              name="administeredAt"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelDateInput
                      id="administeredAt"
                      label="Fecha y hora de administración *"
                      value={field.value ?? ""}
                      onChange={(v) => field.onChange(v || "")}
                      mode="datetime"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dosis */}
            <fieldset className="rounded-xl border p-3">
              <legend className="px-1 text-sm font-medium">Dosis</legend>
              <div className="grid gap-3 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="doseAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FloatingLabelInput
                          id="doseAmount"
                          label="Cantidad *"
                          type="number"
                          step="0.01"
                          value={field.value === null ? "" : String(field.value)}
                          onChange={(v) => field.onChange(v === "" ? null : Number(v))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="doseUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FloatingLabelSelect
                          id="doseUnit"
                          label={
                            !selectedProductId
                              ? "Unidad (selecciona producto)"
                              : productDetailsLoading
                                ? "Unidad (cargando…)"
                                : "Unidad *"
                          }
                          value={field.value ?? ""}
                          options={doseUnitOptions}
                          onValueChange={(v) => field.onChange(v || null)}
                          disabled={!selectedProductId || productDetailsLoading || doseUnitOptions.length === 0}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="route"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FloatingLabelSelect
                          id="route"
                          label={
                            !selectedProductId
                              ? "Vía (selecciona producto)"
                              : productDetailsLoading
                                ? "Vía (cargando…)"
                                : routeOptions.length === 0
                                  ? "Vía (no configurada)"
                                  : "Vía *"
                          }
                          value={field.value ?? ""}
                          options={routeOptions}
                          onValueChange={(v) => field.onChange(v || null)}
                          disabled={!selectedProductId || productDetailsLoading || routeOptions.length === 0}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </fieldset>

            {/* Frecuencia */}
            <fieldset className="rounded-xl border p-3">
              <legend className="px-1 text-sm font-medium">Frecuencia</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="frequencyValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FloatingLabelInput
                          id="frequencyValue"
                          label="Cada"
                          type="number"
                          step="1"
                          value={field.value === null ? "" : String(field.value)}
                          onChange={(v) => field.onChange(v === "" ? null : Number(v))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="frequencyUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FloatingLabelSelect
                          id="frequencyUnit"
                          label="Unidad"
                          value={field.value ?? ""}
                          options={frequencyUnitOptions}
                          onValueChange={(v) => field.onChange(v || null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Si es de aplicación única, deja estos campos vacíos.
              </p>
            </fieldset>

            {/* Notas */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      id="notes"
                      rows={4}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.value)}
                      placeholder="Notas (reacciones, indicaciones, etc.)"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Guardando…" : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
