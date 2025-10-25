"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { ProductUnitType, ProductUnitTypeLabels } from "@/app/dashboard/inventory/_enums/product-unit-type";
import { adjustVehicleStockSchema, type AdjustVehicleStockRequest } from "../../types/vehicle-request";
import VehicleService from "../../services/vehicle-service";
import ProductService from "@/app/dashboard/inventory/_service/product-service";
import type { ProductResponse } from "@/app/dashboard/inventory/_types/product-response";
import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";

export default function TransferDialog({ product, vehicleId, branchId, onClose, onTransferred }: { product: ProductResponse | null; vehicleId: number | null; branchId: number | null; onClose: () => void; onTransferred: () => void; }) {
  const open = product != null && vehicleId != null;
  const { toast } = useToast();

  const [branchStock, setBranchStock] = React.useState<{ stockUnits: number; stockFractional: number } | null>(null);

  React.useEffect(() => {
    (async () => {
      if (!product || !branchId) { setBranchStock(null); return; }
      try {
        const detail = await ProductService.getProduct(product.id);
        const found = detail.branchStocks.find((s) => s.branchId === branchId) ?? null;
        setBranchStock(found ? { stockUnits: found.stockUnits, stockFractional: found.stockFractional } : null);
      } catch {}
    })();
  }, [product, branchId]);

  const form = useForm<AdjustVehicleStockRequest>({
    resolver: zodResolver(adjustVehicleStockSchema),
    defaultValues: { vehicleId: vehicleId ?? undefined, productId: product?.id, quantityDelta: 0, unit: product?.unitType ?? ProductUnitType.UNIT, notes: "" },
  });

  React.useEffect(() => {
    form.reset({ vehicleId: vehicleId ?? undefined, productId: product?.id, quantityDelta: 0, unit: product?.unitType ?? ProductUnitType.UNIT, notes: "" });
  }, [product, vehicleId]);

  const onSubmit = async (values: AdjustVehicleStockRequest) => {
    if (!vehicleId || !product) return;
    if (!values.quantityDelta || values.quantityDelta === 0) {
      form.setError("quantityDelta", { message: "Ingresa una cantidad distinta de cero." });
      return;
    }
    try {
      await VehicleService.adjustStock({ ...values, vehicleId });
      toast({ title: "Transferencia registrada", description: "El inventario móvil se actualizó correctamente." });
      onTransferred();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: getAaxiosErrorMessage(error) ?? "No se pudo registrar la transferencia." });
    }
  };

  const availableUnits = branchStock?.stockUnits ?? 0;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar al vehículo</DialogTitle>
          <DialogDescription>Traslada unidades del almacén de sucursal al vehículo seleccionado.</DialogDescription>
        </DialogHeader>

        {product && (
          <Form {...form}>
            <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
                <div><strong>Producto:</strong> {product.name}</div>
                <div><strong>Unidad base:</strong> {ProductUnitTypeLabels[product.unitType]}</div>
                <div><strong>Disponible en sucursal:</strong> {availableUnits}</div>
              </div>

              <FormField
                control={form.control}
                name="quantityDelta"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelInput
                        id="quantityDelta"
                        label="Cantidad a transferir"
                        value={field.value === undefined || field.value === null ? "" : String(field.value)}
                        onChange={(value) => field.onChange(value === "" ? undefined : Number(value))}
                        type="number"
                        placeholder="Ej. 10"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
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
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelInput id="notes" label="Notas (opcional)" value={field.value ?? ""} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => form.reset()}>Limpiar</Button>
                <Button type="submit" disabled={!vehicleId}>Registrar</Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
