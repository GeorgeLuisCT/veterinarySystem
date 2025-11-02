"use client";

import * as React from "react";
import { subDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { Calendar as CalendarIcon, RefreshCcw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const DATE_DISPLAY_FORMAT = "dd/MM/yyyy";

const defaultDateRange: DateRange = {
  from: subDays(new Date(), 30),
  to: new Date(),
};

export type PurchaseFilters = {
  dateRange?: DateRange;
};

type Props = {
  value?: PurchaseFilters;
  onChange: (filters: PurchaseFilters) => void;
  onReset?: () => void;
  onRefresh?: () => void;
};

const formatDateRangeLabel = (range?: DateRange) => {
  if (!range?.from) return "Rango de fechas";
  if (!range.to) return format(range.from, DATE_DISPLAY_FORMAT, { locale: es });
  return `${format(range.from, DATE_DISPLAY_FORMAT, { locale: es })} - ${format(range.to, DATE_DISPLAY_FORMAT, { locale: es })}`;
};

export default function PurchaseFiltersBar({ value, onChange, onReset, onRefresh }: Props) {
  const [state, setState] = React.useState<PurchaseFilters>({
    dateRange: value?.dateRange ?? defaultDateRange,
  });

  React.useEffect(() => {
    setState({
      dateRange: value?.dateRange ?? defaultDateRange,
    });
  }, [JSON.stringify(value)]);

  const apply = (next: PurchaseFilters) => {
    setState(next);
    onChange(next);
  };

  const setField = <K extends keyof PurchaseFilters>(key: K, v: PurchaseFilters[K]) => {
    apply({ ...state, [key]: v });
  };

  const handleReset = () => {
    const clean: PurchaseFilters = { dateRange: defaultDateRange };
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
