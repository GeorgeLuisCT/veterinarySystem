// app/dashboard/inventory/kardex/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Tag, Package, Boxes, ClipboardList } from "lucide-react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import DataTable from "@/components/data-table";
import type { PaginatedResponse } from "@/types/paginated-response";
import { useUser } from "@/context/user-context";
import { toast } from "sonner";
import { getAaxiosErrorMessage } from "@/helpers/error";

import InventoryMovementService from "../../../_service/inventory-movement-service";
import ProductService from "../../../_service/product-service";
import { useDebouncedSearch } from "../../../_components/movements/use-debounced-search";
import type { KardexMovementResponse } from "../../../_types/kardex-movement-response";
import type { ProductQuickSearchResponse } from "../../../_types/product-response";
import type { ProductBatchSearchResponse } from "../../../_types/product-batch-response";
import { KardexMovementTypeLabels } from "../../../_enums/kardex-movement-type";
import KardexFiltersBar from "../../../_components/movements/kardex-filters";
import DashboardLayoutSection from "@/app/dashboard/dashboard-layout-section";
import { PageContainer } from "@/components/page/page-container";

const DATE_TIME_FORMAT = "dd/MM/yyyy HH:mm";
const DATE_FORMAT = "dd/MM/yyyy";
const toBackendDate = (date?: Date) => (date ? format(date, "yyyy-MM-dd") : undefined);

type KardexActiveFilters = {
  productId: number;
  branchId?: number;
  batchId?: number;
  startDate?: string;
  endDate?: string;
};

const makeEmptyPage = (
  pageIndex: number,
  pageSize: number
): PaginatedResponse<KardexMovementResponse> => ({
  content: [],
  currentPage: pageIndex,
  pageSize,
  totalPages: 0,
  totalElements: 0,
});

