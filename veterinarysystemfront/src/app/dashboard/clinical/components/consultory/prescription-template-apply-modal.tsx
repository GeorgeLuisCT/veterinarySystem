"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/context/user-context";
import ProductService from "@/app/dashboard/inventory/_service/product-service";
import { AdministrationRoute, AdministrationRouteLabels } from "@/app/dashboard/inventory/_enums/administration-route";
import { ProductUnitType, ProductUnitTypeLabels } from "@/app/dashboard/inventory/_enums/product-unit-type";
import { FrequencyUnit, FrequencyUnitLabels } from "@/app/dashboard/clinical/enums/frequency-unit";
import { ClinicalAttentionService } from "@/app/dashboard/clinical/service/clinical-attention-service";
import { ClinicalAttentionDetailResponse } from "@/app/dashboard/clinical/types/clinical-attention-response";
import {
  PrescriptionTemplateQuickSearchResponse,
  PrescriptionTemplateResponse,
} from "../../types/prescription-template-response";
import PrescriptionTemplateService from "../../service/prescription-template-service";
import { Check, X } from "lucide-react";

type CommonProps = {
  id: number;
  onClose: () => void;
  onAdded: (data: ClinicalAttentionDetailResponse) => void;
};

/** Schemas */
const itemSchema = z.object({
  include: z.boolean().default(true),
  productId: z.number().optional().nullable(),
  productLabel: z.string().optional().nullable(),
  administeredAt: z.string(),
  doseAmount: z.number().nullable(),
  doseUnit: z.string().nullable(),
  route: z.string().nullable(),
  frequencyValue: z.number().nullable(),
  frequencyUnit: z.string().nullable(),
  notes: z.string().nullable(),
});

const formSchema = z.object({
  templateId: z.number().optional(),
  items: z.array(itemSchema),
});

