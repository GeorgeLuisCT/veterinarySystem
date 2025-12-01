"use client";

import { format } from "date-fns";
import { CalendarIcon, Loader2, RefreshCw, RotateCcw } from "lucide-react";
import { useMemo } from "react";
import type { DateRange } from "react-day-picker";

import { BranchResponse } from "@/app/dashboard/branche/types/branch-response";
import { MultiSelect } from "@/components/multi-select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ReportsFiltersState } from "@/types/reporting";

type ReportsFilterCardProps = {
  filters: ReportsFiltersState;
  onFiltersChange: (next: ReportsFiltersState) => void;
  onRefresh: () => void;
  onReset: () => void;
  loading?: boolean;
  branches: BranchResponse[];
};

const STATUS_OPTIONS = [
  { label: "Completado", value: "COMPLETED" },
  { label: "Borrador", value: "DRAFT" },
  { label: "Pendiente", value: "PENDING" },
  { label: "En progreso", value: "IN_PROGRESS" },
  { label: "Cancelado", value: "CANCELED" },
  { label: "Anulado", value: "VOIDED" },
  { label: "Listo para facturar", value: "READY_TO_BILL" },
];

export function ReportsFilterCard({
  filters,
  onFiltersChange,
  onRefresh,
  onReset,
  loading,
  branches,
}: ReportsFilterCardProps) {
  const rangeLabel = useMemo(() => {
    if (!filters.dateRange?.from || !filters.dateRange?.to) return "Seleccionar rango";
    return `${format(filters.dateRange.from, "dd MMM")} - ${format(filters.dateRange.to, "dd MMM, yyyy")}`;
  }, [filters.dateRange]);

  const branchOptions = useMemo(
    () => branches.map((branch) => ({ label: branch.name, value: branch.id })),
    [branches],
  );

  const handleDateChange = (range: DateRange | undefined) => {
    onFiltersChange({
      ...filters,
      dateRange: range,
    });
  };

  return (
    <Card className="shadow-none border border-border">
      <CardContent className="flex flex-row gap-4">
        <div className="w-[70%] grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-2">
            <Label>Sucursales</Label>
            <MultiSelect
              options={branchOptions}
              selected={filters.branchIds}
              onChange={(next) =>
                onFiltersChange({
                  ...filters,
                  branchIds: next as number[],
                })
              }
              placeholder="Todas las sucursales"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Estados</Label>
            <MultiSelect
              options={STATUS_OPTIONS}
              selected={filters.statuses}
              onChange={(next) =>
                onFiltersChange({
                  ...filters,
                  statuses: next as string[],
                })
              }
              placeholder="Todos los estados"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Rango de fechas</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !filters.dateRange && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {rangeLabel}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  initialFocus
                  selected={filters.dateRange}
                  onSelect={handleDateChange}
                  defaultMonth={filters.dateRange?.from}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="w-[30%] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button
            variant="ghost"
            onClick={onReset}
            disabled={loading}
            size="icon"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button onClick={onRefresh} disabled={loading} size="icon">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}