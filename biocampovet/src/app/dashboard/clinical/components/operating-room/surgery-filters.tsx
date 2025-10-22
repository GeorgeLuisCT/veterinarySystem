"use client";

import * as React from "react";
import { Calendar as CalendarIcon, Filter, RefreshCcw } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { SurgicalReportStatus } from "../../enums/surgical-report-status";

export type SurgeryFilters = {
  status: "ALL" | "WAITING" | SurgicalReportStatus;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
};

interface Props {
  value: SurgeryFilters;
  onChange: (next: SurgeryFilters) => void;
}

const STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "Todos" },
  { value: "WAITING", label: "Sala de Espera (Recepción Quirúrgica)" },
  { value: SurgicalReportStatus.DRAFT, label: "Borradores" },
  { value: SurgicalReportStatus.IN_PROGRESS, label: "En curso" },
  { value: SurgicalReportStatus.READY_TO_BILL, label: "Listo para Facturar" },
] as const;

export default function SurgeryFilters({ value, onChange }: Props) {
  const today = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  React.useEffect(() => {
    const hasDates = value.startDate != null && value.endDate != null;
    if (!hasDates) onChange({ ...value, startDate: today, endDate: today });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasAnyFilter = value.status !== "ALL" || !!value.startDate || !!value.endDate;

  const dateRange: DateRange | undefined = React.useMemo(() => {
    const from =
      value.startDate instanceof Date
        ? value.startDate
        : value.startDate
        ? new Date(value.startDate)
        : undefined;

    const to =
      value.endDate instanceof Date
        ? value.endDate
        : value.endDate
        ? new Date(value.endDate)
        : undefined;

    if (!from && !to) return undefined;
    return { from: from ?? (to as Date), to: to ?? from };
  }, [value.startDate, value.endDate]);

  const dateLabel = React.useMemo(() => {
    if (dateRange?.from && dateRange?.to) return `${format(dateRange.from, "yyyy-MM-dd")} — ${format(dateRange.to, "yyyy-MM-dd")}`;
    if (dateRange?.from) return `${format(dateRange.from, "yyyy-MM-dd")} — …`;
    return "Rango de fechas";
  }, [dateRange]);

  return (
    <div className="w-full rounded-2xl border bg-background/80 p-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          Filtros
          {hasAnyFilter && <Badge className="ml-1">Activos</Badge>}
        </div>

        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Select
            value={String(value.status)}
            onValueChange={(val) => onChange({ ...value, status: val as SurgeryFilters["status"] })}
          >
            <SelectTrigger className="w-72">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <SelectItem key={String(opt.value)} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-56 justify-start gap-2">
                <CalendarIcon className="h-4 w-4" />
                <span className="truncate">{dateLabel}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="start">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(next) => {
                  const from = next?.from ?? today;
                  const to = next?.to ?? from;
                  onChange({ ...value, startDate: from, endDate: to });
                }}
                numberOfMonths={2}
                defaultMonth={dateRange?.from ?? today}
                disabled={{ after: today }}
                initialFocus
              />
              <div className="mt-2 flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange({ ...value, startDate: today, endDate: today })}
                >
                  Hoy
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="gap-2"
            onClick={() =>
              onChange({
                status: "ALL",
                startDate: today,
                endDate: today,
              })
            }
          >
            <RefreshCcw className="h-4 w-4" />
            Restablecer
          </Button>
        </div>
      </div>
    </div>
  );
}
