"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";
import {
  Eye,
  PlusCircle,
  CalendarDays,
  Tag,
  Building2,
  ArrowRight,
  UserRound,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DataTable, { Action } from "@/components/data-table";
import { toast } from "sonner";
import type { PaginatedResponse } from "@/types/paginated-response";
import { getAaxiosErrorMessage } from "@/helpers/error";
import InventoryMovementService from "../_service/inventory-movement-service";
import type { InventoryMovementSummaryResponse } from "../_types/inventory-movement-summary-response";
import { useUser } from "@/context/user-context";
import { TransferDialog } from "./movements/transfer-dialog";
import { AdjustmentDialog } from "./movements/adjustment-dialog";
import MovementFiltersBar, { MovementFilters } from "./movements/movement-filters";
import { InventoryMovementType } from "../_enums/inventory-movement-type";
import { redirect } from "next/navigation";

const DATE_TIME_DISPLAY_FORMAT = "dd/MM/yyyy HH:mm";
const toBackendDate = (date?: Date) => (date ? format(date, "yyyy-MM-dd") : undefined);

const typeBadgeClass = (t?: string) => {
  switch (t) {
    case "TRANSFER":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "ADJUSTMENT":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-zinc-50 text-zinc-700 border-zinc-200";
  }
};

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
  const [transferOpen, setTransferOpen] = useState(false);
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);

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
            <span className="truncate">
              {format(new Date(row.original.date), DATE_TIME_DISPLAY_FORMAT)}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: "Tipo",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Tag className="h-3.5 w-3.5 text-zinc-500" />
            <Badge
              variant="outline"
              className={`font-medium rounded-full border ${typeBadgeClass(row.original.type)}`}
            >
              {row.original.type === "TRANSFER"
                ? "Transferencia"
                : row.original.type === "ADJUSTMENT"
                  ? "Ajuste"
                  : row.original.type ?? "—"}
            </Badge>
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
                <Building2 className="h-3.5 w-3.5 text-zinc-500" />
                <Badge variant="secondary" className="rounded-full">
                  {row.original.sourceBranchName ?? "—"}
                </Badge>
              </div>
            ),
          } as ColumnDef<InventoryMovementSummaryResponse>,
        ] as ColumnDef<InventoryMovementSummaryResponse>[])
        : []),
      {
        accessorKey: "flow",
        header: "Flujo",
        cell: ({ row }) => (
          <div className="flex items-center gap-2 min-w-[220px]">
            <span className="truncate text-sm">{row.original.sourceBranchName ?? "—"}</span>
            <ArrowRight className="h-3.5 w-3.5 text-zinc-500" />
            <span className="truncate text-sm">{row.original.targetBranchName ?? "—"}</span>
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
          <div className="flex items-center gap-2 max-w-[420px]">
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
        redirect(`/dashboard/inventory/movements/${row.id}`);
      },
    },
  ], []);

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = filters.dateRange?.from ? toBackendDate(filters.dateRange.from) : undefined;
      const endDate = filters.dateRange?.to ? toBackendDate(filters.dateRange.to) : undefined;

      const types =
        filters.typeUi === "ALL"
          ? [InventoryMovementType.TRANSFER, InventoryMovementType.ADJUSTMENT]
          : [filters.typeUi as InventoryMovementType];

      const response = await InventoryMovementService.listMovements({
        page: pageIndex,
        size: pageSize,
        branchId: normalizedBranchId,
        types,
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
          <p className="text-sm text-muted-foreground">
            Gestiona y revisa los movimientos registrados en el inventario.
          </p>
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
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPageIndex(0);
          }}
          actions={actions}
          loading={loading}
          onRowClick={(row) => {
            redirect(`/dashboard/inventory/movements/${row.id}`);
          }}
        />
      </div>

      <TransferDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        onCreated={() => fetchMovements()}
      />

      <AdjustmentDialog
        open={adjustmentOpen}
        onOpenChange={setAdjustmentOpen}
        defaultBranchId={selectedBranchId}
        onCreated={() => fetchMovements()}
      />
    </div>
  );
}
