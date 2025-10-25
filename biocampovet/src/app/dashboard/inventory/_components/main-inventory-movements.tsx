"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { ColumnDef } from "@tanstack/react-table";
import {
  Calendar as CalendarIcon,
  Eye,
  FileText,
  History,
  PlusCircle,
  RefreshCcw,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DataTable, { Action } from "@/components/data-table";
import { toast } from "sonner";

import type { PaginatedResponse } from "@/types/paginated-response";
import { getAaxiosErrorMessage } from "@/helpers/error";
import InventoryMovementService from "../_service/inventory-movement-service";
import type { InventoryMovementSummaryResponse } from "../_types/inventory-movement-summary-response";
import { InventoryMovementType, InventoryMovementTypeLabels } from "../_enums/inventory-movement-type";
import { BranchService } from "@/app/dashboard/branche/services/branch-service";
import type { BranchResponse } from "@/app/dashboard/branche/types/branch-response";
import InventoryMovementDetail from "./inventory-movement-detail";
import { PurchaseDialog } from "./movements/purchase-dialog";
import { TransferDialog } from "./movements/transfer-dialog";
import { AdjustmentDialog } from "./movements/adjustment-dialog";
import { KardexSection } from "./movements/kardex-section";

const DATE_DISPLAY_FORMAT = "dd/MM/yyyy";
const DATE_TIME_DISPLAY_FORMAT = "dd/MM/yyyy HH:mm";

const defaultDateRange: DateRange = {
  from: subDays(new Date(), 30),
  to: new Date(),
};

type MainInventoryMovementsProps = {
  branchId?: number;
  context?: "MOVEMENTS" | "PURCHASES";
};

const formatDateRangeLabel = (range?: DateRange) => {
  if (!range?.from) return "Rango de fechas";
  if (!range.to) return format(range.from, DATE_DISPLAY_FORMAT, { locale: es });
  return `${format(range.from, DATE_DISPLAY_FORMAT, { locale: es })} - ${format(range.to, DATE_DISPLAY_FORMAT, {
    locale: es,
  })}`;
};

const toBackendDate = (date?: Date) => (date ? format(date, "yyyy-MM-dd") : undefined);

export default function MainInventoryMovements({ branchId, context = "MOVEMENTS" }: MainInventoryMovementsProps) {
  const [activeTab, setActiveTab] = useState<"movements" | "kardex">("movements");
  const [pageData, setPageData] = useState<PaginatedResponse<InventoryMovementSummaryResponse> | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(defaultDateRange);
  const [branchOptions, setBranchOptions] = useState<BranchResponse[]>([]);
  const [branchFilter, setBranchFilter] = useState<number | undefined>(branchId);
  const [typeFilter, setTypeFilter] = useState<InventoryMovementType | "ALL">(
    context === "PURCHASES" ? InventoryMovementType.PURCHASE : "ALL"
  );
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [detailMovementId, setDetailMovementId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);

  useEffect(() => {
    BranchService.getBranchesByLoggedEmployee()
      .then(setBranchOptions)
      .catch((error) => {
        console.error(error);
        toast.error("No se pudieron cargar las sucursales");
      });
  }, []);

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
            {InventoryMovementTypeLabels[row.original.type] ?? row.original.type}
          </Badge>
        ),
      },
    ];

    if (context === "PURCHASES") {
      base.push(
        { accessorKey: "sourceBranchName", header: "Sucursal", cell: ({ row }) => row.original.sourceBranchName ?? "-" },
        { accessorKey: "supplierName", header: "Proveedor", cell: ({ row }) => row.original.supplierName ?? "-" }
      );
    } else {
      base.push(
        { accessorKey: "sourceBranchName", header: "Origen", cell: ({ row }) => row.original.sourceBranchName ?? "-" },
        { accessorKey: "targetBranchName", header: "Destino", cell: ({ row }) => row.original.targetBranchName ?? "-" }
      );
    }

    base.push(
      { accessorKey: "employeeName", header: "Registrado por", cell: ({ row }) => row.original.employeeName ?? "-" },
      { accessorKey: "description", header: "Descripción", cell: ({ row }) => row.original.description ?? "-" }
    );

    return base;
  }, [context]);

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
      const startDate = dateRange?.from ? toBackendDate(dateRange.from) : undefined;
      const endDate = dateRange?.to ? toBackendDate(dateRange.to) : undefined;
      const typeParam =
        context === "PURCHASES"
          ? InventoryMovementType.PURCHASE
          : typeFilter === "ALL"
          ? undefined
          : typeFilter;

      const response = await InventoryMovementService.listMovements({
        page: pageIndex,
        size: pageSize,
        branchId: branchFilter,
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
  }, [branchFilter, context, dateRange?.from, dateRange?.to, pageIndex, pageSize, typeFilter]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements, refreshCounter]);

  useEffect(() => {
    setPageIndex(0);
  }, [branchFilter, typeFilter, dateRange?.from?.getTime(), dateRange?.to?.getTime(), context]);

  const handleRefresh = () => setRefreshCounter((prev) => prev + 1);

  return (
    <div className="flex h-full flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {context === "PURCHASES" ? "Compras de inventario" : "Movimientos de inventario"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestiona y revisa los movimientos registrados en el inventario.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {context === "MOVEMENTS" ? (
            <>
              <Button onClick={() => setTransferOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nueva transferencia
              </Button>
              <Button variant="secondary" onClick={() => setAdjustmentOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nuevo ajuste
              </Button>
            </>
          ) : (
            <Button onClick={() => setPurchaseOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Registrar compra
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="flex h-full flex-col">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="movements" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Movimientos
          </TabsTrigger>
          <TabsTrigger value="kardex" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Kardex
          </TabsTrigger>
        </TabsList>

        <TabsContent value="movements" className="flex-1">
          <DataTable
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
            headerSlotLeft={
              <div className="flex flex-wrap items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formatDateRangeLabel(dateRange)}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" align="start">
                    <Calendar
                      mode="range"
                      locale={es}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {dateRange && (
                  <Button variant="ghost" size="icon" onClick={() => setDateRange(undefined)}>
                    <XCircle className="h-4 w-4" />
                  </Button>
                )}
                <Select
                  value={branchFilter ? String(branchFilter) : "ALL"}
                  onValueChange={(value) => setBranchFilter(value === "ALL" ? undefined : Number(value))}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sucursales" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todas las sucursales</SelectItem>
                    {branchOptions.map((branch) => (
                      <SelectItem key={branch.id} value={String(branch.id)}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {context === "MOVEMENTS" && (
                  <Select
                    value={typeFilter === "ALL" ? "ALL" : typeFilter}
                    onValueChange={(value) =>
                      setTypeFilter(value === "ALL" ? "ALL" : (value as InventoryMovementType))
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todos los tipos</SelectItem>
                      <SelectItem value={InventoryMovementType.TRANSFER}>
                        {InventoryMovementTypeLabels[InventoryMovementType.TRANSFER]}
                      </SelectItem>
                      <SelectItem value={InventoryMovementType.ADJUSTMENT}>
                        {InventoryMovementTypeLabels[InventoryMovementType.ADJUSTMENT]}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            }
            headerSlotRight={
              <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={loading}>
                <RefreshCcw className="h-4 w-4" />
              </Button>
            }
            onRowClick={(row) => {
              setDetailMovementId(row.id);
              setDetailOpen(true);
            }}
          />
        </TabsContent>

        <TabsContent value="kardex" className="flex-1">
          <KardexSection branchOptions={branchOptions} defaultBranchId={branchId} />
        </TabsContent>
      </Tabs>

      <PurchaseDialog
        open={purchaseOpen}
        onOpenChange={setPurchaseOpen}
        branchOptions={branchOptions}
        defaultBranchId={branchId}
        onCreated={() => {
          handleRefresh();
          setActiveTab("movements");
        }}
      />

      <TransferDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        branchOptions={branchOptions}
        onCreated={() => {
          handleRefresh();
          setActiveTab("movements");
        }}
      />

      <AdjustmentDialog
        open={adjustmentOpen}
        onOpenChange={setAdjustmentOpen}
        branchOptions={branchOptions}
        defaultBranchId={branchId}
        onCreated={() => {
          handleRefresh();
          setActiveTab("movements");
        }}
      />

      <DialogDetail
        open={detailOpen}
        onOpenChange={(value) => {
          setDetailOpen(value);
          if (!value) setDetailMovementId(null);
        }}
        movementId={detailMovementId}
      />
    </div>
  );
}

type DialogDetailProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movementId: number | null;
};

function DialogDetail({ open, onOpenChange, movementId }: DialogDetailProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detalle del movimiento</DialogTitle>
        </DialogHeader>
        {movementId && <InventoryMovementDetail movementId={movementId} />}
      </DialogContent>
    </Dialog>
  );
}
