"use client";

import * as React from "react";
import { AlertTriangle, Calendar as CalendarIcon, Filter, RefreshCcw } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import { AttentionType, AttentionTypeOptions } from "@/app/dashboard/schedule/enums/attention-type";
import { AttentionStatusDetails } from "@/app/dashboard/schedule/enums/attention-status";

type Filters = {
  type: AttentionType | "ALL";
  status: string | "ALL";
  emergency: boolean | "ALL";
  startDate?: string | Date | null;
  endDate?: string | Date | null;
};

interface AttentionFiltersProps {
  value: Filters;
  onChange: (next: Filters) => void;
}

export default function AttentionFilters({ value, onChange }: AttentionFiltersProps) {
  const statusOptions = React.useMemo(
    () => Object.entries(AttentionStatusDetails).map(([key, v]) => ({ value: key, label: v.label })),
    []
  );

  const today = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  React.useEffect(() => {
    const hasDates =
      value.startDate !== undefined &&
      value.startDate !== null &&
      value.endDate !== undefined &&
      value.endDate !== null;
    if (!hasDates) {
      onChange({ ...value, startDate: today, endDate: today });
    }
  }, []);

  const hasAnyFilter =
    value.type !== "ALL" ||
    value.status !== "ALL" ||
    value.emergency === true ||
    !!value.startDate ||
    !!value.endDate;

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

    return {
      from: from ?? (to as Date),
      to: to ?? from,
    };
  }, [value.startDate, value.endDate]);

  const dateLabel = React.useMemo(() => {
    if (dateRange?.from && dateRange?.to) return `${format(dateRange.from, "yyyy-MM-dd")} — ${format(dateRange.to, "yyyy-MM-dd")}`;
    if (dateRange?.from) return `${format(dateRange.from, "yyyy-MM-dd")} — …`;
    return "Rango de fechas";
  }, [dateRange]);

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          Filtros
          {hasAnyFilter && <Badge className="ml-1">Activos</Badge>}
        </div>

        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Select
            value={String(value.type)}
            onValueChange={(val) => onChange({ ...value, type: val as AttentionType | "ALL" })}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Tipo de atención" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los tipos</SelectItem>
              {AttentionTypeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={String(value.status)}
            onValueChange={(val) => onChange({ ...value, status: val })}
          >
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los estados</SelectItem>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
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
                  if (!next) {
                    onChange({ ...value, startDate: today, endDate: today });
                    return;
                  }
                  const from = next.from ?? today;
                  const to = next.to ?? from;
                  onChange({
                    ...value,
                    startDate: from,
                    endDate: to,
                  });
                }}
                numberOfMonths={2}
                defaultMonth={dateRange?.from ?? today}
                disabled={{ after: today }}
                initialFocus
              />
              <div className="mt-2 flex items-center justify-between gap-2">
                <Badge variant="outline" className="text-[10px]">No se permiten fechas futuras</Badge>
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

          <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm">Emergencias</span>
            <Switch
              checked={value.emergency === true}
              onCheckedChange={(checked) =>
                onChange({ ...value, emergency: checked ? true : "ALL" })
              }
              aria-label="Filtrar emergencias"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="gap-2"
            onClick={() =>
              onChange({
                type: "ALL",
                status: "ALL",
                emergency: "ALL",
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