export default function KardexPage() {
  const { userInfo } = useUser();

  const normalizedBranchId = useMemo(() => {
    const id = userInfo?.selectedBranch?.id;
    return id && id > 0 ? id : undefined;
  }, [userInfo?.selectedBranch?.id]);

  // filtros UI
  const [selectedProduct, setSelectedProduct] = useState<ProductQuickSearchResponse | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<ProductBatchSearchResponse | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // paginación control (para pedir datos)
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // datos
  const [pageData, setPageData] = useState<PaginatedResponse<KardexMovementResponse> | null>(null);
  const [loading, setLoading] = useState(false);

  // filtros efectivos
  const activeFilters = useMemo<KardexActiveFilters | null>(() => {
    if (!selectedProduct) return null;
    return {
      productId: selectedProduct.id,
      branchId: normalizedBranchId,
      batchId: selectedBatch?.id,
      startDate: toBackendDate(dateRange?.from),
      endDate: toBackendDate(dateRange?.to),
    };
  }, [selectedProduct, selectedBatch, dateRange, normalizedBranchId]);

  // búsquedas asincrónicas
  const {
    options: productOptions,
    setOptions: setProductOptions,
    loading: productLoading,
    search: searchProduct,
    cancel: cancelProductSearch,
  } = useDebouncedSearch<ProductQuickSearchResponse>((query) =>
    ProductService.searchProducts(query, normalizedBranchId)
  );

  const {
    options: batchOptions,
    setOptions: setBatchOptions,
    loading: batchLoading,
    search: searchBatch,
    cancel: cancelBatchSearch,
  } = useDebouncedSearch<ProductBatchSearchResponse>(async (query) => {
    if (!selectedProduct) return [];
    return InventoryMovementService.searchBatches({
      productId: selectedProduct.id,
      query,
    });
  });

  const resetFilters = () => {
    setSelectedProduct(null);
    setSelectedBatch(null);
    setDateRange(undefined);
    setProductOptions([]);
    setBatchOptions([]);
    setPageData(null);
    setPageIndex(0);
  };

  // cambio sucursal
  useEffect(() => {
    resetFilters();
    cancelProductSearch();
    cancelBatchSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedBranchId]);

  // cambio producto => limpiar lotes
  useEffect(() => {
    setSelectedBatch(null);
    setBatchOptions([]);
    cancelBatchSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProduct]);

  // si cambian filtros => volver a 0 (idempotente)
  useEffect(() => {
    if (pageIndex !== 0) setPageIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(activeFilters)]);

  // fetch
  const fetchKardex = useCallback(async () => {
    if (!activeFilters) {
      setPageData(null);
      return;
    }
    setLoading(true);
    try {
      const resp = await InventoryMovementService.getKardexHistory({
        page: pageIndex,
        size: pageSize,
        ...activeFilters,
      });
      setPageData(resp);
    } catch (error) {
      toast.error(getAaxiosErrorMessage(error) ?? "No se pudo obtener el kardex");
    } finally {
      setLoading(false);
    }
  }, [activeFilters, pageIndex, pageSize]);

  useEffect(() => {
    fetchKardex();
  }, [fetchKardex]);

  // handlers idempotentes (evitan loops por setState igual)
  const handlePageIndexChange = useCallback((next: number) => {
    setPageIndex((prev) => (prev === next ? prev : next));
  }, []);

  const handlePageSizeChange = useCallback((next: number) => {
    setPageSize((prev) => (prev === next ? prev : next));
    setPageIndex(0);
  }, []);

  const safePageData = pageData ?? makeEmptyPage(pageIndex, pageSize);

  // columnas
  const columns = useMemo<ColumnDef<KardexMovementResponse>[]>(
    () => [
      {
        accessorKey: "date",
        header: "Fecha",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="truncate">
              {format(new Date(row.original.date), DATE_TIME_FORMAT)}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: "Tipo",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Tag className="h-3.5 w-3.5 text-muted-foreground" />
            <Badge variant="outline">{KardexMovementTypeLabels[row.original.type]}</Badge>
          </div>
        ),
      },
      {
        accessorKey: "quantity",
        header: "Cantidad",
        cell: ({ row }) => (
          <div className="flex items-center gap-2 font-medium">
            <Package className="h-3.5 w-3.5 text-muted-foreground" />
            {row.original.quantity}
          </div>
        ),
      },
      {
        accessorKey: "resultingStock",
        header: "Stock Resultante",
        cell: ({ row }) => (
          <div className="flex items-center gap-2 font-medium">
            <Boxes className="h-3.5 w-3.5 text-muted-foreground" />
            {row.original.resultingStock}
          </div>
        ),
      },
      {
        accessorKey: "batchNumber",
        header: "Lote",
        cell: ({ row }) => (
          <Badge variant="secondary" className="rounded-full">
            {row.original.batchNumber ?? "—"}
          </Badge>
        ),
      },
      {
        accessorKey: "origin",
        header: "Origen",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">{row.original.originType}</span>
              <span className="text-xs text-muted-foreground">#{row.original.originId}</span>
            </div>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <DashboardLayoutSection>
      <PageContainer>
        <div className="flex h-full flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Historial de Kardex</h1>
              <p className="text-sm text-muted-foreground">
                Consulta el historial detallado de movimientos por producto.
              </p>
            </div>
          </div>

          <KardexFiltersBar
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            onReset={resetFilters}
            onRefresh={fetchKardex}
            loading={loading}
            // producto
            productSelected={selectedProduct}
            productOnSelect={(option) => {
              setSelectedProduct(option);
              setProductOptions([]);
            }}
            productPlaceholder="Buscar producto"
            productSearch={searchProduct}
            productCancel={cancelProductSearch}
            productOptions={productOptions}
            productLoading={productLoading}
            productGetOptionLabel={(option) => option.name}
            productGetOptionDescription={(option) =>
              option.sku ? `SKU: ${option.sku}` : undefined
            }
            // lote
            batchSelected={selectedBatch}
            batchOnSelect={(option) => {
              setSelectedBatch(option);
              setBatchOptions([]);
            }}
            batchPlaceholder="Buscar lote"
            batchSearch={searchBatch}
            batchCancel={cancelBatchSearch}
            batchOptions={batchOptions}
            batchLoading={batchLoading}
            batchGetOptionLabel={(option) => option.batchNumber}
            batchGetOptionDescription={(option) =>
              option.expirationDate
                ? `Vence: ${format(new Date(`${option.expirationDate}T00:00:00`), DATE_FORMAT)}`
                : "Sin vencimiento"
            }
            batchDisabled={!selectedProduct}
          />

          <div className="flex-1">
            <DataTable<KardexMovementResponse>
              pageData={safePageData}
              columns={columns}
              pageIndex={pageIndex}
              pageSize={pageSize}
              onPageIndexChange={handlePageIndexChange}
              onPageSizeChange={handlePageSizeChange}
              loading={loading}
              emptyState={
                activeFilters
                  ? "Sin movimientos con los filtros seleccionados."
                  : "Configura los filtros para visualizar el kardex."
              }
            />
          </div>
        </div>
      </PageContainer>
    </DashboardLayoutSection>
  );
}
