"use client";

import * as React from "react";
import { Calendar as CalendarIcon, Filter, RefreshCcw, Search } from "lucide-react";
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
import { FieldVisitStatus } from "@/app/dashboard/fieldwork/enums/field-visit-status";
import { Input } from "@/components/ui/input";

export type VisitFilterValue = {
  status: FieldVisitStatus | "ALL";
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  q?: string;
};

interface VisitFiltersProps {
  value: VisitFilterValue;
  onChange: (next: VisitFilterValue) => void;
}

export default function VisitFilters({ value, onChange }: VisitFiltersProps) {
  const statusOptions = React.useMemo(
    () =>
      (Object.values(FieldVisitStatus) as FieldVisitStatus[]).map((s) => ({
        value: s,
        label: statusLabel(s),
      })),
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
    value.status !== "ALL" || !!value.startDate || !!value.endDate || !!value.q?.trim();

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

  // Debounce para el buscador
  const [debounceId, setDebounceId] = React.useState<number | null>(null);
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    if (debounceId) window.clearTimeout(debounceId);
    const id = window.setTimeout(() => onChange({ ...value, q }), 500);
    setDebounceId(id);
  };

  React.useEffect(() => {
    return () => {
      if (debounceId) window.clearTimeout(debounceId);
    };
  }, [debounceId]);

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          Filtros
          {hasAnyFilter && <Badge className="ml-1">Activos</Badge>}
        </div>

        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative w-64">
            <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Buscar por finca, zona u objetivo…"
              defaultValue={value.q ?? ""}
              onChange={handleSearchChange}
            />
          </div>

          <Select
            value={String(value.status)}
            onValueChange={(val) => onChange({ ...value, status: val as FieldVisitStatus | "ALL" })}
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
                  const t = new Date();
                  t.setHours(0, 0, 0, 0);
                  if (!next) {
                    onChange({ ...value, startDate: t, endDate: t });
                    return;
                  }
                  const from = next.from ?? t;
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
                  onClick={() =>
                    onChange({
                      ...value,
                      startDate: today,
                      endDate: today,
                    })
                  }
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
                q: "",
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

function statusLabel(s: FieldVisitStatus): string {
  switch (s) {
    case FieldVisitStatus.PLANNED:
      return "Planificada";
    case FieldVisitStatus.IN_PROGRESS:
      return "En progreso";
    case FieldVisitStatus.COMPLETED:
      return "Completada";
    case FieldVisitStatus.CANCELED:
      return "Cancelada";
    default:
      return String(s);
  }
}
