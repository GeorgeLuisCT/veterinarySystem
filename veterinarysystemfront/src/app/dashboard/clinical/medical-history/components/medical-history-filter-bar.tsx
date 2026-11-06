"use client";

import * as React from "react";
import { Search, RefreshCcw, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { FloatingLabelMultiSelect, type Option } from "@/components/floating-label-multi-select";
import { AnimalSpecies, AnimalSpeciesLabels } from "@/app/dashboard/crm/patients/enums/animal-species";

const SPECIES_OPTIONS: Option<AnimalSpecies>[] = (Object.values(AnimalSpecies) as AnimalSpecies[]).map((value) => ({
  value,
  label: AnimalSpeciesLabels[value],
}));

export type FilterState = {
  query: string;
  species: AnimalSpecies[];
  active: boolean;
};

export const DEFAULTS: FilterState = {
  query: "",
  species: [],
  active: true,
};

type Props = {
  value: FilterState; // El padre nos da el estado
  onChange: (filters: FilterState) => void;
  onReset: () => void;
  onRefresh: () => void;
};

export default function MedicalHistoryFilterBar({
  value,
  onChange,
  onReset,
  onRefresh,
}: Props) {
  // 1. ELIMINAMOS el `[state, setState]`. El 'value' del prop es la única fuente de verdad.
  //    Mantenemos 'qLocal' SÓLO para el debouncer.
  const [qLocal, setQLocal] = React.useState(value.query ?? "");

  // 2. Sincroniza 'qLocal' SÓLO si el 'value.query' del padre cambia
  //    (por ejemplo, al resetear).
  React.useEffect(() => {
    // Solo actualiza qLocal si es *diferente* del prop 'value.query'
    // Esto evita que el debouncer se dispare innecesariamente.
    if (value.query !== qLocal) {
      setQLocal(value.query ?? "");
    }
    // Deshabilitamos la advertencia de lint porque 'qLocal' aquí es intencional
    // para evitar el bucle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.query]);

  // 3. El Debouncer ahora es más simple.
  //    Solo llama a onChange. NO actualiza el estado local.
  React.useEffect(() => {
    const t = setTimeout(() => {
      // Solo llama a onChange si qLocal es diferente del estado del padre
      if (value.query !== qLocal) {
        onChange({ ...value, query: qLocal || "" });
      }
    }, 400);

    return () => clearTimeout(t);
  }, [qLocal, value, onChange]); // Depende de qLocal, value, y onChange (estable)

  // 4. 'setField' ahora actualiza el estado del padre directamente.
  const setField = <K extends keyof FilterState>(key: K, v: FilterState[K]) => {
    // Construye el nuevo estado basado en el 'value' del prop
    const newState = { ...value, [key]: v };
    onChange(newState); // Notifica al padre
  };

  // 5. 'handleReset' solo llama a onReset. El padre se encarga.
  const handleReset = () => {
    onReset();
  };

  const hasAnyFilter =
    value.query !== "" ||
    value.species.length > 0 ||
    value.active === false;

  return (
    <div className="w-full rounded-lg border bg-card p-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          Filtros
          {hasAnyFilter && <Badge className="ml-1">Activos</Badge>}
        </div>

        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* El Input de Búsqueda solo actualiza qLocal */}
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Buscar por nombre, propietario..."
              value={qLocal}
              onChange={(e) => setQLocal(e.currentTarget.value)}
            />
          </div>

          {/* Los otros inputs leen de 'value' y llaman a 'setField' */}
          <div className="min-w-[200px]">
            <FloatingLabelMultiSelect
              id="species"
              label="Especies"
              options={SPECIES_OPTIONS}
              selected={value.species} // Lee de 'value'
              onChange={(v) => setField("species", v)}
            />
          </div>

          <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
            <span className="text-sm text-muted-foreground">Solo activos</span>
            <Switch
              checked={value.active} // Lee de 'value'
              onCheckedChange={(v) => setField("active", v)}
              aria-label="Filtrar solo pacientes activos"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" className="gap-2" type="button" onClick={handleReset}>
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