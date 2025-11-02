"use client";

import { useCallback, useEffect, useState } from "react";
import { History, RefreshCcw } from "lucide-react";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PaginatedResponse } from "@/types/paginated-response";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import InventoryMovementService from "../../_service/inventory-movement-service";
import { getAaxiosErrorMessage } from "@/helpers/error";
import type { BranchResponse } from "@/app/dashboard/branche/types/branch-response";
import type { KardexMovementResponse } from "../../_types/kardex-movement-response";
import { KardexMovementTypeLabels } from "../../_enums/kardex-movement-type";
import ProductService from "../../_service/product-service";
import type { ProductQuickSearchResponse } from "../../_types/product-response";
import { useDebouncedSearch } from "../../_components/movements/use-debounced-search";
import { SearchPopover } from "../../_components/movements/search-popover";

const DATE_TIME_FORMAT = "dd/MM/yyyy HH:mm";

interface KardexSectionProps {
  branchOptions: BranchResponse[];
  defaultBranchId?: number;
}

export function KardexSection({ branchOptions, defaultBranchId }: KardexSectionProps) {
  const [selectedProduct, setSelectedProduct] = useState<ProductQuickSearchResponse | null>(null);
  const [branchId, setBranchId] = useState<number | undefined>(defaultBranchId);
  const [batchId, setBatchId] = useState("");
  const [pageData, setPageData] = useState<PaginatedResponse<KardexMovementResponse> | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<{ productId: number; branchId: number; batchId?: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    options: productOptions,
    setOptions: setProductOptions,
    loading: productLoading,
    search: searchProduct,
    cancel: cancelProductSearch,
  } = useDebouncedSearch<ProductQuickSearchResponse>((query) =>
    ProductService.searchProducts(query, branchId)
  );

  useEffect(() => {
    cancelProductSearch();
    setProductOptions([]);
  }, [branchId, cancelProductSearch, setProductOptions]);

  const refresh = useCallback(async () => {
    if (!filters) return;
    setLoading(true);
    try {
      const response = await InventoryMovementService.getKardexHistory({
        page: pageIndex,
        size: pageSize,
        productId: filters.productId,
        branchId: filters.branchId,
        batchId: filters.batchId,
      });
      setPageData(response);
    } catch (error) {
      toast.error(getAaxiosErrorMessage(error) ?? "No se pudo obtener el kardex");
    } finally {
      setLoading(false);
    }
  }, [filters, pageIndex, pageSize]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    setPageIndex(0);
  }, [filters?.productId, filters?.branchId]);

  const handleSearch = () => {
    if (!selectedProduct || !branchId) {
      toast.error("Selecciona el producto y la sucursal");
      return;
    }

    setFilters({
      productId: selectedProduct.id,
      branchId,
      batchId: batchId ? Number(batchId) : undefined,
    });
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="space-y-2 lg:col-span-2">
          <Label>Producto</Label>
          <SearchPopover
            selected={selectedProduct}
            onSelect={(option) => {
              setSelectedProduct(option);
              setProductOptions([]);
            }}
            placeholder="Buscar producto"
            search={searchProduct}
            cancel={cancelProductSearch}
            options={productOptions}
            loading={productLoading}
            getOptionLabel={(option) => option.name}
            getOptionDescription={(option) => (option.sku ? `SKU: ${option.sku}` : undefined)}
          />
        </div>

        <div className="space-y-2">
          <Label>Sucursal</Label>
          <Select
            value={branchId ? String(branchId) : ""}
            onValueChange={(value) => setBranchId(value ? Number(value) : undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una sucursal" />
            </SelectTrigger>
            <SelectContent>
              {branchOptions.map((branch) => (
                <SelectItem key={branch.id} value={String(branch.id)}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>ID de lote (opcional)</Label>
          <Input value={batchId} onChange={(event) => setBatchId(event.target.value)} placeholder="Ej. 1024" />
        </div>

        <div className="flex items-end">
          <Button onClick={handleSearch} className="w-full">
            <History className="mr-2 h-4 w-4" />
            Consultar
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden rounded-md border">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground">Historial kardex</h3>
            {filters ? (
              <p className="text-xs text-muted-foreground">
                {selectedProduct?.name ?? ""} ·{" "}
                {branchOptions.find((branch) => branch.id === filters.branchId)?.name ?? "Sucursal"}
                {filters.batchId ? ` · Lote ${filters.batchId}` : ""}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Selecciona filtros y consulta.</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              className="rounded-md border border-border px-2 py-1 text-sm"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPageIndex(0);
              }}
            >
              {[10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size} / página
                </option>
              ))}
            </select>
            <Button variant="ghost" size="icon" onClick={refresh} disabled={loading}>
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="relative h-full overflow-auto">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60">
              <RefreshCcw className="h-5 w-5 animate-spin" />
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Stock resultante</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Origen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!pageData || pageData.content.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                    {filters ? "Sin movimientos con los filtros seleccionados." : "Configura los filtros para visualizar el kardex."}
                  </TableCell>
                </TableRow>
              ) : (
                pageData.content.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{format(new Date(item.date), DATE_TIME_FORMAT)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{KardexMovementTypeLabels[item.type]}</Badge>
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.resultingStock}</TableCell>
                    <TableCell>{item.batchNumber ?? "-"}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{item.originType}</span>
                        <span className="text-xs text-muted-foreground">#{item.originId}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {pageData && pageData.totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-2 text-sm">
            <span>
              Página {pageIndex + 1} de {pageData.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageIndex((prev) => Math.max(prev - 1, 0))}
                disabled={pageIndex === 0}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageIndex((prev) => Math.min(prev + 1, (pageData.totalPages ?? 1) - 1))}
                disabled={pageIndex >= (pageData.totalPages ?? 1) - 1}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
