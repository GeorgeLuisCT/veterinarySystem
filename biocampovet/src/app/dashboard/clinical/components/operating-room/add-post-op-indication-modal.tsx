"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

import {
  AddSurgicalReportPostOperativeIndicationRequest,
  addSurgicalReportPostOpIndicationSchema,
} from "../../types/surgical-report-request";
import ProductService from "@/app/dashboard/inventory/_service/product-service";
import SurgicalReportService from "../../service/surgical-report-service";
import { SurgicalReportDetailResponse } from "../../types/surgical-report-response";
import { useUser } from "@/context/user-context";
import { ProductUnitTypeLabels } from "@/app/dashboard/inventory/_enums/product-unit-type";
import { FrequencyUnitLabels } from "../../enums/frequency-unit";
import { AdministrationRouteLabels } from "@/app/dashboard/inventory/_enums/administration-route";
import { ProductQuickSearchResponse } from "@/app/dashboard/inventory/_types/product-response";

type Option = { value: string; label: string };
type Mode = "medication" | "instruction";

interface AddPostOpIndicationModalProps {
  reportId: number;
  open: boolean;
  onClose: () => void;
  onAdded: (detail: SurgicalReportDetailResponse) => void;
}

export function AddPostOpIndicationModal({
  reportId,
  open,
  onClose,
  onAdded,
}: AddPostOpIndicationModalProps) {
  const { toast } = useToast();
  const { userInfo } = useUser();

  const [mode, setMode] = useState<Mode>("medication");
  const [productOptions, setProductOptions] = useState<Option[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<AddSurgicalReportPostOperativeIndicationRequest>({
    resolver: zodResolver(addSurgicalReportPostOpIndicationSchema),
    defaultValues: {
      productId: undefined,           // importante: undefined, no null
      doseAmount: null,
      doseUnit: null,
      frequencyValue: null,
      frequencyUnit: null,
      route: null,
      nonDrugInstruction: null,
    },
    mode: "onChange",
  });

  // Limpieza según modo — usa resetField o setValue(undefined)
  useEffect(() => {
    if (mode === "medication") {
      form.setValue("nonDrugInstruction", null, { shouldValidate: true, shouldDirty: true });
    } else {
      // En "instruction" hay que "desaparecer" productId (undefined), no ponerlo en null
      form.resetField("productId", { defaultValue: undefined });
      form.setValue("doseAmount", null, { shouldValidate: true, shouldDirty: true });
      form.setValue("doseUnit", null, { shouldValidate: true, shouldDirty: true });
      form.setValue("frequencyValue", null, { shouldValidate: true, shouldDirty: true });
      form.setValue("frequencyUnit", null, { shouldValidate: true, shouldDirty: true });
      form.setValue("route", null, { shouldValidate: true, shouldDirty: true });
    }
  }, [mode, form]);

  const handleSearchProducts = async (query: string) => {
    const q = query.trim();
    if (q.length < 2) {
      setProductOptions([]);
      return;
    }
    try {
      const results = await ProductService.searchProducts(q, userInfo?.selectedBranch.id);
      setProductOptions(results.map((p: ProductQuickSearchResponse) => ({ value: String(p.id), label: p.name })));
    } catch {
      setProductOptions([]);
    }
  };

  const onSubmit = async (raw: AddSurgicalReportPostOperativeIndicationRequest) => {
    // Normaliza solo para evitar el falso positivo del XOR:
    const values: AddSurgicalReportPostOperativeIndicationRequest =
      mode === "instruction"
        ? { ...raw, productId: undefined } // asegúrate de que no viaja null/valor previo
        : raw;

    setSubmitting(true);
    try {
      const response = await SurgicalReportService.addPostOperativeIndication(reportId, values);
      onAdded(response);
      toast({ title: "Indicaciones actualizadas", description: "Se agregó la indicación post operatoria." });
      onClose();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudo agregar la indicación. Intenta nuevamente." });
    } finally {
      setSubmitting(false);
    }
  };

  const unitOptions = useMemo(
    () => Object.entries(ProductUnitTypeLabels).map(([value, label]) => ({ value, label })),
    []
  );
  const frequencyOptions = useMemo(
    () => Object.entries(FrequencyUnitLabels).map(([value, label]) => ({ value, label })),
    []
  );
  const routeOptions = useMemo(
    () => Object.entries(AdministrationRouteLabels).map(([value, label]) => ({ value, label })),
    []
  );

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : undefined)}>
      <DialogContent className="w-[min(92vw,840px)] max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-2xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl">Agregar indicación post operatoria</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Registra una indicación farmacológica o una instrucción no farmacológica.
          </p>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)} className="mt-1">
          <TabsList className="grid w-full grid-cols-2 rounded-full">
            <TabsTrigger value="medication" className="rounded-full">Medicamento</TabsTrigger>
            <TabsTrigger value="instruction" className="rounded-full">Instrucción</TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form className="mt-4 space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate autoComplete="off">
              <TabsContent value="medication" className="space-y-4">
                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FloatingLabelSelect
                          id="post-op-product"
                          label="Producto *"
                          placeholder="Buscar producto…"
                          options={productOptions}
                          onSearch={handleSearchProducts}
                          value={field.value ? String(field.value) : ""}
                          onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}
                          aria-required="true"
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">Escribe 2+ caracteres para buscar por nombre.</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <fieldset className="rounded-xl border p-3">
                  <legend className="px-1 text-sm font-medium">Dosis</legend>
                  <div className="grid gap-3 sm:grid-cols-12">
                    <div className="sm:col-span-4">
                      <FormField
                        control={form.control}
                        name="doseAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <FloatingLabelInput
                                id="post-op-dose"
                                label="Cantidad"
                                type="number"
                                step="0.01"
                                value={field.value ?? ""}
                                onChange={(v) => field.onChange(v === "" ? null : Number(v))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <FormField
                        control={form.control}
                        name="doseUnit"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <FloatingLabelSelect
                                id="post-op-dose-unit"
                                label="Unidad"
                                options={unitOptions}
                                value={field.value ?? ""}
                                onValueChange={(v) => field.onChange(v || null)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <FormField
                        control={form.control}
                        name="route"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <FloatingLabelSelect
                                id="post-op-route"
                                label="Vía"
                                options={routeOptions}
                                value={field.value ?? ""}
                                onValueChange={(v) => field.onChange(v || null)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </fieldset>

                <fieldset className="rounded-xl border p-3">
                  <legend className="px-1 text-sm font-medium">Frecuencia</legend>
                  <div className="grid gap-3 sm:grid-cols-12">
                    <div className="sm:col-span-6">
                      <FormField
                        control={form.control}
                        name="frequencyValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <FloatingLabelInput
                                id="post-op-frequency-value"
                                label="Cada"
                                type="number"
                                step="1"
                                value={field.value ?? ""}
                                onChange={(v) => field.onChange(v === "" ? null : Number(v))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="sm:col-span-6">
                      <FormField
                        control={form.control}
                        name="frequencyUnit"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <FloatingLabelSelect
                                id="post-op-frequency-unit"
                                label="Unidad"
                                options={frequencyOptions}
                                value={field.value ?? ""}
                                onValueChange={(v) => field.onChange(v || null)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Si es de aplicación única, deja estos campos vacíos.</p>
                </fieldset>
              </TabsContent>

              <TabsContent value="instruction">
                <fieldset className="rounded-xl border p-3">
                  <legend className="px-1 text-sm font-medium">Instrucción</legend>
                  <FormField
                    control={form.control}
                    name="nonDrugInstruction"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            id="post-op-instruction"
                            rows={4}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.value)}
                            placeholder="Ej.: Mantener el collar isabelino durante 7 días. Revisar herida a las 48 horas."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </fieldset>
              </TabsContent>

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting || !form.formState.isValid}>
                  {submitting ? "Guardando…" : "Agregar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
