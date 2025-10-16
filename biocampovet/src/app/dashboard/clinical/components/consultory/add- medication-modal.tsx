"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { Textarea } from "@/components/ui/textarea";
import { ClinicalAttentionService } from "../../service/clinical-attention-service";
import ProductService from "@/app/dashboard/inventory/products/service/product-service";
import { addClinicalAttentionMedicationSchema, AddClinicalAttentionMedicationRequest } from "../../types/clinical-attention-request";
import { ClinicalAttentionDetailResponse } from "../../types/clinical-attention-response";
import { AdministrationRouteLabels } from "@/app/dashboard/inventory/products/enums/administration-route";
import { ProductUnitTypeLabels } from "@/app/dashboard/inventory/products/enums/product-unit-type";
import { FrequencyUnitLabels } from "../../enums/frequency-unit";
import { useUser } from "@/context/user-context";

type CommonProps = {
  id: number;
  onClose: () => void;
  onAdded: (data: ClinicalAttentionDetailResponse) => void;
};

export function MedicationModal({ id, onClose, onAdded }: CommonProps) {
  const { userInfo } = useUser();
  const [submitting, setSubmitting] = useState(false);
  const [productOptions, setProductOptions] = useState<{ value: string; label: string }[]>([]);

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

  const handleSearchProducts = async (query: string) => {
    if (query.length < 2) {
      setProductOptions([]);
      return;
    }
    try {
      const results = await ProductService.searchProducts(query, userInfo?.selectedBranch.id);
      const options = results.map((product) => ({
        value: String(product.id),
        label: product.name,
      }));
      setProductOptions(options);
    } catch (error) {
      console.error("Error searching products:", error);
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

  const routeOptions = Object.entries(AdministrationRouteLabels).map(([value, label]) => ({ value, label }));
  const unitOptions = Object.entries(ProductUnitTypeLabels).map(([value, label]) => ({ value, label }));
  const frequencyUnitOptions = Object.entries(FrequencyUnitLabels).map(([value, label]) => ({ value, label }));

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar medicación</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelSelect
                      id="productId"
                      label="Producto"
                      placeholder="Buscar producto..."
                      options={productOptions}
                      onSearch={handleSearchProducts}
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
              name="administeredAt"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelInput
                      id="administeredAt"
                      label="Fecha y hora de administración"
                      type="datetime-local"
                      value={field.value}
                      onChange={(v) => field.onChange(v)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="doseAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelInput
                        id="doseAmount"
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
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="frequencyValue"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelInput
                        id="frequencyValue"
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
                name="frequencyUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelSelect
                        id="frequencyUnit"
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
              <Button type="submit" disabled={submitting}>
                {submitting ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}