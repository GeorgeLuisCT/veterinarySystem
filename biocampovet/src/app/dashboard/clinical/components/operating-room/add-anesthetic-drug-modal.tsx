"use client";

import React, { useState } from "react";
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

type Option = {
  value: string;
  label: string;
};

interface AddAnestheticDrugModalProps {
  reportId: number;
  open: boolean;
  onClose: () => void;
  onAdded: (detail: SurgicalReportDetailResponse) => void;
}

export function AddAnestheticDrugModal({
  reportId,
  open,
  onClose,
  onAdded,
}: AddAnestheticDrugModalProps) {
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

  const onSubmit = async (values: AddSurgicalReportAnestheticDrugRequest) => {
    setSubmitting(true);
    try {
      const response = await SurgicalReportService.addAnestheticDrug(reportId, values);
      onAdded(response);
      toast({
        title: "Fármaco agregado",
        description: "Se agregó el fármaco al protocolo anestésico.",
      });
      onClose();
    } catch (error) {
      console.error("Error adding anesthetic drug:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo agregar el fármaco. Intenta de nuevo.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const doseUnitOptions = Object.entries(ProductUnitTypeLabels).map(([value, label]) => ({
    value,
    label,
  }));

  const routeOptions = Object.entries(AdministrationRouteLabels).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <Dialog open={open} onOpenChange={(value) => (!value ? onClose() : undefined)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Agregar fármaco anestésico</DialogTitle>
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
                      id="anesthetic-product"
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
            <FormField
              control={form.control}
              name="phase"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelSelect
                      id="anesthetic-phase"
                      label="Fase"
                      options={AnestheticPhaseOptions}
                      value={field.value ?? ""}
                      onValueChange={(value) => field.onChange(value || undefined)}
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
                        id="doseAmount"
                        label="Dosis"
                        type="number"
                        value={field.value ?? ""}
                        onChange={(value) => field.onChange(value === "" ? null : Number(value))}
                        step="0.01"
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
                        options={doseUnitOptions}
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
                      id="administrationRoute"
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
