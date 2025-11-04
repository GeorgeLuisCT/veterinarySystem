// app/dashboard/pos/_components/add-products-section.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import ProductService from "@/app/dashboard/inventory/_service/product-service";
import {
  ProductQuickSearchResponse,
  SaleModeSummary,
} from "@/app/dashboard/inventory/_types/product-response";

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
    },
    [onAddProduct]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">2. Agregar productos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="Buscar por nombre o SKU..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={disabled}
          />
        </div>

        <ScrollArea className="max-h-80 rounded border">
          <div className="p-2 space-y-2">
            {loading && (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            )}

            {!loading && results.length === 0 && canSearch && (
              <p className="text-sm text-muted-foreground px-1">Sin resultados. Ajusta la búsqueda.</p>
            )}

            {!loading &&
              results.map((p) => {
                const expanded = expandedId === p.id;
                const modes = saleModesMap[p.id];
                const isLoadingRow = loadingModesFor === p.id;

                return (
                  <div key={p.id} className="rounded border">
                    <div
                      role="button"
                      tabIndex={0}
                      aria-expanded={expanded}
                      className={`px-3 py-2 flex items-start justify-between gap-2 cursor-pointer hover:bg-accent/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring ${
                        disabled ? "pointer-events-none opacity-60" : ""
                      }`}
                      onClick={() => toggleOrLoadSaleModes(p)}
                      onKeyDown={(e) => handleRowKey(e, p)}
                    >
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          SKU: {p.sku} • Presentación: {p.presentation}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {isLoadingRow ? "Cargando..." : expanded ? "Ocultar" : "Ver modos"}
                      </span>
                    </div>

                    {expanded && (
                      <div className="px-3 pb-3">
                        <div className="mt-2 flex flex-wrap gap-2">
                          {modes && modes.length > 0 ? (
                            modes.map((m) => (
                              <Button
                                key={m.id}
                                type="button"
                                variant={m.baseMode ? "default" : "outline"}
                                onClick={() => handleSelectMode(p, m)}
                                disabled={disabled}
                              >
                                {m.unitType} • S/ {m.price.toFixed(2)}
                              </Button>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Sin modos de venta configurados
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
