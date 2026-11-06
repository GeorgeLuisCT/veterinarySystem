"use client";

import React, { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

import {
  AddSurgicalReportMaterialRequest,
  addSurgicalReportMaterialSchema,
} from "../../types/surgical-report-request";
import ProductService from "@/app/dashboard/inventory/_service/product-service";
import SurgicalReportService from "../../service/surgical-report-service";
import { SurgicalReportDetailResponse } from "../../types/surgical-report-response";
import { useUser } from "@/context/user-context";
import { ProductUnitType, ProductUnitTypeLabels } from "@/app/dashboard/inventory/_enums/product-unit-type";
import { ProductQuickSearchResponse } from "@/app/dashboard/inventory/_types/product-response";

type Option = { value: string; label: string };

interface AddMaterialModalProps {
  reportId: number;
  open: boolean;
  onClose: () => void;
  onAdded: (detail: SurgicalReportDetailResponse) => void;
}

export function AddMaterialModal({ reportId, open, onClose, onAdded }: AddMaterialModalProps) {
  const { toast } = useToast();
  const { userInfo } = useUser();

  const [productOptions, setProductOptions] = useState<Option[]>([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Opciones del enum (solo UI)
  const unitTypeOptions: Option[] = Object.entries(ProductUnitTypeLabels).map(([value, label]) => ({
    value,
    label,
  }));

  const form = useForm<AddSurgicalReportMaterialRequest>({
    resolver: zodResolver(addSurgicalReportMaterialSchema),
    defaultValues: {
      productId: undefined,
      quantity: 1,
      unitType: undefined as unknown as ProductUnitType,
    },
    mode: "onChange",
  });

  // Búsqueda con debounce para catálogo
  const debounceRef = useRef<number | null>(null);
  const handleSearchProducts = (query: string) => {
    const q = query.trim();
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (q.length < 2) {
      setProductOptions([]);
      return;
    }
    setSearching(true);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const results = await ProductService.searchProducts(q, userInfo?.selectedBranch.id);
        setProductOptions(results.map((p: ProductQuickSearchResponse) => ({ value: String(p.id), label: p.name })));
      } catch {
        setProductOptions([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const closeAndReset = () => {
    form.reset({ productId: undefined, quantity: 1, unitType: undefined as unknown as ProductUnitType });
    setProductOptions([]);
    onClose();
  };

  const onSubmit = async (values: AddSurgicalReportMaterialRequest) => {
    setSubmitting(true);
    try {
      const response = await SurgicalReportService.addMaterial(reportId, values);
      onAdded(response);
      toast({ title: "Material agregado", description: "El material se registró correctamente en el reporte." });
      closeAndReset();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudo agregar el material. Intenta nuevamente." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? closeAndReset() : undefined)}>
      <DialogContent className="w-[min(92vw,840px)] max-h-[90vh] overflow-y-auto rounded-lg sm:max-w-2xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl">Agregar material quirúrgico</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Busca el material en catálogo y registra cantidad y unidad.
          </p>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate autoComplete="off">
            {/* Bloque único: Producto / Cantidad / Unidad */}
            <fieldset className="border-t pt-4 first:border-t-0 first:pt-0">
              <legend className="mb-3 text-sm font-semibold text-foreground">Material</legend>

              <div className="grid gap-3 sm:grid-cols-12">
                {/* Producto */}
                <div className="sm:col-span-6">
                  <FormField
                    control={form.control}
                    name="productId"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <FloatingLabelSelect
                            id="material-product"
                            label="Producto *"
                            placeholder={searching ? "Buscando…" : "Buscar producto…"}
                            options={productOptions}
                            onSearch={handleSearchProducts}
                            value={field.value ? String(field.value) : ""}
                            onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">Escribe 2+ caracteres para buscar por nombre.</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Cantidad */}
                <div className="sm:col-span-3">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <FloatingLabelInput
                            id="material-quantity"
                            label="Cantidad *"
                            type="number"
                            step="1"
                            value={field.value ?? ""}
                            onChange={(v) => field.onChange(v === "" ? 1 : Number(v))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Unidad (del enum) */}
                <div className="sm:col-span-3">
                  <FormField
                    control={form.control}
                    name="unitType"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <FloatingLabelSelect
                            id="material-unit-type"
                            label="Unidad *"
                            placeholder="Unidad…"
                            options={unitTypeOptions}
                            value={field.value ? String(field.value) : ""}
                            onValueChange={(v) => field.onChange(v as ProductUnitType)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </fieldset>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={closeAndReset}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting || !form.formState.isValid}>
                {submitting ? "Guardando…" : "Agregar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
