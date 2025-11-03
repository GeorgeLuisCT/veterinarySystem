"use client";

import { JSX, useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";
import { Eye, PlusCircle, CalendarDays, Tag, Truck, UserRound, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import DataTable, { Action } from "@/components/data-table";
import { toast } from "sonner";
import type { PaginatedResponse } from "@/types/paginated-response";
import { getAaxiosErrorMessage } from "@/helpers/error";
import { useUser } from "@/context/user-context";
import PurchaseFiltersBar, { PurchaseFilters } from "./movements/purchase-filters";
import { InventoryMovementSummaryResponse } from "../_types/inventory-movement-summary-response";
import InventoryMovementService from "../_service/inventory-movement-service";
import { PurchaseDialog } from "./movements/purchase-dialog";
import { InventoryMovementType } from "../_enums/inventory-movement-type";
import { Badge } from "@/components/ui/badge";
import { redirect } from "next/navigation";

const DATE_TIME_DISPLAY_FORMAT = "dd/MM/yyyy HH:mm";



export default function MainInventoryPurchases() {
  const { userInfo } = useUser();
  const selectedBranchId = userInfo?.selectedBranch?.id;
  const normalizedBranchId = selectedBranchId && selectedBranchId !== 0 ? selectedBranchId : undefined;

  const [pageData, setPageData] = useState<PaginatedResponse<InventoryMovementSummaryResponse> | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState<PurchaseFilters>({
    dateRange: { from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), to: new Date() },
  });

  const [purchaseOpen, setPurchaseOpen] = useState(false);

  useEffect(() => {
    setPageIndex(0);
  }, [normalizedBranchId, JSON.stringify(filters)]);

  const columns = useMemo<ColumnDef<InventoryMovementSummaryResponse>[]>(() => {
    const cols: ColumnDef<InventoryMovementSummaryResponse>[] = [
      {
        accessorKey: "date",
        header: "Fecha",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 text-zinc-500" />
            <span className="truncate">{format(new Date(row.original.date), DATE_TIME_DISPLAY_FORMAT)}</span>
          </div>
        ),
      },
      ...(!normalizedBranchId
        ? ([
            {
              accessorKey: "sourceBranchName",
              header: "Sucursal",
              cell: ({ row }) => (
                <div className="flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5 text-zinc-500" />
                  <Badge variant="secondary" className="rounded-full">{row.original.sourceBranchName ?? "—"}</Badge>
                </div>
              ),
            } as ColumnDef<InventoryMovementSummaryResponse>,
          ] as ColumnDef<InventoryMovementSummaryResponse>[])
        : []),
      {
        accessorKey: "supplierName",
        header: "Proveedor",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Truck className="h-3.5 w-3.5 text-zinc-500" />
            <span className="truncate">{row.original.supplierName ?? "—"}</span>
          </div>
        ),
      },
      {
        accessorKey: "employeeName",
        header: "Registrado por",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <UserRound className="h-3.5 w-3.5 text-zinc-500" />
            <span className="truncate">{row.original.employeeName ?? "—"}</span>
          </div>
        ),
      },
      {
        accessorKey: "description",
        header: "Descripción",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-zinc-500" />
            <span className="truncate">{row.original.description ?? "—"}</span>
          </div>
        ),
      },
    ];
    return cols;
  }, [normalizedBranchId]);

  const actions = useMemo<Action<InventoryMovementSummaryResponse>[]>(() => [
    {
      label: "Ver detalle",
      type: "direct",
      icon: <Eye className="h-4 w-4" />,
      onClick: (row) => {
        redirect(`/dashboard/inventory/movements/purchase/${row.id}`);
      },
    },
  ], []);

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = filters.dateRange?.from ? format(filters.dateRange.from, "yyyy-MM-dd") : undefined;
      const endDate = filters.dateRange?.to ? format(filters.dateRange.to, "yyyy-MM-dd") : undefined;

      const response = await InventoryMovementService.listMovements({
        page: pageIndex,
        size: pageSize,
        branchId: normalizedBranchId,
        types: [InventoryMovementType.PURCHASE],
        startDate,
        endDate,
      });
      setPageData(response);
    } catch (error) {
      toast.error(getAaxiosErrorMessage(error) ?? "No se pudieron obtener las compras");
    } finally {
      setLoading(false);
    }
  }, [normalizedBranchId, filters, pageIndex, pageSize]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  return (
    <div className="flex h-full flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Compras de inventario</h1>
          <p className="text-sm text-muted-foreground">Gestiona y revisa las compras registradas en el inventario.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setPurchaseOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Registrar compra
          </Button>
        </div>
      </div>

      <PurchaseFiltersBar
        value={filters}
        onChange={(f) => {
          setFilters(f);
          setPageIndex(0);
        }}
        onReset={() => {
          setFilters({
            dateRange: { from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), to: new Date() },
          });
          setPageIndex(0);
        }}
        onRefresh={fetchPurchases}
      />

      <div className="flex-1">
        <DataTable<InventoryMovementSummaryResponse>
          pageData={pageData}
          columns={columns}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPageIndexChange={setPageIndex}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPageIndex(0);
          }}
          actions={actions}
          loading={loading}
          onRowClick={(row) => {
            redirect(`/dashboard/inventory/movements/purchase/${row.id}`);
          }}
        />
      </div>

      <PurchaseDialog
        open={purchaseOpen}
        onOpenChange={setPurchaseOpen}
        branchOptions={userInfo?.selectedBranch ? [userInfo.selectedBranch] : []}
        defaultBranchId={selectedBranchId}
        onCreated={() => {
          setPurchaseOpen(false);
          fetchPurchases();
        }}
      />
    </div>
  );
}
