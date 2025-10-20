"use client";

import React, { useState } from "react";
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
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { ClinicalAttentionService } from "../../service/clinical-attention-service";
import { ClinicalAttentionDetailResponse } from "../../types/clinical-attention-response";
import { useUser } from "@/context/user-context";
import { ClinicalServiceQuickSearchResponse } from "../../types/clinical-service-response";
import ClinicalServiceService from "../../service/clinical-service-service";
import ProductService from "@/app/dashboard/inventory/products/service/product-service"; // ajusta si tu ruta difiere
import { AdministrationRoute, AdministrationRouteLabels } from "@/app/dashboard/inventory/products/enums/administration-route";
import { ProductUnitType, ProductUnitTypeLabels } from "@/app/dashboard/inventory/products/enums/product-unit-type";
import { ProductQuickSearchResponse } from "@/app/dashboard/inventory/products/types/product-quick-search-response";

type CommonProps = {
  id: number;
  onClose: () => void;
  onAdded: (data: ClinicalAttentionDetailResponse) => void;
};

export function ServiceItemModal({ id, onClose, onAdded }: CommonProps) {
  const { userInfo } = useUser();
  const [submitting, setSubmitting] = useState(false);

  // Opciones para servicio (igual que antes)
  const [serviceOptions, setServiceOptions] = useState<{ value: string; label: string }[]>([]);
  const [searchResults, setSearchResults] = useState<ClinicalServiceQuickSearchResponse[]>([]);

  // Opciones de productos por fila (clave = índice de la fila)
  const [productOptionsMap, setProductOptionsMap] = useState<Record<number, { value: string; label: string }[]>>({});

  const form = useForm<AddClinicalAttentionServiceItemRequest>({
    resolver: zodResolver(addClinicalAttentionServiceItemSchema),
    defaultValues: {
      clinicalServiceId: undefined,
      unitPrice: 0,
      quantity: 1,
      notes: "",
      products: [],
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "products",
  });

  // —— BÚSQUEDA DE SERVICIOS (igual que tenías) ——
  const handleSearchServices = async (query: string) => {
    if (query.length < 2) {
      setServiceOptions([]);
      setSearchResults([]);
      return;
    }
    try {
      const results = await ClinicalServiceService.quickSearch(query, userInfo?.selectedBranch.id);
      const options = results.map((service) => ({
        value: String(service.id),
        label: service.name,
      }));
      setSearchResults(results);
      setServiceOptions(options);
    } catch {
      setServiceOptions([]);
      setSearchResults([]);
    }
  };

  // —— BÚSQUEDA DE PRODUCTOS (idéntico patrón al MedicationModal, pero por fila) ——
  const handleSearchProducts = async (rowIndex: number, query: string) => {
    if (query.length < 2) {
      setProductOptionsMap((prev) => ({ ...prev, [rowIndex]: [] }));
      return;
    }
    try {
      const results: ProductQuickSearchResponse[] = await ProductService.searchProducts(query, userInfo?.selectedBranch.id);
      const options = results.map((p) => ({ value: String(p.id), label: p.name }));
      setProductOptionsMap((prev) => ({ ...prev, [rowIndex]: options }));
    } catch {
      setProductOptionsMap((prev) => ({ ...prev, [rowIndex]: [] }));
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

  // Opciones estáticas para selects de enums con labels
  const routeOptions = Object.entries(AdministrationRouteLabels).map(([value, label]) => ({ value, label }));
  const unitOptions = Object.entries(ProductUnitTypeLabels).map(([value, label]) => ({ value, label }));

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Agregar servicio</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="clinicalServiceId"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelSelect
                      id="clinicalServiceId"
                      label="Servicio"
                      placeholder="Buscar servicio..."
                      options={serviceOptions}
                      onSearch={handleSearchServices}
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(v) => {
                        const selectedId = v ? Number(v) : undefined;
                        field.onChange(selectedId);
                        if (selectedId) {
                          const s = searchResults.find((x) => x.id === selectedId);
                          if (s) form.setValue("unitPrice", s.price || 0, { shouldValidate: true });
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="unitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelInput
                        id="unitPrice"
                        label="Precio unitario"
                        type="number"
                        value={String(field.value ?? "")}
                        onChange={(v) => field.onChange(v === "" ? 0 : Number(v))}
                      />
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
                      <FloatingLabelInput
                        id="quantity"
                        label="Cantidad"
                        type="number"
                        value={String(field.value ?? "")}
                        onChange={(v) => field.onChange(v === "" ? 1 : Number(v))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Productos del servicio</h3>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    append({
                      productId: undefined as unknown as number,
                      dose: 1,
                      unit: Object.values(ProductUnitType)[0],
                      administrationRoute: Object.values(AdministrationRoute)[0],
                    })
                  }
                >
                  Agregar producto
                </Button>
              </div>

              {fields.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay productos agregados.</p>
              ) : (
                <div className="space-y-3">
                  {fields.map((row, index) => (
                    <div key={row.id} className="grid gap-3 sm:grid-cols-4">
                      {/* Producto (con búsqueda tipo MedicationModal, pero por fila) */}
                      <FormField
                        control={form.control}
                        name={`products.${index}.productId`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormControl>
                              <FloatingLabelSelect
                                id={`product-${index}`}
                                label="Producto"
                                placeholder="Buscar producto..."
                                options={productOptionsMap[index] || []}
                                onSearch={(q: string) => handleSearchProducts(index, q)}
                                value={f.value ? String(f.value) : ""}
                                onValueChange={(v) => f.onChange(v ? Number(v) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Dosis */}
                      <FormField
                        control={form.control}
                        name={`products.${index}.dose`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormControl>
                              <FloatingLabelInput
                                id={`dose-${index}`}
                                label="Dosis"
                                type="number"
                                value={String(f.value ?? "")}
                                onChange={(v) => f.onChange(v === "" ? 0 : Number(v))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Unidad (labels) */}
                      <FormField
                        control={form.control}
                        name={`products.${index}.unit`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormControl>
                              <FloatingLabelSelect
                                id={`unit-${index}`}
                                label="Unidad"
                                placeholder="Selecciona unidad"
                                options={unitOptions}
                                value={f.value ? String(f.value) : ""}
                                onValueChange={(v) => f.onChange((v || null) as unknown as ProductUnitType)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Vía de administración (labels) + quitar */}
                      <div className="grid grid-cols-6 gap-2">
                        <FormField
                          control={form.control}
                          name={`products.${index}.administrationRoute`}
                          render={({ field: f }) => (
                            <FormItem className="col-span-5">
                              <FormControl>
                                <FloatingLabelSelect
                                  id={`route-${index}`}
                                  label="Vía"
                                  placeholder="Selecciona vía"
                                  options={routeOptions}
                                  value={f.value ? String(f.value) : ""}
                                  onValueChange={(v) => f.onChange((v || null) as unknown as AdministrationRoute)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="button" variant="destructive" onClick={() => remove(index)}>
                          Quitar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

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
