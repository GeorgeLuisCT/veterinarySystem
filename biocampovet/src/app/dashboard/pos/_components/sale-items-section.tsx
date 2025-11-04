// app/dashboard/pos/_components/sale-items-section.tsx
"use client";

import { ChangeEvent } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SaleItemKind } from "../_types/sale-enums";
import { PosCartItem } from "../_hooks/usePosCart";

type Props = {
  items: PosCartItem[];
  onQuantityChange: (id: string, quantity: number) => void;
  onUnitPriceChange: (id: string, unitPrice: number) => void;
  onRemove: (id: string) => void;
  errorMessage?: string;
  disabled?: boolean;
};

export default function SaleItemsSection({
  items,
  onQuantityChange,
  onUnitPriceChange,
  onRemove,
  errorMessage,
  disabled = false,
}: Props) {
  const handleQuantityChange =
    (itemId: string, kind: SaleItemKind) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value.replace(",", ".");
      const value = Number(raw);
      if (Number.isNaN(value)) return;

      if (kind === SaleItemKind.SERVICE) {
        const coerced = Math.max(1, Math.trunc(value));
        onQuantityChange(itemId, coerced);
      } else {
        const coerced = Math.max(0, value);
        onQuantityChange(itemId, coerced);
      }
    };

  const handlePriceChange =
    (itemId: string) => (event: ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value.replace(",", ".");
      const value = Number(raw);
      if (Number.isNaN(value)) return;
      onUnitPriceChange(itemId, Math.max(0, value));
    };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">3. Ítems en la venta</CardTitle>
      </CardHeader>
      <CardContent>
        {errorMessage && <p className="mb-3 text-sm text-destructive">{errorMessage}</p>}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Concepto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="w-[120px]">Cant.</TableHead>
                <TableHead className="w-[120px]">Precio</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Aún no hay ítems en la venta.
                  </TableCell>
                </TableRow>
              )}

              {items.map((item) => {
                const isService = item.kind === SaleItemKind.SERVICE;
                const qtyMin = isService ? 1 : 0;
                const qtyStep = isService ? 1 : 0.01;

                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{isService ? "Servicio" : "Producto"}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={qtyMin}
                        step={qtyStep}
                        value={item.quantity}
                        onChange={handleQuantityChange(item.id, item.kind)}
                        disabled={disabled}
                        inputMode="decimal"
                        pattern={isService ? "\\d*" : "[0-9]*[.,]?[0-9]*"}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.unitPrice}
                        onChange={handlePriceChange(item.id)}
                        disabled={disabled}
                        inputMode="decimal"
                      />
                    </TableCell>
                    <TableCell>S/ {(item.unitPrice * item.quantity).toFixed(2)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemove(item.id)}
                        disabled={disabled}
                        aria-label="Eliminar"
                        title="Eliminar"
                      >
                        ✕
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
