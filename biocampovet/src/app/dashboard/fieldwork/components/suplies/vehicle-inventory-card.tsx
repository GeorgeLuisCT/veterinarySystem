"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import VehicleService from "../../services/vehicle-service";
import type { VehicleStockResponse } from "../../types/vehicle-response";
import { ProductUnitTypeLabels } from "@/app/dashboard/inventory/products/enums/product-unit-type";

export default function VehicleInventoryCard({ vehicleId, refreshKey }: { vehicleId: number | null; refreshKey?: number }) {
  const [stock, setStock] = React.useState<VehicleStockResponse[]>([]);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    if (vehicleId == null) { setStock([]); return; }
    setLoading(true);
    try {
      const res = await VehicleService.getStock(vehicleId);
      setStock(res);
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  React.useEffect(() => { load(); }, [load, refreshKey]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventario del vehículo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="p-2">Producto</th>
                <th className="p-2">SKU</th>
                <th className="p-2">Unidad</th>
                <th className="p-2 text-right">Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {stock.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="p-2">{item.productName}</td>
                  <td className="p-2">{item.sku ?? "—"}</td>
                  <td className="p-2">{ProductUnitTypeLabels[item.unit] ?? item.unit}</td>
                  <td className="p-2 text-right">{item.quantity}</td>
                </tr>
              ))}
              {!loading && stock.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-muted-foreground">{vehicleId == null ? "Selecciona un vehículo para ver su inventario." : "Sin productos."}</td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-muted-foreground">Cargando stock…</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}