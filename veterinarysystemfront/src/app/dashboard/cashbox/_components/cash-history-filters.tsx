"use client";

import * as React from "react";
import { subDays, format, isEqual as isDateEqual } from "date-fns";
import { es } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { RefreshCcw, Calendar as CalendarIcon, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CashSessionHistoryParams } from "../_types/cash-session-request";
import { EmployeeSummaryResponse } from "../../staff/types/employee-summary-response";
import EmployeeService from "../../staff/service/employee-service";
import { RoleName } from "@/enums/role-name";


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

export type FiltersShape = Omit<CashSessionHistoryParams, "page" | "size" | "startDate" | "endDate"> & {
  dateRange?: DateRange;
};

type Props = {
  value?: FiltersShape;
  onChange: (filters: FiltersShape) => void;
  onReset?: () => void;
};

export const DEFAULTS: FiltersShape = {
  branchId: undefined,
  cashierId: undefined,
  dateRange: defaultDateRange,
};

const ALL = "__ALL__";

// --- Helpers de igualdad --- //
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
    a.branchId === b.branchId &&
    a.cashierId === b.cashierId &&
    eqDateRange(a.dateRange, b.dateRange)
  );
}

export default function CashHistoryFilters({ value, onChange, onReset }: Props) {
  const [state, setState] = React.useState<FiltersShape>({ ...DEFAULTS, ...(value ?? {}) });
  const [cashiers, setCashiers] = React.useState<EmployeeSummaryResponse[]>([]);

  // Cargar cajeros
  React.useEffect(() => {
    const fetchCashiers = async () => {
      try {
        const data = await EmployeeService.getEmployeesByRoles([
          RoleName.ROLE_CASHIER,
          RoleName.ROLE_RECEPTIONIST,
          RoleName.ROLE_ADMIN,
        ]);
        setCashiers(data);
      } catch (error) {
        console.error("Failed to fetch cashiers", error);
      }
    };
    fetchCashiers();
  }, []);

  // Sincronizar con props
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

  const toSelectValue = (v?: number | string) => (v ? String(v) : ALL);
  const fromSelectValue = (v: string) => (v === ALL ? undefined : Number(v));

  const handleReset = () => {
    const next = { ...DEFAULTS, branchId: state.branchId };
    apply(next);
    onReset?.();
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex min-w-max flex-wrap items-center gap-3">
        {/* Filtro Cajero */}
        <Select
          value={toSelectValue(state.cashierId)}
          onValueChange={(val) => setField("cashierId", fromSelectValue(val))}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Cajero" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los cajeros</SelectItem>
            {cashiers.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.firstName + " " + c.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtro Rango de Fechas */}
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