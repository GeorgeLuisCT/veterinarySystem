"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  AddSurgicalReportPostOperativeIndicationRequest,
  addSurgicalReportPostOpIndicationSchema,
} from "../../types/surgical-report-request";
import ProductService from "@/app/dashboard/inventory/products/service/product-service";
import SurgicalReportService from "../../service/surgical-report-service";
import { SurgicalReportDetailResponse } from "../../types/surgical-report-response";
import { useUser } from "@/context/user-context";
import { ProductUnitTypeLabels } from "@/app/dashboard/inventory/products/enums/product-unit-type";
import { FrequencyUnitLabels } from "../../enums/frequency-unit";
import { AdministrationRouteLabels } from "@/app/dashboard/inventory/products/enums/administration-route";

type Option = {
  value: string;
  label: string;
};

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
      productId: undefined,
      doseAmount: null,
      doseUnit: null,
      frequencyValue: null,
      frequencyUnit: null,
      route: null,
      nonDrugInstruction: null,
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (mode === "medication") {
      form.setValue("nonDrugInstruction", null, { shouldValidate: true, shouldDirty: true });
    } else {
      form.setValue("productId", null, { shouldValidate: true, shouldDirty: true });
      form.setValue("doseAmount", null, { shouldValidate: true, shouldDirty: true });
      form.setValue("doseUnit", null, { shouldValidate: true, shouldDirty: true });
      form.setValue("frequencyValue", null, { shouldValidate: true, shouldDirty: true });
      form.setValue("frequencyUnit", null, { shouldValidate: true, shouldDirty: true });
      form.setValue("route", null, { shouldValidate: true, shouldDirty: true });
    }
  }, [mode, form]);

  const handleSearchProducts = async (query: string) => {
    if (query.length < 2) {
      setProductOptions([]);
      return;
    }
    try {
      const results = await ProductService.searchProducts(query, userInfo?.selectedBranch.id);
      setProductOptions(
        results.map((product) => ({
          value: String(product.id),
          label: product.name,
        }))
      );
    } catch (error) {
      console.error("Error searching products:", error);
      setProductOptions([]);
    }
  };

  const onSubmit = async (values: AddSurgicalReportPostOperativeIndicationRequest) => {
    setSubmitting(true);
    try {
      const response = await SurgicalReportService.addPostOperativeIndication(reportId, values);
      onAdded(response);
      toast({
        title: "Indicaciones actualizadas",
        description: "Se agregó la indicación post operatoria.",
      });
      onClose();
    } catch (error) {
      console.error("Error adding post operative indication:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo agregar la indicación. Intenta nuevamente.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const unitOptions = Object.entries(ProductUnitTypeLabels).map(([value, label]) => ({
    value,
    label,
  }));

  const frequencyOptions = Object.entries(FrequencyUnitLabels).map(([value, label]) => ({
    value,
    label,
  }));

  const routeOptions = Object.entries(AdministrationRouteLabels).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <Dialog open={open} onOpenChange={(value) => (!value ? onClose() : undefined)}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Agregar indicación post operatoria</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={mode === "medication" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("medication")}
          >
            Medicamento
          </Button>
          <Button
            type="button"
            variant={mode === "instruction" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("instruction")}
          >
            Instrucción
          </Button>
        </div>
        <Form {...form}>
          <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
            {mode === "medication" ? (
              <>
                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FloatingLabelSelect
                          id="post-op-product"
                          label="Producto"
                          placeholder="Buscar producto..."
                          options={productOptions}
                          onSearch={handleSearchProducts}
                          value={field.value ? String(field.value) : ""}
                          onValueChange={(value) => field.onChange(value ? Number(value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="doseAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <FloatingLabelInput
                            id="post-op-dose"
                            label="Dosis"
                            type="number"
                            step="0.01"
                            value={field.value ?? ""}
                            onChange={(value) => field.onChange(value === "" ? null : Number(value))}
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
                            id="post-op-dose-unit"
                            label="Unidad"
                            options={unitOptions}
                            value={field.value ?? ""}
                            onValueChange={(value) => field.onChange(value || null)}
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
                            id="post-op-frequency-value"
                            label="Frecuencia"
                            type="number"
                            value={field.value ?? ""}
                            onChange={(value) => field.onChange(value === "" ? null : Number(value))}
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
                            id="post-op-frequency-unit"
                            label="Unidad de frecuencia"
                            options={frequencyOptions}
                            value={field.value ?? ""}
                            onValueChange={(value) => field.onChange(value || null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="route"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FloatingLabelSelect
                          id="post-op-route"
                          label="Vía de administración"
                          options={routeOptions}
                          value={field.value ?? ""}
                          onValueChange={(value) => field.onChange(value || null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            ) : (
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
                        onChange={(event) => field.onChange(event.target.value === "" ? null : event.target.value)}
                        placeholder="Indicación no farmacológica"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting || !form.formState.isValid}>
                {submitting ? "Guardando..." : "Agregar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
