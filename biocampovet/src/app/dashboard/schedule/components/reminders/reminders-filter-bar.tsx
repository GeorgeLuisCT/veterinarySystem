"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelMultiSelect } from "@/components/floating-label-multi-select";
import { Filter, RefreshCcw, Calendar as CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ReminderType, ReminderTypeOptions } from "../../enums/reminder-type";
import { ReminderStatus, ReminderStatusOptions } from "../../enums/reminder-status";

// NUEVOS IMPORTS PARA EL CALENDARIO DE RANGO
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export type FilterState = {
  query: string;
  types: ReminderType[];
  statuses: ReminderStatus[];
  dueFrom?: string; // Se mantiene como string (ej: "2025-11-04")
  dueTo?: string; // Se mantiene como string (ej: "2025-11-10")
  includeManual: boolean;
  includeAutomatic: boolean;
};

type Props = {
  value: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
  onRefresh: () => void;
};

// Helper para convertir el string del estado a un objeto Date para el calendario
const parseDate = (dateStr?: string): Date | undefined => {
  if (!dateStr) return undefined;
  try {
    const date = parseISO(dateStr); // Asume formato "yyyy-MM-dd"
    if (isNaN(date.getTime())) return undefined;
    return date;
  } catch (e) {
    return undefined;
  }
};

// Helper para convertir el objeto Date del calendario al string del estado
const toApiDate = (date?: Date): string | undefined => {
  if (!date) return undefined;
  return format(date, "yyyy-MM-dd");
};

export default function RemindersFilterBar({
  value,
  onChange,
  onReset,
  onRefresh,
}: Props) {
  const [state, setState] = React.useState<FilterState>(value);

  React.useEffect(() => {
    setState(value);
  }, [value]);

  const setField = <K extends keyof FilterState>(
    key: K,
    v: FilterState[K]
  ) => {
    const next = { ...state, [key]: v };
    setState(next);
    onChange(next);
  };

  const handleReset = () => {
    onReset();
  };

  const hasAnyFilter =
    state.query !== "" ||
    state.types.length > 0 ||
    state.statuses.length > 0 ||
    !!state.dueFrom ||
    !!state.dueTo ||
    state.includeManual === false ||
    state.includeAutomatic === false;

  // LÓGICA PARA EL CALENDARIO DE RANGO
  const dateRange: DateRange | undefined = React.useMemo(() => ({
    from: parseDate(state.dueFrom),
    to: parseDate(state.dueTo),
  }), [state.dueFrom, state.dueTo]);

  const dateLabel = React.useMemo(() => {
    if (dateRange?.from && dateRange?.to) {
      if (format(dateRange.from, "yyyy-MM-dd") === format(dateRange.to, "yyyy-MM-dd")) {
        return format(dateRange.from, "dd MMM, yyyy", { locale: es });
      }
      return `${format(dateRange.from, "dd MMM, yyyy", { locale: es })} - ${format(
        dateRange.to,
        "dd MMM, yyyy",
        { locale: es }
      )}`;
    }
    if (dateRange?.from) {
      return `${format(dateRange.from, "dd MMM, yyyy", { locale: es })} - ...`;
    }
    return "Rango de fechas";
  }, [dateRange]);

  const handleDateRangeSelect = (next: DateRange | undefined) => {
    const nextState = {
      ...state,
      dueFrom: toApiDate(next?.from),
      dueTo: toApiDate(next?.to),
    };
    setState(nextState);
    onChange(nextState);
  };

  return (
    <div className="w-full rounded-2xl border bg-background/80 p-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          Filtros
          {hasAnyFilter && <Badge className="ml-1">Activos</Badge>}
        </div>

        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="min-w-[240px] flex-1">
            <FloatingLabelInput
              id="search"
              label="Buscar por paciente, propietario..."
              value={state.query}
              onChange={(v) => setField("query", v)}
            />
          </div>

          <div className="min-w-[200px]">
            <FloatingLabelMultiSelect
              id="types"
              label="Tipos de recordatorio"
              options={ReminderTypeOptions.map((opt) => ({
                value: opt.value,
                label: opt.label,
              }))}
              selected={state.types}
              onChange={(v) => setField("types", v)}
            />
          </div>

          <div className="min-w-[200px]">
            <FloatingLabelMultiSelect
              id="statuses"
              label="Estado"
              options={ReminderStatusOptions.map((opt) => ({
                value: opt.value,
                label: opt.label,
              }))}
              selected={state.statuses}
              onChange={(v) => setField("statuses", v)}
            />
          </div>

          {/* COMPONENTE DE RANGO DE FECHA (IGUAL AL EJEMPLO) */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-60 justify-start gap-2">
                <CalendarIcon className="h-4 w-4" />
                <span className="truncate">{dateLabel}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="start">
              <Calendar
                mode="range"
                locale={es}
                selected={dateRange}
                onSelect={handleDateRangeSelect}
                numberOfMonths={2}
                defaultMonth={dateRange?.from}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
            <span className="text-sm">Manuales</span>
            <Switch
              checked={state.includeManual}
              onCheckedChange={(v) => setField("includeManual", v)}
              aria-label="Incluir manuales"
            />
          </div>

          <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
            <span className="text-sm">Automáticos</span>
            <Switch
              checked={state.includeAutomatic}
              onCheckedChange={(v) => setField("includeAutomatic", v)}
              aria-label="Incluir automáticos"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" className="gap-2" onClick={handleReset}>
            <RefreshCcw className="h-4 w-4" />
            Restablecer
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            aria-label="Actualizar"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}