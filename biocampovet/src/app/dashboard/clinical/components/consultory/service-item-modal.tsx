"use client";

import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { Textarea } from "@/components/ui/textarea";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  addClinicalAttentionServiceItemSchema,
  AddClinicalAttentionServiceItemRequest,
} from "../../types/clinical-attention-request";
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from "@/components/ui/form";
import { ClinicalAttentionService } from "../../service/clinical-attention-service";
import { ClinicalAttentionDetailResponse } from "../../types/clinical-attention-response";
import { useUser } from "@/context/user-context";
import { ClinicalServiceQuickSearchResponse, ClinicalServiceResponse } from "../../types/clinical-service-response";
import ClinicalServiceService from "../../service/clinical-service-service";
import ProductService from "@/app/dashboard/inventory/_service/product-service";
import { AdministrationRoute, AdministrationRouteLabels } from "@/app/dashboard/inventory/_enums/administration-route";
import { ProductUnitType, ProductUnitTypeLabels } from "@/app/dashboard/inventory/_enums/product-unit-type";
import { ProductQuickSearchResponse } from "@/app/dashboard/inventory/products/types/product-quick-search-response";
import { ClinicalServiceCategory, ClinicalServiceCategoryLabels } from "../../enums/clinical-service-category";
import { PlusCircle, Trash2 } from "lucide-react";

type CommonProps = {
  id: number;
  onClose: () => void;
  onAdded: (data: ClinicalAttentionDetailResponse) => void;
  category: ClinicalServiceCategory;
};

