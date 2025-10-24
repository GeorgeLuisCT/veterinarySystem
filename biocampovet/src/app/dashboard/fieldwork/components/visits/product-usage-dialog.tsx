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
import ProductService from "@/app/dashboard/inventory/products/service/product-service";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/context/user-context";

export default function ProductUsageDialog({ open, onOpenChange, visitId, onSuccess }: { open: boolean; onOpenChange: (open: boolean) => void; visitId: number; onSuccess: () => void; }) {
  const { toast } = useToast();
  const { userInfo } = useUser();
  const branchId = userInfo?.selectedBranch?.id;

  const [productOptions, setProductOptions] = React.useState<{ value: string; label: string }[]>([]);

  const form = useForm<AddProductUsageRequest>({
    resolver: zodResolver(addProductUsageSchema),
    defaultValues: { unit: ProductUnitType.UNIT, quantityUsed: 1, notes: "", unitPrice: undefined } as AddProductUsageRequest,
  });

  const handleSearchProducts = React.useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (trimmed.length < 2) {
        setProductOptions([]);
        return;
      }
      try {
        const results = await ProductService.searchProducts(trimmed, branchId);
        setProductOptions(results.map((product) => ({ value: String(product.id), label: product.name })));
      } catch (error) {
        setProductOptions([]);
        toast({
          variant: "destructive",
          title: "Error al buscar productos",
          description: getAaxiosErrorMessage(error) ?? "No se pudo realizar la búsqueda.",
        });
      }
    },
    [branchId, toast]
  );

  const onSubmit = async (values: AddProductUsageRequest) => {
    try {
      await VisitService.addProductUsage(visitId, values);
      toast({ title: "Insumo registrado", description: "El consumo se registró correctamente." });
      onSuccess();
      form.reset({ unit: ProductUnitType.UNIT, quantityUsed: 1, unitPrice: undefined, notes: "", productId: undefined });
      setProductOptions([]);
      
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: getAaxiosErrorMessage(e) });
    }
  };

  React.useEffect(() => {
    if (!open) {
      form.reset({ unit: ProductUnitType.UNIT, quantityUsed: 1, unitPrice: undefined, notes: "", productId: undefined });
      setProductOptions([]);
    }
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Añadir insumo</DialogTitle>
          <DialogDescription>Registra el consumo de productos durante la visita.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField control={form.control} name="productId" render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FloatingLabelSelect
                    id="productId"
                    label="Producto *"
                    value={field.value ? String(field.value) : ""}
                    options={productOptions}
                    onValueChange={(value) => field.onChange(value ? Number(value) : undefined)}
                    onSearch={handleSearchProducts}
                    placeholder="Buscar producto…"
                  />
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
                  <FloatingLabelInput
                    id="quantityUsed"
                    label="Cantidad"
                    type="number"
                    value={field.value === undefined ? "" : String(field.value)}
                    onChange={(v) => field.onChange(v === "" ? undefined : Number(v))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="unitPrice" render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FloatingLabelInput
                    id="unitPrice"
                    label="Precio unitario"
                    type="number"
                    step="0.01"
                    value={field.value === undefined || field.value === null ? "" : String(field.value)}
                    onChange={(v) => field.onChange(v === "" ? undefined : Number(v))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    id="notes"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="Notas adicionales"
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <p className="text-xs text-muted-foreground">
              El vehículo asignado a la visita se aplicará automáticamente para afectar el inventario.
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => form.reset({ unit: ProductUnitType.UNIT, quantityUsed: 1, notes: "", productId: undefined })}>
                Limpiar
              </Button>
              <Button type="submit">Guardar</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
