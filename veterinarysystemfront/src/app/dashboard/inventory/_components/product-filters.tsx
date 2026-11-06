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

import type { ProductListParams } from "../_types/product-response";
import {
  ProductPresentationType,
  ProductPresentationTypeLabels,
} from "../_enums/product-presentation-type";
import {
  ProductUnitType,
  ProductUnitTypeLabels,
} from "../_enums/product-unit-type";
import {
  AdministrationRoute,
  AdministrationRouteLabels,
  AdministrationRouteOptions,
} from "../_enums/administration-route";
import { categoryService } from "../_service/category-product-service";

type Category = {
  id: number;
  name: string;
};

type FiltersShape = Omit<ProductListParams, "page" | "size" | "branchId">;

type Props = {
  branchId: number;
  value?: FiltersShape;
  onChange: (filters: FiltersShape) => void;
  onReset?: () => void;
};

const DEFAULTS: FiltersShape = {
  q: undefined,
  categoryId: undefined,
  active: undefined,
  presentation: undefined,
  unitType: undefined,
  route: undefined,
  hasSaleModes: undefined,
  availableOnly: undefined,
  minStockAlertOnly: undefined,
};

const ALL = "__ALL__";

export default function ProductFilters({ value, onChange, onReset }: Props) {
  const [state, setState] = React.useState<FiltersShape>({ ...DEFAULTS, ...(value ?? {}) });
  const [categories, setCategories] = React.useState<Category[]>([]);

  React.useEffect(() => {
    categoryService.getAll()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  React.useEffect(() => {
    setState({ ...DEFAULTS, ...(value ?? {}) });
  }, [JSON.stringify(value)]);

  const apply = (next: FiltersShape) => {
    const { hasSaleModes, ...rest } = next as FiltersShape & { hasSaleModes?: boolean };
    void hasSaleModes;
    const clean = { ...rest, hasSaleModes: undefined } as FiltersShape;
    setState(clean);
    onChange(clean);
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

  const toSelectValue = (v?: string | number) => v?.toString() ?? ALL;
  const fromSelectValue = (v: string) => (v === ALL ? undefined : v);

  const handleReset = () => {
    apply(DEFAULTS);
    onReset?.();
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex min-w-max items-center gap-3">
        <div className="relative w-[220px]">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Buscar por nombre o SKU…"
            value={qLocal}
            onChange={(e) => setQLocal(e.currentTarget.value)}
          />
        </div>

        <Select
          value={toSelectValue(state.categoryId)}
          onValueChange={(val) =>
            setField("categoryId", val === ALL ? undefined : Number(val))
          }
        >
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas las categorías</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={String(cat.id)}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={toSelectValue(state.presentation)}
          onValueChange={(val) =>
            setField("presentation", fromSelectValue(val) as ProductPresentationType | undefined)
          }
        >
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas las presentaciones</SelectItem>
            {(Object.values(ProductPresentationType) as ProductPresentationType[]).map((p) => (
              <SelectItem key={p} value={p}>
                {ProductPresentationTypeLabels[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={toSelectValue(state.unitType)}
          onValueChange={(val) =>
            setField("unitType", fromSelectValue(val) as ProductUnitType | undefined)
          }
        >
          <SelectTrigger className="w-42">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas las unidades</SelectItem>
            {Object.values(ProductUnitType).map((u) => (
              <SelectItem key={String(u)} value={String(u)}>
                {ProductUnitTypeLabels?.[u as ProductUnitType] ?? String(u)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={toSelectValue(state.route)}
          onValueChange={(val) =>
            setField("route", fromSelectValue(val) as AdministrationRoute | undefined)
          }
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas las vías</SelectItem>
            {AdministrationRouteOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {AdministrationRouteLabels[opt.value as AdministrationRoute]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
          <span className="text-sm text-muted-foreground">
            Activos
          </span>
          <Switch
            checked={state.active === true}
            onCheckedChange={(checked) => setField("active", checked ? true : undefined)}
            aria-label="Filtrar activos"
          />
        </div>

        <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
          <span className="text-sm text-muted-foreground">Stock bajo</span>
          <Switch
            checked={state.minStockAlertOnly === true}
            onCheckedChange={(checked) => setField("minStockAlertOnly", checked ? true : undefined)}
            aria-label="Filtrar stock bajo"
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