"use client";

import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

import {
  addSurgicalReportAnestheticDrugSchema,
  AddSurgicalReportAnestheticDrugRequest,
} from "../../types/surgical-report-request";
import { AnestheticPhaseOptions } from "../../enums/anesthetic-phase";
import { ProductUnitTypeLabels } from "@/app/dashboard/inventory/products/enums/product-unit-type";
import { AdministrationRouteLabels } from "@/app/dashboard/inventory/products/enums/administration-route";
import ProductService from "@/app/dashboard/inventory/products/service/product-service";
import SurgicalReportService from "../../service/surgical-report-service";
import { SurgicalReportDetailResponse } from "../../types/surgical-report-response";
import { useUser } from "@/context/user-context";

type Option = { value: string; label: string };

interface AddAnestheticDrugModalProps {
  reportId: number;
  open: boolean;
  onClose: () => void;
  onAdded: (detail: SurgicalReportDetailResponse) => void;
}

export function AddAnestheticDrugModal({ reportId, open, onClose, onAdded }: AddAnestheticDrugModalProps) {
  const { toast } = useToast();
  const { userInfo } = useUser();

  const [productOptions, setProductOptions] = useState<Option[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<AddSurgicalReportAnestheticDrugRequest>({
    resolver: zodResolver(addSurgicalReportAnestheticDrugSchema),
    defaultValues: {
      productId: undefined,
      phase: undefined,
      doseAmount: null,
      doseUnit: null,
      route: null,
    },
    mode: "onChange",
  });

  const routeOptions = useMemo(
    () => Object.entries(AdministrationRouteLabels).map(([value, label]) => ({ value, label })),
    []
  );
  const unitOptions = useMemo(
    () => Object.entries(ProductUnitTypeLabels).map(([value, label]) => ({ value, label })),
    []
  );

  const handleSearchProducts = async (query: string) => {
    const q = query.trim();
    if (q.length < 2) {
      setProductOptions([]);
      return;
    }
    try {
      const results = await ProductService.searchProducts(q, userInfo?.selectedBranch.id);
      setProductOptions(results.map((p: any) => ({ value: String(p.id), label: p.name })));
    } catch {
      setProductOptions([]);
    }
  };

  const onSubmit = async (values: AddSurgicalReportAnestheticDrugRequest) => {
    setSubmitting(true);
    try {
      const res = await SurgicalReportService.addAnestheticDrug(reportId, values);
      onAdded(res);
      onClose();
      toast({ title: "Fármaco agregado", description: "Se agregó el fármaco al protocolo anestésico." });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudo agregar el fármaco. Intenta de nuevo." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[min(92vw,840px)] max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-2xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl">Agregar fármaco anestésico</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Selecciona el producto y la fase. Si corresponde, registra la dosis, unidad y vía.
          </p>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
            {/* Producto y Fase */}
            <fieldset className="rounded-xl border p-3">
              <legend className="px-1 text-sm font-medium">Producto y fase</legend>

              <div className="grid gap-3 sm:grid-cols-2">
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
                <FormField
                  control={form.control}
                  name="phase"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FloatingLabelSelect
                          id="phase"
                          label="Fase *"
                          options={AnestheticPhaseOptions}
                          value={field.value ?? ""}
                          onValueChange={(v) => field.onChange(v || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </fieldset>

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
                          label="Cantidad"
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
                          label="Unidad"
                          value={field.value ?? ""}
                          options={unitOptions}
                          onValueChange={(v) => field.onChange(v || null)}
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
                          label="Vía"
                          value={field.value ?? ""}
                          options={routeOptions}
                          onValueChange={(v) => field.onChange(v || null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Si no aplica dosis (p.ej., inducción gaseosa), deja estos campos vacíos.
              </p>
            </fieldset>

            {/* Notas (opcional) */}
            {/* Si más adelante agregas `notes` al esquema, descomenta este bloque:
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
            */}

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Guardando…" : "Agregar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
