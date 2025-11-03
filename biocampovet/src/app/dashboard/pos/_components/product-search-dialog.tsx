"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ProductQuickSearchResponse,
  SaleModeSummary,
} from "@/app/dashboard/inventory/_types/product-response";
import ProductService from "@/app/dashboard/inventory/_service/product-service";
import { useToast } from "@/hooks/use-toast";

interface ProductSearchDialogProps {
  branchId?: number;
  onSelect: (product: ProductQuickSearchResponse, saleMode: SaleModeSummary) => void;
}

export default function ProductSearchDialog({ branchId, onSelect }: ProductSearchDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ProductQuickSearchResponse[]>([]);
  const [saleModesMap, setSaleModesMap] = useState<Record<number, SaleModeSummary[]>>({});
  const [loadingModesFor, setLoadingModesFor] = useState<number | null>(null);
  const { toast } = useToast();

  const canSearch = useMemo(() => query.trim().length >= 2, [query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setSaleModesMap({});
    }
  }, [open]);

  const handleSearch = useCallback(async () => {
    if (!canSearch) return;
    try {
      setLoading(true);
      const data = await ProductService.searchProducts(query, branchId);
      setResults(data);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error al buscar productos",
        description: "Intenta nuevamente en unos segundos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [branchId, canSearch, query, toast]);

  const loadSaleModes = useCallback(async (productId: number) => {
    if (loadingModesFor === productId || saleModesMap[productId]) {
      return;
    }
    try {
      setLoadingModesFor(productId);
      const detail = await ProductService.getProduct(productId);
      setSaleModesMap((prev) => ({ ...prev, [productId]: detail.saleModes ?? [] }));
      if (detail.saleModes.length === 0) {
        toast({ title: "Producto sin modos de venta", description: "Configura modos de venta en inventario." });
      }
    } catch (error) {
      console.error(error);
      toast({ title: "No se pudieron obtener los modos de venta", variant: "destructive" });
    } finally {
      setLoadingModesFor(null);
    }
  }, [loadingModesFor, saleModesMap, toast]);

  const handleSelect = (product: ProductQuickSearchResponse, saleMode: SaleModeSummary) => {
    onSelect(product, saleMode);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">Agregar producto</Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Buscar producto</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2">
          <Input
            placeholder="Nombre o SKU"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button onClick={handleSearch} disabled={!canSearch || loading}>
            {loading ? "Buscando..." : "Buscar"}
          </Button>
        </div>
        <ScrollArea className="max-h-72 mt-4">
          <div className="space-y-2">
            {results.map((product) => {
              const saleModes = saleModesMap[product.id];
              return (
                <div key={product.id} className="rounded border px-3 py-2">
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    SKU: {product.sku} • Presentación: {product.presentation}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {saleModes ? (
                      saleModes.length > 0 ? (
                        saleModes.map((mode) => (
                          <Button
                            key={mode.id}
                            type="button"
                            variant={mode.baseMode ? "default" : "outline"}
                            onClick={() => handleSelect(product, mode)}
                          >
                            {mode.unitType} • S/ {mode.price.toFixed(2)}
                          </Button>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">Sin modos de venta configurados</span>
                      )
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={loadingModesFor === product.id}
                        onClick={() => loadSaleModes(product.id)}
                      >
                        {loadingModesFor === product.id ? "Cargando..." : "Ver modos de venta"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
            {results.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground">Sin resultados. Ajusta la búsqueda.</p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
