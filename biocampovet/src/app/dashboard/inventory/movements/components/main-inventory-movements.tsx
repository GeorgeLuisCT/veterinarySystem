"use client";

import { useEffect, useMemo, useState } from "react";
import { format, addWeeks, subWeeks } from "date-fns";
import { es } from "date-fns/locale";
import { Eye, ArrowLeft, Calendar as CalendarIcon, XCircle } from "lucide-react";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import { InventoryMovementSummaryResponse } from "../types/inventory-movement-summary-response";
import DataTable, { Action } from "@/components/data-table";
import InventoryMovementService from "../service/inventory-movement-service";
import InventoryMovementDetail from "./inventory-movement-detail";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { InventoryMovementType } from "../enums/inventory-movement-type";
import { getAaxiosErrorMessage } from "@/helpers/error";

type Props = {
  branchId: number;
  types: InventoryMovementType[];
};

export default function MainInventoryMovements({ branchId, types }: Props) {
  const defaultRange: DateRange = {
    from: subWeeks(new Date(), 1),
    to: addWeeks(new Date(), 1),
  };

  const [movements, setMovements] = useState<InventoryMovementSummaryResponse[]>([]);
  const [selectedMovement, setSelectedMovement] = useState<InventoryMovementSummaryResponse | null>(
    null
  );
  const [mode, setMode] = useState<"list" | "detail">("list");
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(defaultRange);

  const movementColumns: ColumnDef<InventoryMovementSummaryResponse>[] = useMemo(
    () => [
      { accessorKey: "id", header: "ID" },
      { accessorKey: "type", header: "Tipo" },
      { accessorKey: "sourceBranch", header: "Origen" },
      { accessorKey: "targetBranch", header: "Destino" },
      { accessorKey: "supplierName", header: "Proveedor" },
      {
        accessorKey: "date",
        header: "Fecha",
        cell: ({ row }) => format(new Date(row.original.date), "dd/MM/yyyy HH:mm"),
      },
      {
        accessorKey: "productCount",
        header: "Productos",
      },
      {
        accessorKey: "totalCost",
        header: "Costo Total",
        cell: ({ row }) =>
          row.original.totalCost ? `S/ ${Number(row.original.totalCost).toFixed(2)}` : "-",
      },
    ],
    []
  );

  const movementActions: Action<InventoryMovementSummaryResponse>[] = [
    {
      label: "Ver",
      type: "direct",
      icon: <Eye className="w-4 h-4" />,
      onClick: (row) => {
        setSelectedMovement(row);
        setMode("detail");
      },
    },
  ];

  const fetchMovements = async (page: number = 0, size: number = 10) => {
    setLoading(true);
    try {
      const response = await InventoryMovementService.getMovementsByTypes({
        page,
        size,
        startDate: dateRange?.from?.toISOString(),
        endDate: dateRange?.to?.toISOString(),
        types,
      });
      setMovements(response.content);
      setTotalPages(response.totalPages);
    } catch (error: unknown) {
      const message = getAaxiosErrorMessage(error) || "Error al cargar movimientos";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mode === "list") {
      fetchMovements(0, 10);
    }
  }, [branchId, mode, dateRange, types]);

  return (
    <div className="h-full space-y-4">
      {mode === "list" && (
        <DataTable<InventoryMovementSummaryResponse>
          data={movements}
          columns={movementColumns}
          actions={movementActions}
          fetchData={fetchMovements}
          totalPages={totalPages}
          loading={loading}
          headerSlotLeft={
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[300px] justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        `${format(dateRange.from, "PPP", { locale: es })} - ${format(dateRange.to, "PPP", { locale: es })}`
                      ) : (
                        format(dateRange.from, "PPP", { locale: es })
                      )
                    ) : (
                      <span>Filtrar por rango de fechas</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="min-w-[600px] p-4">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
              {dateRange?.from && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDateRange(undefined)}
                  title="Limpiar filtro de fechas"
                >
                  <XCircle className="w-5 h-5 text-muted-foreground hover:text-red-500" />
                </Button>
              )}
            </div>
          }
        />
      )}

      {mode === "detail" && selectedMovement && (
        <div className="space-y-4">
          <button
            onClick={() => setMode("list")}
            className="flex items-center text-sm text-blue-600 hover:underline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al listado
          </button>
          <InventoryMovementDetail movementId={selectedMovement.id} />
        </div>
      )}
    </div>
  );
}
