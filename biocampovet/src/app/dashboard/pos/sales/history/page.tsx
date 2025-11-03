"use client";

import { useEffect, useState, useMemo } from "react";
import DataTable, { Action } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Eye, ArrowLeft, Calendar as CalendarIcon, XCircle } from "lucide-react";
import { format, subWeeks, addWeeks } from "date-fns";
import { es } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";

import { SaleSummaryResponse } from "../types/sale-summary-response";
import { SaleDetail } from "../components/sale-detail";
import SaleService from "../service/sale-service";
import { SaleStatusLabels } from "../enums/sale-status";
import { getAaxiosErrorMessage } from "@/helpers/error";
import { useUser } from "@/context/user-context";

export default function HistorySalesPage() {
  const [sales, setSales] = useState<SaleSummaryResponse[]>([]);
  const [selectedSale, setSelectedSale] = useState<SaleSummaryResponse | null>(null);
  const [mode, setMode] = useState<"list" | "detail">("list");
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  const { userInfo } = useUser();
  const branchId = userInfo?.selectedBranch?.id ?? 0;

  const defaultRange: DateRange = {
    from: subWeeks(new Date(), 1),
    to: addWeeks(new Date(), 1),
  };

  const [dateRange, setDateRange] = useState<DateRange | undefined>(defaultRange);

  const columns: ColumnDef<SaleSummaryResponse>[] = useMemo(
    () => [
      { accessorKey: "id", header: "ID" },
      { accessorKey: "employeeFullName", header: "Empleado" },
      { accessorKey: "customerName", header: "Cliente" },
      {
        accessorKey: "saleDate",
        header: "Fecha",
        cell: ({ row }) => format(new Date(row.original.saleDate), "dd/MM/yyyy HH:mm"),
      },
      {
        accessorKey: "totalAmount",
        header: "Total",
        cell: ({ row }) => `S/ ${row.original.totalAmount.toFixed(2)}`,
      },
      {
        accessorKey: "totalPaid",
        header: "Pagado",
        cell: ({ row }) => `S/ ${row.original.totalPaid.toFixed(2)}`,
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => `${SaleStatusLabels[row.original.status]}`,
      },
    ],
    []
  );

  const actions: Action<SaleSummaryResponse>[] = [
    {
      label: "Ver",
      type: "direct",
      icon: <Eye className="w-4 h-4" />,
      onClick: (row) => {
        setSelectedSale(row);
        setMode("detail");
      },
    },
  ];

  const fetchSales = async (page: number = 0, size: number = 10) => {
    if (!dateRange?.from || !dateRange?.to) {
      toast.error("Debe seleccionar un rango de fechas válido");
      return;
    }

    setLoading(true);
    try {
      const response = await SaleService.getSalesSummary({
        page,
        size,
        branchId: branchId === 0 ? undefined : branchId,
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
      });
      setSales(response.content);
      setTotalPages(response.totalPages);
    } catch (error: unknown) {
      const message = getAaxiosErrorMessage(error) || "Error al cargar ventas";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mode === "list") {
      fetchSales(0, 10);
    }
  }, [branchId, dateRange, mode]);

  return (
    <div className="h-full p-4 space-y-4">
      {mode === "list" && (
        <DataTable<SaleSummaryResponse>
          data={sales}
          columns={columns}
          actions={actions}
          fetchData={fetchSales}
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

      {mode === "detail" && selectedSale && (
        <div className="space-y-4">
          <button
            onClick={() => {
              setMode("list");
              setSelectedSale(null);
            }}
            className="flex items-center text-sm text-blue-600 hover:underline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al listado
          </button>

          <SaleDetail saleId={selectedSale.id} />
        </div>
      )}
    </div>
  );
}
