// app/dashboard/pos/_components/add-products-section.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import ProductService from "@/app/dashboard/inventory/_service/product-service";
import {
  ProductQuickSearchResponse,
  SaleModeSummary,
} from "@/app/dashboard/inventory/_types/product-response";
import { formatPresentation } from "../../inventory/_helpers/product-formatters";
import { getSaleModeSummaryText } from "../../inventory/_utils/product-util-labels";

// Extras de UI
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Package2,
  Barcode,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Loader2,
} from "lucide-react";

type Props = {
  branchId: number;
  onAddProduct: (product: ProductQuickSearchResponse, saleMode: SaleModeSummary) => void;
  disabled?: boolean;
};

export default function AddProductsSection({ branchId, onAddProduct, disabled = false }: Props) {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ProductQuickSearchResponse[]>([]);
  const [saleModesMap, setSaleModesMap] = useState<Record<number, SaleModeSummary[]>>({});
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loadingModesFor, setLoadingModesFor] = useState<number | null>(null);
  const debounceRef = useRef<number | null>(null);

  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const canSearch = useMemo(() => query.trim().length >= 2, [query]);

  const runSearch = useCallback(
    async (q: string) => {
      const text = q.trim();
      if (text.length < 2) {
        setResults([]);
        setExpandedId(null);
        return;
      }
      try {
        setLoading(true);
        const data = await ProductService.searchProducts(text, branchId);
        setResults(data);
      } catch {
        toast({
          title: "Error al buscar productos",
          description: "Intenta nuevamente en unos segundos",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [branchId, toast]
  );

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => runSearch(query), 600);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  const toggleOrLoadSaleModes = useCallback(
    async (product: ProductQuickSearchResponse) => {
      if (expandedId === product.id) {
        setExpandedId(null);
        return;
      }
      if (saleModesMap[product.id]) {
        setExpandedId(product.id);
        return;
      }
      try {
        setLoadingModesFor(product.id);
        const detail = await ProductService.getProduct(product.id);
        const modes = detail.saleModes ?? [];
        setSaleModesMap((prev) => ({ ...prev, [product.id]: modes }));
        setExpandedId(product.id);
        if (modes.length === 0) {
          toast({
            title: "Producto sin modos de venta",
            description: "Configura modos de venta en inventario.",
          });
        }
      } catch {
        toast({ title: "No se pudieron obtener los modos de venta", variant: "destructive" });
      } finally {
        setLoadingModesFor(null);
      }
    },
    [expandedId, saleModesMap, toast]
  );

  const handleRowKey = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>, product: ProductQuickSearchResponse) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleOrLoadSaleModes(product);
      }
    },
    [toggleOrLoadSaleModes]
  );

  const handleSelectMode = useCallback(
    (product: ProductQuickSearchResponse, mode: SaleModeSummary) => {
      onAddProduct(product, mode);
      setQuery("");
      setResults([]);
      setSaleModesMap({});
      setExpandedId(null);
      setOpen(false);
    },
    [onAddProduct]
  );

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    setOpen(!disabled && (loading || (canSearch && (results.length > 0 || !loading))));
  }, [disabled, loading, canSearch, results.length]);

  return (
    <div className="space-y-3">
      <div ref={wrapperRef} className="relative">
        <Input
          placeholder="Buscar por nombre o SKU..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={disabled}
          onFocus={() => {
            if (!disabled && (results.length > 0 || loading || canSearch)) setOpen(true);
          }}
          aria-expanded={open}
          aria-controls="product-search-panel"
        />

        {open && (
          <div
            id="product-search-panel"
            className="
              absolute left-0 right-0 top-full mt-1 z-50
              max-h-96 overflow-auto rounded-xl border bg-popover text-popover-foreground
              shadow-[0_1px_0_0_rgb(2_6_23/0.06),0_10px_30px_-12px_rgb(2_6_23/0.18)]
              dark:shadow-[0_1px_0_0_rgb(255_255_255/0.06)_inset,0_16px_36px_-18px_rgb(0_0_0/0.50)]
              backdrop-blur supports-[backdrop-filter]:bg-popover/98 bg-app-gradient
            "
            role="listbox"
            aria-label="Resultados de búsqueda de productos"
          >
            <div className="p-2 space-y-2">
              {loading && (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-16 w-full rounded-xl" />
                </div>
              )}

              {!loading && results.length === 0 && canSearch && (
                <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Sin resultados. Ajusta la búsqueda.</span>
                </div>
              )}

              {!loading &&
                results.map((p) => {
                  const expanded = expandedId === p.id;
                  const modes = saleModesMap[p.id];
                  const isLoadingRow = loadingModesFor === p.id;

                  return (
                    <div
                      key={p.id}
                      className="
                        group rounded-xl border bg-card/50
                        hover:bg-accent/40 transition-colors
                        shadow-sm hover:shadow-md surface-card
                      "
                    >
                      {/* Header de la tarjeta */}
                      <div
                        role="option"
                        tabIndex={0}
                        aria-selected={expanded}
                        aria-expanded={expanded}
                        className={`
                          px-3 py-2 flex items-start justify-between gap-3 cursor-pointer
                          focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                          ${disabled ? "pointer-events-none opacity-60" : ""}
                        `}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => toggleOrLoadSaleModes(p)}
                        onKeyDown={(e) => handleRowKey(e, p)}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Package2 className="h-4 w-4 text-primary/80" />
                            <p className="font-medium truncate">{p.name}</p>
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <Badge variant="secondary" className="gap-1">
                              <Barcode className="h-3 w-3 opacity-80" />
                              <span className="text-[11px] tracking-wide">SKU: {p.sku}</span>
                            </Badge>

                            <Badge variant="outline" className="text-xs">
                              {formatPresentation(p)}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {isLoadingRow ? (
                            <span className="inline-flex items-center gap-1">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Cargando…
                            </span>
                          ) : expanded ? (
                            <span className="inline-flex items-center gap-1">
                              Ocultar
                              <ChevronUp className="h-4 w-4" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              Ver modos
                              <ChevronDown className="h-4 w-4" />
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Panel expandible */}
                      {expanded && (
                        <div
                          className="
                            px-3 pb-3 pt-0
                            animate-in fade-in-0 zoom-in-95 duration-150
                          "
                        >
                          <Separator className="mb-3" />

                          {modes && modes.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {modes.map((mode) => {
                                const label = mode.baseMode
                                  ? formatPresentation(p)
                                  : getSaleModeSummaryText(
                                      mode.unitType,
                                      mode.relativeQuantity,
                                      p.presentation
                                    );
                                return (
                                  <Button
                                    key={`${p.id}-${mode.id}`}
                                    type="button"
                                    variant={mode.baseMode ? "default" : "outline"}
                                    size="sm"
                                    className={`
                                      rounded-full
                                      shadow-none
                                      cursor-pointer
                                      hover:shadow
                                      transition-all
                                      ${mode.baseMode ? "bg-primary text-primary-foreground" : ""}
                                    `}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => handleSelectMode(p, mode)}
                                    disabled={disabled}
                                  >
                                    <span className="inline-flex items-center gap-2">
                                      <span>{label}</span>
                                      <span className="inline-flex items-center gap-1 text-xs opacity-90">
                                        <CircleDollarSign className="h-3.5 w-3.5" />
                                        S/ {mode.price.toFixed(2)}
                                      </span>
                                    </span>
                                  </Button>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              Sin modos de venta configurados
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
