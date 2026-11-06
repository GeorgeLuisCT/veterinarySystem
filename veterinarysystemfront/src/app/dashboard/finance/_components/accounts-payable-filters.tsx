// app/dashboard/finance/_components/accounts-payable-filters.tsx
"use client";
import * as React from "react";
import { Search, RefreshCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AccountPayableStatus } from "../_types/account-payable";

type FiltersShape = { status?: AccountPayableStatus; search?: string };

type Props = {
  value?: FiltersShape;
  onChange: (filters: FiltersShape) => void;
  onReset?: () => void;
};

const DEFAULTS: FiltersShape = {
  status: undefined,
  search: undefined,
};

const ALL = "__ALL__";

export default function AccountsPayableFilters({ value, onChange, onReset }: Props) {
  const [state, setState] = React.useState<FiltersShape>({ ...DEFAULTS, ...(value ?? {}) });
  React.useEffect(() => {
    setState({ ...DEFAULTS, ...(value ?? {}) });
  }, [JSON.stringify(value)]);

  const apply = (next: FiltersShape) => {
    setState(next);
    onChange(next);
  };

  const setField = <K extends keyof FiltersShape>(key: K, v: FiltersShape[K]) => {
    apply({ ...state, [key]: v });
  };

  const [qLocal, setQLocal] = React.useState(state.search ?? "");
  React.useEffect(() => setQLocal(state.search ?? ""), [state.search]);
  React.useEffect(() => {
    const t = setTimeout(() => apply({ ...state, search: qLocal || undefined }), 400);
    return () => clearTimeout(t);
  }, [qLocal]);

  const toSelectValue = (v?: AccountPayableStatus) => v ?? ALL;
  const fromSelectValue = (v: string) => (v === ALL ? undefined : (v as AccountPayableStatus));

  const handleReset = () => {
    apply(DEFAULTS);
    onReset?.();
  };

  return (
    <div className="w-full overflow-x-auto rounded-lg border bg-card p-3">
      <div className="flex min-w-max items-center gap-3">
        <div className="relative w-[320px]">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Buscar por descripción o proveedor…"
            value={qLocal}
            onChange={(e) => setQLocal(e.currentTarget.value)}
          />
        </div>

        <Select
          value={toSelectValue(state.status)}
          onValueChange={(val) => setField("status", fromSelectValue(val))}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos</SelectItem>
            <SelectItem value={AccountPayableStatus.PENDING}>Pendientes</SelectItem>
            <SelectItem value={AccountPayableStatus.PARTIALLY_PAID}>Parciales</SelectItem>
            <SelectItem value={AccountPayableStatus.PAID}>Pagadas</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="ghost" className="gap-2" type="button" onClick={handleReset}>
          <RefreshCcw className="h-4 w-4" />
          Restablecer
        </Button>
      </div>
    </div>
  );
}
