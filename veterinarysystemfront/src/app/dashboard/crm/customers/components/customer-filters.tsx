"use client";

import * as React from "react";
import { Search, RefreshCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export type CustomerFiltersShape = {
  q?: string;        // se mapeará a query
  active: boolean;   // requerido por el API
};

type Props = {
  value: CustomerFiltersShape;
  onChange: (filters: CustomerFiltersShape) => void;
  onReset?: () => void;
};

const DEFAULTS: CustomerFiltersShape = {
  q: undefined,
  active: true, // por defecto activos
};

export default function CustomerFilters({ value, onChange, onReset }: Props) {
  const [state, setState] = React.useState<CustomerFiltersShape>({
    ...DEFAULTS,
    ...(value ?? {}),
  });

  React.useEffect(() => {
    setState({ ...DEFAULTS, ...(value ?? {}) });
  }, [JSON.stringify(value)]);

  const apply = (next: CustomerFiltersShape) => {
    setState(next);
    onChange(next);
  };

  const setField = <K extends keyof CustomerFiltersShape>(key: K, v: CustomerFiltersShape[K]) => {
    apply({ ...state, [key]: v });
  };

  const [qLocal, setQLocal] = React.useState(state.q ?? "");
  React.useEffect(() => setQLocal(state.q ?? ""), [state.q]);
  React.useEffect(() => {
    const t = setTimeout(() => apply({ ...state, q: qLocal || undefined }), 400);
    return () => clearTimeout(t);
  }, [qLocal]);

  const handleReset = () => {
    apply(DEFAULTS);
    onReset?.();
  };

  return (
    <div className="w-full overflow-x-auto rounded-lg border bg-card p-3">
      <div className="flex min-w-max items-center gap-3">
        {/* Buscador */}
        <div className="relative w-[260px]">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Buscar por nombre, documento, teléfono…"
            value={qLocal}
            onChange={(e) => setQLocal(e.currentTarget.value)}
          />
        </div>

        <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
          <span className="text-sm text-muted-foreground">
            {state.active ? "Activos" : "Inactivos"}
          </span>
          <Switch
            checked={state.active}
            onCheckedChange={(checked) => setField("active", checked)}
            aria-label="Filtrar por estado"
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
