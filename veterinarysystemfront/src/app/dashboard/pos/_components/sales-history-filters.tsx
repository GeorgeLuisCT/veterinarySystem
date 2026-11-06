// SalesFilters.tsx
"use client";

import * as React from "react";
import { subDays, format, isEqual as isDateEqual } from "date-fns";
import { es } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { Search, RefreshCcw, Calendar as CalendarIcon, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SaleListParams } from "../_types/sale-request";
import { SaleStatus, SaleStatusLabels, SalesDocumentType, SalesDocumentTypeLabels } from "../_types/sale-enums";

const DATE_DISPLAY_FORMAT = "dd/MM/yyyy";
export const defaultDateRange: DateRange = {
  from: subDays(new Date(), 30),
  to: new Date(),
};
const formatDateRangeLabel = (range?: DateRange) => {
  if (!range?.from) return "Rango de fechas";
  if (!range.to) return format(range.from, DATE_DISPLAY_FORMAT, { locale: es });
  return `${format(range.from, DATE_DISPLAY_FORMAT, { locale: es })} - ${format(
    range.to,
    DATE_DISPLAY_FORMAT,
    { locale: es }
  )}`;
};

export type FiltersShape = Omit<SaleListParams, "page" | "size" | "startDate" | "endDate"> & {
  dateRange?: DateRange;
};

type Props = {
  value?: FiltersShape;
  onChange: (filters: FiltersShape) => void;
  onReset?: () => void;
};

export const DEFAULTS: FiltersShape = {
  q: undefined,
  branchId: undefined,
  customerId: undefined,
  sellerId: undefined,
  status: undefined,
  documentType: undefined,
  documentNumber: undefined,
  dateRange: defaultDateRange,
};

const ALL = "__ALL__";

// --- helpers de igualdad --- //
function eqDateRange(a?: DateRange, b?: DateRange) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  const aFrom = a.from ? new Date(a.from) : undefined;
  const bFrom = b.from ? new Date(b.from) : undefined;
  const aTo = a.to ? new Date(a.to) : undefined;
  const bTo = b.to ? new Date(b.to) : undefined;
  const fromEq = (!aFrom && !bFrom) || (aFrom && bFrom && isDateEqual(aFrom, bFrom));
  const toEq = (!aTo && !bTo) || (aTo && bTo && isDateEqual(aTo, bTo));
  return fromEq && toEq;
}

function shallowEqualFilters(a: FiltersShape, b: FiltersShape) {
  return (
    a.q === b.q &&
    a.branchId === b.branchId &&
    a.customerId === b.customerId &&
    a.sellerId === b.sellerId &&
    a.status === b.status &&
    a.documentType === b.documentType &&
    a.documentNumber === b.documentNumber &&
    eqDateRange(a.dateRange, b.dateRange)
  );
}

export default function SalesFilters({ value, onChange, onReset }: Props) {
  const [state, setState] = React.useState<FiltersShape>({ ...DEFAULTS, ...(value ?? {}) });

  // sincroniza con props SOLO si cambia algo realmente
  React.useEffect(() => {
    const next = { ...DEFAULTS, ...(value ?? {}) };
    if (!shallowEqualFilters(state, next)) {
      setState(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const apply = React.useCallback(
    (next: FiltersShape) => {
      if (!shallowEqualFilters(state, next)) {
        setState(next);
        onChange(next);
      }
    },
    [onChange, state]
  );

  const setField = React.useCallback(
    <K extends keyof FiltersShape>(key: K, v: FiltersShape[K]) => {
      const next = { ...state, [key]: v };
      apply(next);
    },
    [apply, state]
  );

  // Debounce para 'q'
  const [qLocal, setQLocal] = React.useState(state.q ?? "");
  React.useEffect(() => setQLocal(state.q ?? ""), [state.q]);
  React.useEffect(() => {
    const t = setTimeout(() => {
      const normalized = qLocal || undefined;
      if (normalized !== state.q) {
        apply({ ...state, q: normalized });
      }
    }, 400);
    return () => clearTimeout(t);
    // solo depende de qLocal y state.q (evita loop por cambios irrelevantes del resto del estado)
  }, [qLocal, state.q, apply, state]);

  // Debounce para 'documentNumber'
  const [docNumLocal, setDocNumLocal] = React.useState(state.documentNumber ?? "");
  React.useEffect(() => setDocNumLocal(state.documentNumber ?? ""), [state.documentNumber]);
  React.useEffect(() => {
    const t = setTimeout(() => {
      const normalized = docNumLocal || undefined;
      if (normalized !== state.documentNumber) {
        apply({ ...state, documentNumber: normalized });
      }
    }, 400);
    return () => clearTimeout(t);
  }, [docNumLocal, state.documentNumber, apply, state]);

  const toSelectValue = (v?: string) => v ?? ALL;
  const fromSelectValue = (v: string) => (v === ALL ? undefined : v);

  const handleReset = () => {
    const next = { ...DEFAULTS, branchId: state.branchId };
    apply(next);
    onReset?.();
  };

  return (
    <div className="w-full overflow-x-auto rounded-lg border bg-card p-3">
      <div className="flex min-w-max flex-wrap items-center gap-3">
        {/* Filtro Q */}
        <div className="relative w-[280px]">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Buscar por cliente..."
            value={qLocal}
            onChange={(e) => setQLocal(e.currentTarget.value)}
          />
        </div>

        {/* Filtro Document Number */}
        <div className="relative w-[200px]">
          <Input
            placeholder="N° Comprobante"
            value={docNumLocal}
            onChange={(e) => setDocNumLocal(e.currentTarget.value)}
          />
        </div>

        {/* Filtro Status */}
        <Select
          value={toSelectValue(state.status)}
          onValueChange={(val) => setField("status", fromSelectValue(val) as SaleStatus | undefined)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los estados</SelectItem>
            {(Object.values(SaleStatus) as SaleStatus[]).map((p) => (
              <SelectItem key={p} value={p}>
                {SaleStatusLabels[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtro Document Type */}
        <Select
          value={toSelectValue(state.documentType)}
          onValueChange={(val) => setField("documentType", fromSelectValue(val) as SalesDocumentType | undefined)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Comprobante" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los comprobantes</SelectItem>
            {(Object.values(SalesDocumentType) as SalesDocumentType[]).map((p) => (
              <SelectItem key={p} value={p}>
                {SalesDocumentTypeLabels[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtro DateRange */}
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatDateRangeLabel(state.dateRange)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="start">
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setField("dateRange", undefined)}
              aria-label="Limpiar rango de fechas"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Botón Reset */}
        <Button variant="ghost" className="gap-2" type="button" onClick={handleReset}>
          <RefreshCcw className="h-4 w-4" />
          Restablecer
        </Button>
      </div>
    </div>
  );
}
