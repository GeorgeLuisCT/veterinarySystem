"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";
import { Eye, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DataTable, { Action } from "@/components/data-table";
import { toast } from "sonner";
import type { PaginatedResponse } from "@/types/paginated-response";
import { getAaxiosErrorMessage } from "@/helpers/error";
import InventoryMovementService from "../_service/inventory-movement-service";
import type { InventoryMovementSummaryResponse } from "../_types/inventory-movement-summary-response";
import { useUser } from "@/context/user-context";
import InventoryMovementDetail from "./inventory-movement-detail";
import { TransferDialog } from "./movements/transfer-dialog";
import { AdjustmentDialog } from "./movements/adjustment-dialog";
import MovementFiltersBar, { MovementFilters } from "./movements/movement-filters";
import { InventoryMovementType } from "../_enums/inventory-movement-type";

const DATE_TIME_DISPLAY_FORMAT = "dd/MM/yyyy HH:mm";

const toBackendDate = (date?: Date) => (date ? format(date, "yyyy-MM-dd") : undefined);

export default function MainInventoryMovements() {
  const { userInfo } = useUser();
  const selectedBranchId = userInfo?.selectedBranch?.id;
  const normalizedBranchId = selectedBranchId && selectedBranchId !== 0 ? selectedBranchId : undefined;

  const [pageData, setPageData] = useState<PaginatedResponse<InventoryMovementSummaryResponse> | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState<MovementFilters>({
    dateRange: { from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), to: new Date() },
    typeUi: "ALL",
  });

  const [detailMovementId, setDetailMovementId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);

  useEffect(() => {
    setPageIndex(0);
  }, [normalizedBranchId, JSON.stringify(filters)]);

  const columns = useMemo<ColumnDef<InventoryMovementSummaryResponse>[]>(() => {
    const base: ColumnDef<InventoryMovementSummaryResponse>[] = [
      {
        accessorKey: "date",
        header: "Fecha",
        cell: ({ row }) => format(new Date(row.original.date), DATE_TIME_DISPLAY_FORMAT),
      },
      {
        accessorKey: "type",
        header: "Tipo",
        cell: ({ row }) => (
          <Badge variant="outline" className="font-medium">
            {row.original.type === "PURCHASE"
              ? "Compra"
              : row.original.type === "TRANSFER"
              ? "Transferencia"
              : row.original.type === "ADJUSTMENT"
              ? "Ajuste"
              : row.original.type}
          </Badge>
        ),
      },
      { accessorKey: "sourceBranchName", header: "Origen", cell: ({ row }) => row.original.sourceBranchName ?? "-" },
      { accessorKey: "targetBranchName", header: "Destino", cell: ({ row }) => row.original.targetBranchName ?? "-" },
      { accessorKey: "employeeName", header: "Registrado por", cell: ({ row }) => row.original.employeeName ?? "-" },
      { accessorKey: "description", header: "Descripción", cell: ({ row }) => row.original.description ?? "-" },
    ];
    return base;
  }, []);

  const actions = useMemo<Action<InventoryMovementSummaryResponse>[]>(() => [
    {
      label: "Ver detalle",
      type: "direct",
      icon: <Eye className="h-4 w-4" />,
      onClick: (row) => {
        setDetailMovementId(row.id);
        setDetailOpen(true);
      },
    },
  ], []);

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = filters.dateRange?.from ? toBackendDate(filters.dateRange.from) : undefined;
      const endDate = filters.dateRange?.to ? toBackendDate(filters.dateRange.to) : undefined;

      const typeParam =
        filters.typeUi === "ALL" ? undefined : (filters.typeUi as InventoryMovementType);

      const response = await InventoryMovementService.listMovements({
        page: pageIndex,
        size: pageSize,
        branchId: normalizedBranchId,
        type: typeParam,
        startDate,
        endDate,
      });
      setPageData(response);
    } catch (error) {
      toast.error(getAaxiosErrorMessage(error) ?? "No se pudieron obtener los movimientos");
    } finally {
      setLoading(false);
    }
  }, [normalizedBranchId, filters, pageIndex, pageSize]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  return (
    <div className="flex h-full flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Movimientos de inventario</h1>
          <p className="text-sm text-muted-foreground">Gestiona y revisa los movimientos registrados en el inventario.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setTransferOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nueva transferencia
          </Button>
          <Button variant="secondary" onClick={() => setAdjustmentOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuevo ajuste
          </Button>
        </div>
      </div>

      <MovementFiltersBar
        value={filters}
        onChange={(f) => {
          setFilters(f);
          setPageIndex(0);
        }}
        onReset={() => {
          setFilters({
            dateRange: { from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), to: new Date() },
            typeUi: "ALL",
          });
          setPageIndex(0);
        }}
        onRefresh={() => fetchMovements()}
      />

      <div className="flex-1">
        <DataTable<InventoryMovementSummaryResponse>
          pageData={pageData}
          columns={columns}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPageIndexChange={setPageIndex}
          onPageSizeChange={(size) => { setPageSize(size); setPageIndex(0); }}
          actions={actions}
          loading={loading}
          onRowClick={(row) => {
            setDetailMovementId(row.id);
            setDetailOpen(true);
          }}
        />
      </div>

      <TransferDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        branchOptions={userInfo?.selectedBranch ? [userInfo.selectedBranch] : []}
        onCreated={() => fetchMovements()}
      />

      <AdjustmentDialog
        open={adjustmentOpen}
        onOpenChange={setAdjustmentOpen}
        branchOptions={userInfo?.selectedBranch ? [userInfo.selectedBranch] : []}
        defaultBranchId={selectedBranchId}
        onCreated={() => fetchMovements()}
      />

      <Dialog open={detailOpen} onOpenChange={(v) => { setDetailOpen(v); if (!v) setDetailMovementId(null); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalle del movimiento</DialogTitle>
          </DialogHeader>
          {detailMovementId && <InventoryMovementDetail movementId={detailMovementId} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
