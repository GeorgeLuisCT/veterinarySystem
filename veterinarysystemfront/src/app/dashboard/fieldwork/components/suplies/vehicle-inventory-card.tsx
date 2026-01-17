"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import VehicleService from "../../services/vehicle-service";
import type { VehicleStockResponse } from "../../types/vehicle-response";
import type { PaginatedResponse } from "@/types/paginated-response";
import DataTable from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { ProductUnitTypeLabels } from "@/app/dashboard/inventory/_enums/product-unit-type";

export default function VehicleInventoryCard({
  vehicleId,
  refreshKey,
}: {
  vehicleId: number | null;
  refreshKey?: number;
}) {
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [pageData, setPageData] = React.useState<PaginatedResponse<VehicleStockResponse> | null>(null);
  const [loading, setLoading] = React.useState(false);

  const fetchPage = React.useCallback(async () => {
    if (vehicleId == null) {
      setPageData(null);
      return;
    }
    setLoading(true);
    try {
      const res = await VehicleService.getStock(vehicleId, pageIndex, pageSize);
      setPageData(res);
    } finally {
      setLoading(false);
    }
  }, [vehicleId, pageIndex, pageSize]);

  React.useEffect(() => {
    fetchPage();
  }, [fetchPage, refreshKey]);

  const columns = React.useMemo<ColumnDef<VehicleStockResponse>[]>(() => [
    { header: "Producto", accessorKey: "productName" },
    { header: "SKU", accessorKey: "sku" },
    {
      header: "Unidad",
      accessorKey: "unit",
      cell: ({ row }) => ProductUnitTypeLabels[row.original.unit] ?? row.original.unit,
    },
    {
      header: "Cantidad",
      accessorKey: "quantity",
      cell: ({ getValue }) => <div className="text-right">{getValue<number>()}</div>,
    },
  ], []);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Inventario del vehículo</CardTitle>
        <p className="text-sm text-muted-foreground">
          {vehicleId == null ? "Selecciona un vehículo para ver su inventario" : "Productos en el vehículo seleccionado"}
        </p>
      </CardHeader>
      <CardContent>
        <DataTable<VehicleStockResponse>
          pageData={pageData}
          columns={columns}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPageIndexChange={setPageIndex}
          onPageSizeChange={(s) => { setPageSize(s); setPageIndex(0); }}
          loading={loading}
          getRowKey={(row) => row.id}
          emptyState={
            <div className="text-muted-foreground">
              {loading ? "Cargando stock…" : vehicleId == null ? "Selecciona un vehículo para ver su inventario." : "Sin productos."}
            </div>
          }
        />
      </CardContent>
    </Card>
  );
}
