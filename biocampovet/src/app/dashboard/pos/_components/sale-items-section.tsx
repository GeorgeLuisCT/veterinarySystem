// app/dashboard/pos/_components/sale-items-section.tsx
"use client";

import { ChangeEvent, useState, useRef, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SaleItemKind } from "../_types/sale-enums";
import { PosCartItem } from "../_hooks/usePosCart";
import {
  Package2,
  Wrench,
  Trash2,
  Plus,
  Minus,
  CircleDollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  items: PosCartItem[];
  onQuantityChange: (id: string, quantity: number) => void;
  onUnitPriceChange: (id: string, unitPrice: number) => void;
  onRemove: (id: string) => void;
  errorMessage?: string;
  disabled?: boolean;
};

type LocalValues = {
  [itemId: string]: {
    quantity?: string;
    unitPrice?: string;
  };
};

export default function SaleItemsSection({
  items,
  onQuantityChange,
  onUnitPriceChange,
  onRemove,
  errorMessage,
  disabled = false,
}: Props) {
  const [localValues, setLocalValues] = useState<LocalValues>({});
  const debounceRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  useEffect(() => {
    const timers = debounceRef.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    // Reset de campos locales cuando cambian los items
    setLocalValues({});
  }, [items]);

  const schedule = (key: string, fn: () => void, ms = 450) => {
    if (debounceRef.current[key]) clearTimeout(debounceRef.current[key]);
    debounceRef.current[key] = setTimeout(fn, ms);
  };

  const handleQuantityChange =
    (itemId: string, kind: SaleItemKind) =>
      (event: ChangeEvent<HTMLInputElement>) => {
        const raw = event.target.value.replace(",", ".");
        setLocalValues((prev) => ({
          ...prev,
          [itemId]: { ...prev[itemId], quantity: raw },
        }));

        schedule(`qty-${itemId}`, () => {
          const value = Number(raw);
          if (Number.isNaN(value)) return;
          const coerced =
            kind === SaleItemKind.SERVICE
              ? Math.max(1, Math.trunc(value))
              : Math.max(0, value);
          onQuantityChange(itemId, coerced);
        });
      };

  const bumpQuantity = (item: PosCartItem, delta: number) => {
    const isService = item.kind === SaleItemKind.SERVICE;
    const current =
      localValues[item.id]?.quantity !== undefined
        ? Number(localValues[item.id]?.quantity)
        : item.quantity;
    const next = isService
      ? Math.max(1, Math.trunc((current || 0) + delta))
      : Math.max(0, Number(((current || 0) + delta).toFixed(2)));
    setLocalValues((prev) => ({
      ...prev,
      [item.id]: { ...prev[item.id], quantity: String(next) },
    }));
    schedule(`qty-${item.id}`, () => onQuantityChange(item.id, next));
  };

  const handlePriceChange =
    (itemId: string) => (event: ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value.replace(",", ".");
      setLocalValues((prev) => ({
        ...prev,
        [itemId]: { ...prev[itemId], unitPrice: raw },
      }));
      schedule(`price-${itemId}`, () => {
        const value = Number(raw);
        if (Number.isNaN(value)) return;
        onUnitPriceChange(itemId, Math.max(0, value));
      });
    };

  return (
    <div className="space-y-2 flex flex-col flex-1">
      {errorMessage && (
        <p className="mb-2 text-sm text-destructive">{errorMessage}</p>
      )}

      <div
        className="
          rounded-2xl border bg-card/60
          shadow-[0_1px_0_0_rgb(2_6_23/0.06),0_8px_20px_-14px_rgb(2_6_23/0.16)]
          dark:shadow-[0_1px_0_0_rgb(255_255_255/0.06)_inset,0_10px_24px_-16px_rgb(0_0_0/0.55)]
          overflow-hidden flex flex-col flex-1
        "
      >
        <div className="max-h-[55vh] overflow-auto flex flex-col flex-1">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
              <TableRow>
                <TableHead className="w-[44%]">Concepto</TableHead>
                <TableHead className="w-[18%]">Cant.</TableHead>
                <TableHead className="w-[18%]">Precio</TableHead>
                <TableHead className="w-[10%] text-right">Total</TableHead>
                <TableHead className="w-[6%] text-right"></TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="p-8">
                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card/50 px-6 py-8 text-center">
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
                        <Package2 className="h-6 w-6" />
                      </span>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground/80">
                          Aún no agregas ítems
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Busca productos o servicios y añádelos para iniciar la venta.
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}


              {items.map((item) => {
                const isService = item.kind === SaleItemKind.SERVICE;
                const qtyMin = isService ? 1 : 0;
                const qtyStep = isService ? 1 : 0.01;

                const localQty = localValues[item.id]?.quantity;
                const displayQty =
                  localQty !== undefined ? localQty : String(item.quantity);

                const localPrice = localValues[item.id]?.unitPrice;
                const displayPrice =
                  localPrice !== undefined ? localPrice : String(item.unitPrice);

                const subtotal = (Number(displayQty) || 0) * (Number(displayPrice) || 0);

                return (
                  <TableRow
                    key={item.id}
                    className="
                      group transition-colors
                      hover:bg-accent/40
                    "
                  >
                    {/* Concepto */}
                    <TableCell className="align-middle">
                      <div className="flex min-w-0 items-start gap-2">
                        <span
                          aria-hidden
                          className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary"
                        >
                          {isService ? (
                            <Wrench className="h-4 w-4" />
                          ) : (
                            <Package2 className="h-4 w-4" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate font-medium">{item.name} {item.saleModeLabel && <Badge variant="secondary" className="text-[11px]">{item.saleModeLabel}</Badge>}</div>
                          <div className="mt-0.5">
                            <Badge variant="outline" className="text-[11px]">
                              {isService ? "Servicio" : "Producto"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Cantidad con stepper */}
                    <TableCell className="align-middle">
                      <div
                        className={cn(
                          "flex items-center gap-1 rounded-lg border bg-background px-1 py-1",
                          disabled && "opacity-60 pointer-events-none"
                        )}
                      >
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => bumpQuantity(item, isService ? -1 : -0.1)}
                          disabled={disabled}
                          aria-label="Disminuir cantidad"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          min={qtyMin}
                          step={qtyStep}
                          value={displayQty}
                          onChange={handleQuantityChange(item.id, item.kind)}
                          disabled={disabled}
                          inputMode="decimal"
                          className="h-8"
                          pattern={isService ? "\\d*" : "[0-9]*[.,]?[0-9]*"}
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => bumpQuantity(item, isService ? 1 : 0.1)}
                          disabled={disabled}
                          aria-label="Aumentar cantidad"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>

                    {/* Precio con prefijo S/ */}
                    <TableCell className="align-middle">
                      <div
                        className={cn(
                          "flex items-center rounded-lg border bg-background px-2 py-1.5",
                          disabled && "opacity-60 pointer-events-none"
                        )}
                      >
                        <CircleDollarSign className="mr-2 h-4 w-4 opacity-70" />
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={displayPrice}
                          onChange={handlePriceChange(item.id)}
                          disabled={disabled}
                          inputMode="decimal"
                          className="h-8 border-0 px-0 focus-visible:ring-0"
                        />
                      </div>
                    </TableCell>

                    {/* Subtotal */}
                    <TableCell className="align-middle text-right font-medium">
                      S/ {subtotal.toFixed(2)}
                    </TableCell>

                    {/* Eliminar */}
                    <TableCell className="align-middle text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemove(item.id)}
                        disabled={disabled}
                        aria-label={`Eliminar ${item.name}`}
                        title="Eliminar"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Footer sutil con total inmediato opcional (comenta si no lo usas) */}
        <Separator />
        <div className="flex items-center justify-between px-4 py-3 text-sm text-muted-foreground">
          <span>{items.length} {items.length === 1 ? "ítem" : "ítems"}</span>
          <span className="hidden sm:inline">Revisa cantidades y precios antes de finalizar</span>
        </div>
      </div>
    </div>
  );
}
