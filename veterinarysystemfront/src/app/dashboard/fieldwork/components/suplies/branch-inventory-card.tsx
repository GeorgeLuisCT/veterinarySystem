"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";
import ProductService from "@/app/dashboard/inventory/_service/product-service";
import type { PaginatedResponse } from "@/types/paginated-response";
import { FloatingLabelInput } from "@/components/floating-label-input";
import DataTable, { type Action } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import type { ProductResponse, ProductSummaryResponse } from "@/app/dashboard/inventory/_types/product-response";
import { PageSection } from "@/components/page/page-section";

export default function BranchInventoryCard({ branchId, onAddToVehicle, vehicleSelected, refreshKey }: { branchId: number | null; onAddToVehicle: (product: ProductResponse) => void; vehicleSelected: boolean; refreshKey?: number; }) {
  const { toast } = useToast();
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [search, setSearch] = React.useState("");
  const [pageData, setPageData] = React.useState<PaginatedResponse<ProductSummaryResponse> | null>(null);
  const [loading, setLoading] = React.useState(false);

  const fetchPage = React.useCallback(async () => {
    if (!branchId) { setPageData(null); return; }
    setLoading(true);
    try {
      const res = await ProductService.getProducts({ page: pageIndex, size: pageSize, active: true, branchId, q: search || undefined });
      setPageData(res);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: getAaxiosErrorMessage(error) ?? "No se pudo obtener el inventario de la sucursal." });
    } finally {
      setLoading(false);
    }
  }, [branchId, pageIndex, pageSize, search, toast]);

  React.useEffect(() => { fetchPage(); }, [fetchPage, refreshKey]);

  const columns = React.useMemo<ColumnDef<ProductSummaryResponse>[]>(() => [
    { header: "Producto", accessorKey: "name" },
    { header: "SKU", accessorKey: "sku" },
    { header: "Stock", accessorKey: "formattedStock" },
  ], []);

  const actions: Action<ProductSummaryResponse>[] = [
    {
      label: "Agregar al vehículo",
      type: "direct",
      icon: <Plus className="h-4 w-4" />,
      onClick: async (row) => {
        if (!vehicleSelected) return;
        try {
          const detail = await ProductService.getProduct(row.id);
          onAddToVehicle(detail);
        } catch (error) {
          toast({ variant: "destructive", title: "Error", description: getAaxiosErrorMessage(error) ?? "No se pudo obtener el detalle del producto." });
        }
      },
    },
  ];

  const headerLeft = (
    <FloatingLabelInput id="branchSearch" label="Buscar producto" value={search} onChange={(v) => { setSearch(v); setPageIndex(0); }} />
  );

  const headerRight = (
    <Button variant="outline" size="sm" onClick={() => fetchPage()} disabled={loading}>Buscar</Button>
  );

  return (
    <PageSection title="Inventario de la sucursal" description={branchId ? "Productos disponibles en la sucursal seleccionada" : "Selecciona una sucursal para ver inventario"} className="h-full">
        <DataTable<ProductSummaryResponse>
          pageData={pageData}
          columns={columns}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPageIndexChange={setPageIndex}
          onPageSizeChange={setPageSize}
          loading={loading}
          headerSlotLeft={headerLeft}
          headerSlotRight={headerRight}
          getRowKey={(row) => row.id}
          emptyState={<div className="text-muted-foreground">{loading ? "Cargando inventario…" : "No se encontraron productos."}</div>}
          actions={vehicleSelected ? actions : []}
        />
      </PageSection>
  );
}