export function ServiceItemModal({ id, onClose, onAdded, category }: CommonProps) {
  const { userInfo } = useUser();
  const [submitting, setSubmitting] = useState(false);
  const [serviceOptions, setServiceOptions] = useState<{ value: string; label: string }[]>([]);
  const [searchResults, setSearchResults] = useState<ClinicalServiceQuickSearchResponse[]>([]);
  const [productOptionsMap, setProductOptionsMap] = useState<Record<number, { value: string; label: string }[]>>({});

  const form = useForm<AddClinicalAttentionServiceItemRequest>({
    resolver: zodResolver(addClinicalAttentionServiceItemSchema),
    defaultValues: { clinicalServiceId: undefined, unitPrice: 0, quantity: 1, notes: "", products: [] },
    mode: "onChange",
  });

  const { fields, append, remove, replace } = useFieldArray({ control: form.control, name: "products" });

  const handleSearchServices = async (query: string) => {
    const q = query.trim();
    if (q.length < 2) {
      setServiceOptions([]);
      setSearchResults([]);
      return;
    }
    try {
      const results = await ClinicalServiceService.quickSearch(q, userInfo?.selectedBranch.id, category);
      setSearchResults(results);
      setServiceOptions(results.map((s) => ({ value: String(s.id), label: s.name })));
    } catch {
      setServiceOptions([]);
      setSearchResults([]);
    }
  };

  const handleSearchProducts = async (rowIndex: number, query: string) => {
    const q = query.trim();
    if (q.length < 2) {
      setProductOptionsMap((prev) => ({ ...prev, [rowIndex]: [] }));
      return;
    }
    try {
      const results: ProductQuickSearchResponse[] = await ProductService.searchProducts(q, userInfo?.selectedBranch.id);
      setProductOptionsMap((prev) => ({ ...prev, [rowIndex]: results.map((p) => ({ value: String(p.id), label: p.name })) }));
    } catch {
      setProductOptionsMap((prev) => ({ ...prev, [rowIndex]: [] }));
    }
  };

  const loadServiceDetails = async (serviceId: number) => {
    try {
      const detail: ClinicalServiceResponse = await ClinicalServiceService.getById(serviceId);
      if (!form.getValues("unitPrice") && detail.price) {
        form.setValue("unitPrice", detail.price, { shouldValidate: true });
      }
      const defaultUnit = Object.values(ProductUnitType)[0];
      const defaultRoute = Object.values(AdministrationRoute)[0];
      const rows = (detail.requiredProducts ?? []).map((rp) => ({
        productId: rp.id,
        dose: 1,
        unit: defaultUnit,
        administrationRoute: defaultRoute,
      }));
      replace(rows);
      setProductOptionsMap(() => {
        const updated: Record<number, { value: string; label: string }[]> = {};
        (detail.requiredProducts ?? []).forEach((rp, i) => {
          updated[i] = [{ value: String(rp.id), label: rp.name }];
        });
        return updated;
      });
    } catch {
      // sin bloqueo
    }
  };

  const onSubmit = async (values: AddClinicalAttentionServiceItemRequest) => {
    setSubmitting(true);
    try {
      const res = await ClinicalAttentionService.addServiceItem(id, values);
      onAdded(res);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const dialogTitle = useMemo(
    () => `Agregar ${ClinicalServiceCategoryLabels[category] ?? "Servicio"}`,
    [category]
  );

  const routeOptions = useMemo(
    () => Object.entries(AdministrationRouteLabels).map(([value, label]) => ({ value, label })),
    []
  );
  const unitOptions = useMemo(
    () => Object.entries(ProductUnitTypeLabels).map(([value, label]) => ({ value, label })),
    []
  );

  // Subtotal editable: si cambia, ajusta unitPrice = subtotal / quantity
  const unitPrice = form.watch("unitPrice") ?? 0;
  const quantity = form.watch("quantity") ?? 1;
  const computedSubtotal = useMemo(() => {
    const n = Number(unitPrice) * Number(quantity || 1);
    return Number.isFinite(n) ? n : 0;
  }, [unitPrice, quantity]);

  const hasService = !!form.watch("clinicalServiceId");

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="w-[min(90vw,900px)] max-h-[95vh] overflow-y-auto overflow-x-hidden rounded-2xl sm:max-w-6xl">
        <DialogHeader className="space-y-1">
          <DialogTitle>{dialogTitle}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Busca el servicio, confirma precio y cantidad. Si corresponde, agrega los productos que intervienen (dosis, unidad y vía).
          </p>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
            {/* DATOS DEL SERVICIO */}
            <fieldset className="rounded-xl border p-4">
              <legend className="px-1 text-sm font-medium">Datos del servicio</legend>

              <FormField
                control={form.control}
                name="clinicalServiceId"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="w-full">
                        <FloatingLabelSelect
                          id="clinicalServiceId"
                          label="Servicio *"
                          placeholder="Buscar servicio…"
                          options={serviceOptions}
                          onSearch={handleSearchServices}
                          value={field.value ? String(field.value) : ""}
                          onValueChange={async (v) => {
                            const selectedId = v ? Number(v) : undefined;
                            field.onChange(selectedId);
                            if (selectedId) {
                              const s = searchResults.find((x) => x.id === selectedId);
                              if (s && s.price != null) {
                                form.setValue("unitPrice", s.price, { shouldValidate: true });
                              }
                              await loadServiceDetails(selectedId);
                            } else {
                              replace([]);
                            }
                          }}
                        />
                      </div>
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Escribe 2+ caracteres para buscar.</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="unitPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="w-full">
                          <FloatingLabelInput
                            id="unitPrice"
                            label="Precio unitario *"
                            type="number"
                            step="0.01"
                            value={String(field.value ?? "")}
                            onChange={(v) => field.onChange(v === "" ? 0 : Number(v))}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="w-full">
                          <FloatingLabelInput
                            id="quantity"
                            label="Cantidad *"
                            type="number"
                            step="1"
                            value={String(field.value ?? "")}
                            onChange={(v) => field.onChange(v === "" ? 1 : Number(v))}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Subtotal editable: ajusta unitPrice */}
                <FormItem>
                  <FormControl>
                    <div className="w-full">
                      <FloatingLabelInput
                        id="subtotal"
                        label="Subtotal"
                        type="number"
                        step="0.01"
                        value={String(computedSubtotal.toFixed(2))}
                        onChange={(v) => {
                          const newSubtotal = v === "" ? 0 : Number(v);
                          const q = Number(form.getValues("quantity") || 1);
                          const newUnit = q > 0 ? newSubtotal / q : 0;
                          form.setValue("unitPrice", Number.isFinite(newUnit) ? newUnit : 0, { shouldValidate: true });
                        }}
                      />
                    </div>
                  </FormControl>
                </FormItem>
              </div>
            </fieldset>

            {/* PRODUCTOS DEL SERVICIO — solo si hay servicio */}
            {hasService && (
              <fieldset className="rounded-xl border p-4">
                <legend className="px-1 text-sm font-medium">Productos usados</legend>

                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Los productos y la cantidad que registres serán descontados del stock
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="gap-2 shrink-0"
                    onClick={() =>
                      append({
                        productId: undefined as unknown as number,
                        dose: 1,
                        unit: Object.values(ProductUnitType)[0],
                        administrationRoute: Object.values(AdministrationRoute)[0],
                      })
                    }
                  >
                    <PlusCircle className="h-4 w-4" />
                    Añadir producto
                  </Button>
                </div>

                {fields.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay productos agregados.</p>
                ) : (
                  <div className="space-y-4">
                    {fields.map((row, index) => (
                      <div key={row.id} className="grid gap-3 sm:grid-cols-12 rounded-lg border p-3">
                        {/* Producto */}
                        <div className="sm:col-span-4">
                          <FormField
                            control={form.control}
                            name={`products.${index}.productId`}
                            render={({ field: f }) => (
                              <FormItem>
                                <FormControl>
                                  <FloatingLabelSelect
                                    id={`product-${index}`}
                                    label="Producto *"
                                    placeholder="Buscar producto…"
                                    options={productOptionsMap[index] || []}
                                    onSearch={(q: string) => handleSearchProducts(index, q)}
                                    value={f.value ? String(f.value) : ""}
                                    onValueChange={(val) => f.onChange(val ? Number(val) : undefined)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Dosis */}
                        <div className="sm:col-span-2">
                          <FormField
                            control={form.control}
                            name={`products.${index}.dose`}
                            render={({ field: f }) => (
                              <FormItem>
                                <FormControl>
                                  <FloatingLabelInput
                                    id={`dose-${index}`}
                                    label="Dosis *"
                                    type="number"
                                    step="0.01"
                                    value={String(f.value ?? "")}
                                    onChange={(v) => f.onChange(v === "" ? 0 : Number(v))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Unidad */}
                        <div className="sm:col-span-3">
                          <FormField
                            control={form.control}
                            name={`products.${index}.unit`}
                            render={({ field: f }) => (
                              <FormItem>
                                <FormControl>
                                  <FloatingLabelSelect
                                    id={`unit-${index}`}
                                    label="Unidad *"
                                    placeholder="Unidad"
                                    options={unitOptions}
                                    value={f.value ? String(f.value) : ""}
                                    onValueChange={(v) => f.onChange((v || null) as unknown as ProductUnitType)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Vía + quitar */}
                        <div className="sm:col-span-3 flex items-start gap-2">
                          <div className="grow">
                            <FormField
                              control={form.control}
                              name={`products.${index}.administrationRoute`}
                              render={({ field: f }) => (
                                <FormItem>
                                  <FormControl>
                                    <FloatingLabelSelect
                                      id={`route-${index}`}
                                      label="Vía *"
                                      placeholder="Vía"
                                      options={routeOptions}
                                      value={f.value ? String(f.value) : ""}
                                      onValueChange={(v) => f.onChange((v || null) as unknown as AdministrationRoute)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Quitar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </fieldset>
            )}

            {/* NOTAS (label + ejemplo breve) */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="notes">Notas</FormLabel>
                  <FormControl>
                    <Textarea
                      id="notes"
                      rows={3}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.value)}
                      placeholder="Ej.: Observaciones: leve dolor local; control en 7 días."
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
