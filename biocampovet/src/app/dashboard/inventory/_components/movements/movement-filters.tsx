// movements/MovementFilters.tsx
"use client";

import * as React from "react";
import { subDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { Calendar as CalendarIcon, RefreshCcw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DATE_DISPLAY_FORMAT = "dd/MM/yyyy";

const defaultDateRange: DateRange = {
  from: subDays(new Date(), 30),
  to: new Date(),
};

export type MovementFilters = {
  dateRange?: DateRange;
  typeUi?: "ALL" | "TRANSFER" | "ADJUSTMENT";
};

type Props = {
  value?: MovementFilters;
  onChange: (filters: MovementFilters) => void;
  onReset?: () => void;
  onRefresh?: () => void;
};

const formatDateRangeLabel = (range?: DateRange) => {
  if (!range?.from) return "Rango de fechas";
  if (!range.to) return format(range.from, DATE_DISPLAY_FORMAT, { locale: es });
  return `${format(range.from, DATE_DISPLAY_FORMAT, { locale: es })} - ${format(range.to, DATE_DISPLAY_FORMAT, { locale: es })}`;
};

export default function MovementFiltersBar({ value, onChange, onReset, onRefresh }: Props) {
  const [state, setState] = React.useState<MovementFilters>({
    dateRange: value?.dateRange ?? defaultDateRange,
    typeUi: value?.typeUi ?? "ALL",
  });

  React.useEffect(() => {
    setState({
      dateRange: value?.dateRange ?? defaultDateRange,
      typeUi: value?.typeUi ?? "ALL",
    });
  }, [JSON.stringify(value)]);

  const apply = (next: MovementFilters) => {
    setState(next);
    onChange(next);
  };

  const setField = <K extends keyof MovementFilters>(key: K, v: MovementFilters[K]) => {
    apply({ ...state, [key]: v });
  };

  const handleReset = () => {
    const clean: MovementFilters = { dateRange: defaultDateRange, typeUi: "ALL" };
    apply(clean);
    onReset?.();
  };

  return (
    <div className="w-full overflow-x-auto rounded-2xl border bg-background/80 p-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex min-w-max flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatDateRangeLabel(state.dateRange)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="start">
              <Calendar
                mode="range"
                locale={es}
                selected={state.dateRange}
                onSelect={(r) => setField("dateRange", r)}
                numberOfMonths={2}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {state.dateRange && (
            <Button variant="ghost" size="icon" onClick={() => setField("dateRange", undefined)} aria-label="Limpiar rango de fechas">
              <XCircle className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Select
          value={state.typeUi ?? "ALL"}
          onValueChange={(val) => setField("typeUi", (val as MovementFilters["typeUi"]) ?? "ALL")}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los tipos</SelectItem>
            <SelectItem value="TRANSFER">Transferencia</SelectItem>
            <SelectItem value="ADJUSTMENT">Ajuste</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" className="gap-2" type="button" onClick={handleReset}>
            <RefreshCcw className="h-4 w-4" />
            Restablecer
          </Button>
          <Button variant="ghost" size="icon" onClick={onRefresh} aria-label="Actualizar">
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
