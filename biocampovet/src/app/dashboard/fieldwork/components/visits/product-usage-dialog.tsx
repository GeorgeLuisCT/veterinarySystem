"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import VisitService from "../../services/visit-service";
import { addProductUsageSchema, type AddProductUsageRequest } from "../../types/visit-request";
import { ProductUnitType, ProductUnitTypeLabels } from "@/app/dashboard/inventory/products/enums/product-unit-type";
import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";

export default function ProductUsageDialog({ open, onOpenChange, visitId, onSuccess }: { open: boolean; onOpenChange: (open: boolean) => void; visitId: number; onSuccess: () => void; }) {
  const { toast } = useToast();
  const form = useForm<AddProductUsageRequest>({
    resolver: zodResolver(addProductUsageSchema),
    defaultValues: { unit: ProductUnitType.UNIT, quantityUsed: 1 } as any,
  });

  const onSubmit = async (values: AddProductUsageRequest) => {
    try { await VisitService.addProductUsage(visitId, values); onSuccess(); }
    catch (e) { toast({ variant: "destructive", title: "Error", description: getAaxiosErrorMessage(e) }); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Añadir insumo</DialogTitle>
          <DialogDescription>Registra consumo de un insumo.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField control={form.control} name="productId" render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FloatingLabelInput id="productId" label="ID Producto (temporal)" value={String(field.value ?? "")} onChange={(v) => field.onChange(v ? Number(v) : undefined)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="unit" render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FloatingLabelSelect
                    id="unit"
                    label="Unidad"
                    value={(field.value as string) || ProductUnitType.UNIT}
                    onValueChange={field.onChange}
                    options={(Object.values(ProductUnitType) as ProductUnitType[]).map((u) => ({ value: u, label: ProductUnitTypeLabels[u] }))}
                    emptyMessage="Sin resultados"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="quantityUsed" render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FloatingLabelInput id="quantityUsed" label="Cantidad" value={String(field.value ?? "")} onChange={(v) => field.onChange(v === "" ? undefined : Number(v))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="vehicleId" render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FloatingLabelInput id="vehicleId" label="ID Vehículo (opcional)" value={String(field.value ?? "")} onChange={(v) => field.onChange(v ? Number(v) : undefined)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FloatingLabelInput id="notes" label="Notas" value={String(field.value ?? "")} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => form.reset()}>Limpiar</Button>
              <Button type="submit">Guardar</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}