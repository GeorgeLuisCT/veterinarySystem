"use client";

import { useEffect, useState, useMemo } from "react";
import DataTable, { Action } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Eye, ArrowLeft, Calendar as CalendarIcon, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format, subWeeks, addWeeks } from "date-fns";
import { es } from "date-fns/locale";
import { DateRange } from "react-day-picker";

import { CashboxSummaryResponse } from "../types/cashbox-summary-response";
import { useUser } from "@/context/user-context";
import CashBoxService from "../service/cashbox-service";

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CashboxDetails } from "../components/cashbox-details";
import { getAaxiosErrorMessage } from "@/helpers/error";

export default function MainCashBoxHistory() {
  const { userInfo } = useUser();
  const branchId = userInfo?.selectedBranch?.id ?? 0;

  const [summaries, setSummaries] = useState<CashboxSummaryResponse[]>([]);
  const [selectedCashboxId, setSelectedCashboxId] = useState<number | null>(null);
  const [mode, setMode] = useState<"list" | "detail">("list");
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  const defaultRange: DateRange = {
    from: subWeeks(new Date(), 1),
    to: addWeeks(new Date(), 1),
  };

  const [dateRange, setDateRange] = useState<DateRange | undefined>(defaultRange);

  const columns: ColumnDef<CashboxSummaryResponse>[] = useMemo(
    () => [
      { accessorKey: "id", header: "ID" },
      { accessorKey: "branchName", header: "Sucursal" },
      { accessorKey: "openedByName", header: "Abierta Por" },
      {
        accessorKey: "openedAt",
        header: "Fecha Apertura",
        cell: ({ row }) => format(new Date(row.original.openedAt), "dd/MM/yyyy HH:mm"),
      },
      {
        accessorKey: "closedAt",
        header: "Fecha Cierre",
        cell: ({ row }) =>
          row.original.closedAt ? format(new Date(row.original.closedAt), "dd/MM/yyyy HH:mm") : "—",
      },
      { accessorKey: "status", header: "Estado" },
      {
        accessorKey: "totalIncome",
        header: "Total Ingresos",
        cell: ({ row }) => `S/ ${row.original.totalIncome.toFixed(2)}`,
      },
      {
        accessorKey: "totalExpense",
        header: "Total Egresos",
        cell: ({ row }) => `S/ ${row.original.totalExpense.toFixed(2)}`,
      },
      {
        accessorKey: "physicalAmount",
        header: "Monto Físico",
        cell: ({ row }) => `S/ ${row.original.physicalAmount.toFixed(2)}`,
      },
    ],
    []
  );

  const actions: Action<CashboxSummaryResponse>[] = [
    {
      label: "Ver",
      type: "direct",
      icon: <Eye className="w-4 h-4" />,
      onClick: (row) => {
        setSelectedCashboxId(row.id);
        setMode("detail");
      },
    },
  ];

  const fetchSummaries = async (page: number = 0, size: number = 10) => {
    if (!dateRange?.from || !dateRange?.to) {
      toast.error("Debe seleccionar un rango de fechas válido");
      return;
    }

    setLoading(true);
    try {
      const response = await CashBoxService.getCashBoxSummaries({
        page,
        size,
        branchId: branchId === 0 ? undefined : branchId,
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
      });
      setSummaries(response.content);
      setTotalPages(response.totalPages);
    } catch (error: unknown) {
      const message = getAaxiosErrorMessage(error) || "Error al cargar historial de cajas";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mode === "list") {
      fetchSummaries(0, 10);
      setSelectedCashboxId(null);
    }
  }, [branchId, mode, dateRange]);

  return (
    <div className="h-full">
      {mode === "list" && (
        <DataTable<CashboxSummaryResponse>
          data={summaries}
          columns={columns}
          actions={actions}
          fetchData={fetchSummaries}
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
                        `${format(dateRange.from, "PPP", { locale: es })} - ${format(
                          dateRange.to,
                          "PPP",
                          { locale: es }
                        )}`
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

      {mode === "detail" && selectedCashboxId !== null && (
        <div className="space-y-4">
          <button
            onClick={() => {
              setMode("list");
              setSelectedCashboxId(null);
            }}
            className="flex items-center text-sm text-blue-600 hover:underline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al listado
          </button>

          <CashboxDetails cashboxId={selectedCashboxId} />
        </div>
      )}
    </div>
  );
}
