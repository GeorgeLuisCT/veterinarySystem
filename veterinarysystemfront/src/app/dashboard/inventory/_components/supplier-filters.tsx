"use client";

import * as React from "react";
import { Search, RefreshCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SupplierListParams } from "../_types/supplier-response";
import { SupplierType, SupplierTypeLabels } from "../_enums/supplier-type";

type FiltersShape = Omit<SupplierListParams, "page" | "size">;

type Props = {
  value?: FiltersShape;
  onChange: (filters: FiltersShape) => void;
  onReset?: () => void;
};

const DEFAULTS: FiltersShape = {
  q: undefined,
  active: undefined,
  supplierType: undefined,
};

const ALL = "__ALL__";

export default function SupplierFilters({ value, onChange, onReset }: Props) {
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

  const [qLocal, setQLocal] = React.useState(state.q ?? "");
  React.useEffect(() => setQLocal(state.q ?? ""), [state.q]);
  React.useEffect(() => {
    const t = setTimeout(() => apply({ ...state, q: qLocal || undefined }), 400);
    return () => clearTimeout(t);
  }, [qLocal]);

  const toSelectValue = (v?: string) => v ?? ALL;
  const fromSelectValue = (v: string) => (v === ALL ? undefined : v);

  const handleReset = () => {
    apply(DEFAULTS);
    onReset?.();
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex min-w-max items-center gap-3">
        <div className="relative w-[280px]">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Buscar por nombre, RUC o email…"
            value={qLocal}
            onChange={(e) => setQLocal(e.currentTarget.value)}
          />
        </div>

        <Select
          value={toSelectValue(state.supplierType)}
          onValueChange={(val) =>
            setField("supplierType", fromSelectValue(val) as SupplierType | undefined)
          }
        >
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los tipos</SelectItem>
            {(Object.values(SupplierType) as SupplierType[]).map((p) => (
              <SelectItem key={p} value={p}>
                {SupplierTypeLabels[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
          <span className="text-sm text-muted-foreground">Activos</span>
          <Switch
            checked={state.active === true}
            onCheckedChange={(checked) => setField("active", checked ? true : undefined)}
            aria-label="Filtrar activos"
          />
        </div>

        <Button variant="ghost" className="gap-2" type="button" onClick={handleReset}>
          <RefreshCcw className="h-4 w-4" />
          Restablecer
        </Button>
      </div>
    </div>
  );
}