"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/context/user-context";
import ProductService from "@/app/dashboard/inventory/products/service/product-service";
import { AdministrationRouteLabels } from "@/app/dashboard/inventory/products/enums/administration-route";
import { ProductUnitTypeLabels } from "@/app/dashboard/inventory/products/enums/product-unit-type";
import { FrequencyUnitLabels } from "@/app/dashboard/clinical/enums/frequency-unit";
import { ClinicalAttentionService } from "@/app/dashboard/clinical/service/clinical-attention-service";
import { ClinicalAttentionDetailResponse } from "@/app/dashboard/clinical/types/clinical-attention-response";
import { PrescriptionTemplateQuickSearchResponse, PrescriptionTemplateResponse } from "../../types/prescription-template-response";
import PrescriptionTemplateService from "../../service/prescription-template-service";

type CommonProps = {
  id: number;
  onClose: () => void;
  onAdded: (data: ClinicalAttentionDetailResponse) => void;
};

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

  const handleSearchTemplates = async (query?: string) => {
    setSearching(true);
    try {
      const res = await PrescriptionTemplateService.quickSearch(query);
      setTemplateOptions(res);
    } finally {
      setSearching(false);
    }
  };

  const loadTemplate = async (tid: number) => {
    const detail = await PrescriptionTemplateService.getById(tid);
    setSelectedTemplate(detail);
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
  };

  const handleTemplateChange = async (val: string) => {
    const idNum = val ? Number(val) : undefined;
    form.setValue("templateId", idNum);
    if (idNum) await loadTemplate(idNum);
    else {
      setSelectedTemplate(null);
      form.setValue("items", []);
    }
  };

  const handleSearchProducts = async (index: number, query: string) => {
    if (!query || query.trim().length < 2) {
      setProductOptionsCache((prev) => ({ ...prev, [index]: [] }));
      return;
    }
    try {
      const results = await ProductService.searchProducts(query, userInfo?.selectedBranch.id);
      const options = results.map((p: any) => ({ value: String(p.id), label: p.name }));
      setProductOptionsCache((prev) => ({ ...prev, [index]: options }));
    } catch {
      setProductOptionsCache((prev) => ({ ...prev, [index]: [] }));
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const items = values.items.filter((i) => i.include);
    if (items.length === 0) {
      toast({ description: "No hay ítems seleccionados para aplicar.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      let last: ClinicalAttentionDetailResponse | null = null;
      for (const it of items) {
        const payload = {
          productId: it.productId ?? undefined,
          administeredAt: it.administeredAt,
          doseAmount: it.doseAmount,
          doseUnit: (it.doseUnit as any) ?? null,
          route: (it.route as any) ?? null,
          frequencyValue: it.frequencyValue,
          frequencyUnit: (it.frequencyUnit as any) ?? null,
          administeredByEmployeeId: userInfo?.employeeId || null,
          notes: it.notes,
        };
        last = await ClinicalAttentionService.addMedication(id, payload as any);
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

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Aplicar plantilla de prescripción</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <FloatingLabelSelect
            id="templateId"
            label="Buscar y seleccionar plantilla"
            placeholder={searching ? "Buscando..." : "Escribe para buscar..."}
            options={templateOptions.map((t) => ({
              value: String(t.id),
              label: `${t.name}${t.purpose ? " • " + t.purpose : ""}`,
            }))}
            value={form.watch("templateId") ? String(form.watch("templateId")) : ""}
            onSearch={(q) => handleSearchTemplates(q)}
            onValueChange={handleTemplateChange}
          />

          {selectedTemplate && (
            <Form {...form}>
              <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                <div className="rounded-md border">
                  {form.watch("items").length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground">La plantilla no tiene medicamentos.</div>
                  ) : (
                    <div className="divide-y">
                      {form.watch("items").map((_, index) => (
                        <div key={index} className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium">
                              {form.getValues(`items.${index}.productLabel`) ?? "Medicamento"}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                type="button"
                                onClick={() => {
                                  const current = form.getValues("items");
                                  current[index].include = !current[index].include;
                                  form.setValue("items", [...current]);
                                }}
                              >
                                {form.getValues(`items.${index}.include`) ? "Quitar" : "Agregar"}
                              </Button>
                            </div>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <FormField
                              control={form.control}
                              name={`items.${index}.productId` as const}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <FloatingLabelSelect
                                      id={`product-${index}`}
                                      label="Producto"
                                      placeholder="Buscar producto..."
                                      options={productOptionsCache[index] ?? []}
                                      onSearch={(q) => handleSearchProducts(index, q)}
                                      value={field.value ? String(field.value) : ""}
                                      onValueChange={(v) => {
                                        field.onChange(v ? Number(v) : null);
                                        const items = form.getValues("items");
                                        const opt = (productOptionsCache[index] ?? []).find(o => o.value === v);
                                        items[index].productLabel = opt?.label ?? items[index].productLabel;
                                        form.setValue("items", [...items]);
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`items.${index}.administeredAt` as const}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <FloatingLabelInput
                                      id={`adminAt-${index}`}
                                      label="Fecha y hora de administración"
                                      type="datetime-local"
                                      value={field.value ?? ""}
                                      onChange={(v) => field.onChange(v)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid gap-3 sm:grid-cols-3">
                            <FormField
                              control={form.control}
                              name={`items.${index}.doseAmount` as const}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <FloatingLabelInput
                                      id={`dose-${index}`}
                                      label="Dosis"
                                      type="number"
                                      value={field.value ?? ""}
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

                          <div className="grid gap-3 sm:grid-cols-2">
                            <FormField
                              control={form.control}
                              name={`items.${index}.frequencyValue` as const}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <FloatingLabelInput
                                      id={`freqVal-${index}`}
                                      label="Frecuencia (valor)"
                                      type="number"
                                      value={field.value ?? ""}
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
                                      label="Frecuencia (unidad)"
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

                          <FormField
                            control={form.control}
                            name={`items.${index}.notes` as const}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Textarea
                                    id={`notes-${index}`}
                                    rows={2}
                                    value={field.value ?? ""}
                                    onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.value)}
                                    placeholder="Notas (opcional)"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <DialogFooter>
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