export function PrescriptionTemplateApplyModal({ id, onClose, onAdded }: CommonProps) {
  const { toast } = useToast();
  const { userInfo } = useUser();

  const [searching, setSearching] = useState(false);
  const [templateOptions, setTemplateOptions] = useState<PrescriptionTemplateQuickSearchResponse[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PrescriptionTemplateResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [productOptionsCache, setProductOptionsCache] = useState<Record<number, { value: string; label: string }[]>>({});

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { templateId: undefined, items: [] },
    mode: "onChange",
  });

  /** Options */
  const routeOptions = useMemo(
    () => Object.entries(AdministrationRouteLabels).map(([value, label]) => ({ value, label })),
    []
  );
  const unitOptions = useMemo(
    () => Object.entries(ProductUnitTypeLabels).map(([value, label]) => ({ value, label })),
    []
  );
  const frequencyUnitOptions = useMemo(
    () => Object.entries(FrequencyUnitLabels).map(([value, label]) => ({ value, label })),
    []
  );

  /** Template search & load */
  const handleSearchTemplates = async (query?: string) => {
    setSearching(true);
    try {
      const res = await PrescriptionTemplateService.quickSearch(query);
      setTemplateOptions(res);
    } finally {
      setSearching(false);
    }
  };

  // 🚀 Hidrata el cache por índice para que el select muestre el producto ya asignado
  const hydrateSelectedProducts = async (mappedItems: Array<z.infer<typeof itemSchema>>) => {
    const ids = [...new Set(mappedItems.map(i => i.productId).filter((id): id is number => typeof id === "number"))];
    if (ids.length === 0) {
      setProductOptionsCache({});
      return;
    }

    try {
      const products = await ProductService.getProductsByIds(ids);
      const dict = new Map<number, string>(products.map(p => [p.id, p.name]));

      const newCache: Record<number, { value: string; label: string }[]> = {};
      mappedItems.forEach((it, idx) => {
        if (typeof it.productId === "number") {
          const name = dict.get(it.productId) ?? it.productLabel ?? `Producto #${it.productId}`;
          newCache[idx] = [{ value: String(it.productId), label: name }];
        }
      });

      setProductOptionsCache(newCache);
    } catch {
      // Fallback si falla la carga por ids
      const fallback: Record<number, { value: string; label: string }[]> = {};
      mappedItems.forEach((it, idx) => {
        if (typeof it.productId === "number") {
          fallback[idx] = [{ value: String(it.productId), label: it.productLabel ?? `Producto #${it.productId}` }];
        }
      });
      setProductOptionsCache(fallback);
    }
  };

  const loadTemplate = async (tid: number) => {
    const detail = await PrescriptionTemplateService.getById(tid);
    setSelectedTemplate(detail);

    // Fecha local ISO para <input type="datetime-local">
    const now = new Date();
    const nowISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    const mapped = detail.medications.map((m) => ({
      include: true,
      productId: m.productId ?? null,
      productLabel: m.productName ?? m.customMedicationName ?? null,
      administeredAt: nowISO,
      doseAmount: m.dosageAmount ?? null,
      doseUnit: m.dosageUnit ?? null,
      route: null,
      frequencyValue: m.frequencyValue ?? null,
      frequencyUnit: m.frequencyUnit ?? null,
      notes: m.instructions ?? null,
    }));

    form.setValue("items", mapped, { shouldDirty: false });

    // 👇 Asegura que el select muestre el producto que ya viene
    await hydrateSelectedProducts(mapped);
  };

  const handleTemplateChange = async (val: string) => {
    const idNum = val ? Number(val) : undefined;
    form.setValue("templateId", idNum);
    if (idNum) {
      await loadTemplate(idNum);
    } else {
      setSelectedTemplate(null);
      form.setValue("items", []);
      setProductOptionsCache({});
    }
  };

  /** Product search por fila */
  const handleSearchProducts = async (index: number, query: string) => {
    const q = query.trim();
    if (q.length < 2) {
      setProductOptionsCache((prev) => ({ ...prev, [index]: [] }));
      return;
    }
    try {
      const results = await ProductService.searchProducts(q, userInfo?.selectedBranch.id);
      const options = results.map((p) => ({ value: String(p.id), label: p.name }));
      setProductOptionsCache((prev) => ({ ...prev, [index]: options }));
    } catch {
      setProductOptionsCache((prev) => ({ ...prev, [index]: [] }));
    }
  };

  /** Submit */
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const items = values.items.filter((i) => i.include && i.productId);
    if (items.length === 0) {
      toast({ description: "No hay ítems seleccionados para aplicar.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      let last: ClinicalAttentionDetailResponse | null = null;
      for (const it of items) {
        const payload = {
          productId: it.productId!,
          administeredAt: it.administeredAt,
          doseAmount: it.doseAmount,
          doseUnit: it.doseUnit as ProductUnitType | null,
          route: it.route as AdministrationRoute | null,
          frequencyValue: it.frequencyValue,
          frequencyUnit: it.frequencyUnit as FrequencyUnit | null,
          administeredByEmployeeId: userInfo?.employeeId || null,
          notes: it.notes,
        };
        last = await ClinicalAttentionService.addMedication(id, payload);
      }
      if (last) onAdded(last);
      onClose();
    } catch {
      toast({ description: "Ocurrió un error al aplicar la plantilla.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    handleSearchTemplates("");
  }, []);

  const items = form.watch("items");

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="w-[min(92vw,1000px)] max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-lg sm:max-w-4xl">
        <DialogHeader className="space-y-2">
          <DialogTitle>Aplicar plantilla de prescripción</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Selecciona la plantilla y revisa/ajusta cada medicación antes de aplicar.
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selección de plantilla */}
          <fieldset className="border-t pt-4 first:border-t-0 first:pt-0">
            <legend className="mb-3 text-sm font-semibold text-foreground">Seleccionar plantilla</legend>
            <div className="space-y-2">
              <div className="w-full">
                <FloatingLabelSelect
                  id="templateId"
                  label="Buscar y seleccionar plantilla"
                  placeholder={searching ? "Buscando..." : "Escribe para buscar..."}
                  options={templateOptions.map((t) => ({
                    value: String(t.id),
                    label: t.name,
                  }))}
                  value={form.watch("templateId") ? String(form.watch("templateId")) : ""}
                  onSearch={(q) => handleSearchTemplates(q)}
                  onValueChange={handleTemplateChange}
                />
              </div>
              <p className="text-xs text-muted-foreground">Escribe al menos 2 caracteres para buscar.</p>
              {selectedTemplate?.purpose && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Propósito:</span> {selectedTemplate.purpose}
                </p>
              )}
            </div>
          </fieldset>

          {/* Items de la plantilla */}
          {selectedTemplate && (
            <Form {...form}>
              <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
                <fieldset className="border-t pt-4 first:border-t-0 first:pt-0">
                  <legend className="mb-3 text-sm font-semibold text-foreground">Medicamentos de la plantilla</legend>

                  {!items || items.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground">La plantilla no tiene medicamentos.</div>
                  ) : (
                    <div className="space-y-4">
                      {items.map((_, index) => {
                        const include = form.getValues(`items.${index}.include`);
                        const name = form.getValues(`items.${index}.productLabel`) ?? "Medicamento";
                        return (
                          <section
                            key={index}
                            className="rounded-lg border p-4"
                            aria-labelledby={`med-row-${index}-title`}
                          >
                            {/* Encabezado de fila */}
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div id={`med-row-${index}-title`} className="text-sm font-medium truncate">
                                {name}
                              </div>

                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant={include ? "outline" : "secondary"}
                                  className="gap-2"
                                  aria-pressed={include}
                                  aria-controls={`med-row-${index}-body`}
                                  onClick={() => {
                                    const current = form.getValues("items");
                                    current[index].include = !current[index].include;
                                    form.setValue("items", [...current], { shouldValidate: true });
                                  }}
                                >
                                  {include ? (
                                    <>
                                      <X className="h-4 w-4" /> Quitar
                                    </>
                                  ) : (
                                    <>
                                      <Check className="h-4 w-4" /> Agregar
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>

                            {/* Cuerpo de fila */}
                            <div id={`med-row-${index}-body`} className="mt-4 space-y-4">
                              {/* Producto y fecha */}
                              <div className="grid gap-3 sm:grid-cols-2">
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.productId` as const}
                                  render={({ field }) => (
                                    <FormItem className="space-y-2">
                                      <FormControl>
                                        <div className="w-full">
                                          <FloatingLabelSelect
                                            id={`product-${index}`}
                                            label="Producto"
                                            placeholder="Buscar producto…"
                                            options={productOptionsCache[index] ?? []}
                                            onSearch={(q) => handleSearchProducts(index, q)}
                                            value={field.value ? String(field.value) : ""}
                                            onValueChange={(v) => {
                                              field.onChange(v ? Number(v) : null);
                                              const list = form.getValues("items");
                                              const opt = (productOptionsCache[index] ?? []).find((o) => o.value === v);
                                              list[index].productLabel = opt?.label ?? list[index].productLabel;
                                              form.setValue("items", [...list], { shouldValidate: true });
                                            }}
                                          />
                                        </div>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.administeredAt` as const}
                                  render={({ field }) => (
                                    <FormItem className="space-y-2">
                                      <FormControl>
                                        <div className="w-full">
                                          <FloatingLabelInput
                                            id={`adminAt-${index}`}
                                            label="Fecha y hora de administración"
                                            type="datetime-local"
                                            value={field.value ?? ""}
                                            onChange={(v) => field.onChange(v)}
                                          />
                                        </div>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              {/* Dosis */}
                              <fieldset className="border-t pt-4 first:border-t-0 first:pt-0">
                                <legend className="mb-3 text-sm font-semibold text-foreground">Dosis</legend>
                                <div className="grid gap-3 sm:grid-cols-3">
                                  <FormField
                                    control={form.control}
                                    name={`items.${index}.doseAmount` as const}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <FloatingLabelInput
                                            id={`dose-${index}`}
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
                                    name={`items.${index}.doseUnit` as const}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <FloatingLabelSelect
                                            id={`doseUnit-${index}`}
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
                                    name={`items.${index}.route` as const}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <FloatingLabelSelect
                                            id={`route-${index}`}
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
                              </fieldset>

                              {/* Frecuencia */}
                              <fieldset className="border-t pt-4 first:border-t-0 first:pt-0">
                                <legend className="mb-3 text-sm font-semibold text-foreground">Frecuencia</legend>
                                <div className="grid gap-3 sm:grid-cols-2">
                                  <FormField
                                    control={form.control}
                                    name={`items.${index}.frequencyValue` as const}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <FloatingLabelInput
                                            id={`freqVal-${index}`}
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
                                    name={`items.${index}.frequencyUnit` as const}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <FloatingLabelSelect
                                            id={`freqUnit-${index}`}
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

                              {/* Notas (solo Textarea usa FormLabel externo) */}
                              <FormField
                                control={form.control}
                                name={`items.${index}.notes` as const}
                                render={({ field }) => (
                                  <FormItem className="space-y-2">
                                    <FormLabel htmlFor={`notes-${index}`}>Notas</FormLabel>
                                    <FormControl>
                                      <Textarea
                                        id={`notes-${index}`}
                                        rows={2}
                                        value={field.value ?? ""}
                                        onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.value)}
                                        placeholder="Ej.: Observaciones: leve dolor local; control en 7 días."
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            {!include && (
                              <p className="mt-2 text-xs text-muted-foreground">
                                Este ítem está marcado como <span className="font-medium">excluido</span>; no se aplicará.
                              </p>
                            )}
                          </section>
                        );
                      })}
                    </div>
                  )}
                </fieldset>

                <DialogFooter className="gap-3">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={submitting || !selectedTemplate}>
                    {submitting ? "Aplicando..." : "Aplicar plantilla"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PrescriptionTemplateApplyModal;
