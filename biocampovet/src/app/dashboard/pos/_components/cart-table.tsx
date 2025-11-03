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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SaleItemKind } from "../_types/sale-enums";
import { PosCartItem } from "../_hooks/usePosCart";

interface CartTableProps {
  items: PosCartItem[];
  onQuantityChange: (itemId: string, quantity: number) => void;
  onUnitPriceChange: (itemId: string, unitPrice: number) => void;
  onRemove: (itemId: string) => void;
}

export default function CartTable({ items, onQuantityChange, onUnitPriceChange, onRemove }: CartTableProps) {
  const handleQuantityChange = (itemId: string) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    if (!Number.isNaN(value) && value > 0) {
      onQuantityChange(itemId, value);
    }
  };

  const handlePriceChange = (itemId: string) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    if (!Number.isNaN(value) && value >= 0) {
      onUnitPriceChange(itemId, value);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Concepto</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="w-[100px]">Cant.</TableHead>
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
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>{item.kind === SaleItemKind.PRODUCT ? "Producto" : "Servicio"}</TableCell>
              <TableCell>
                <Input
                  type="number"
                  min={0.01}
                  step={item.kind === SaleItemKind.PRODUCT ? 1 : 0.1}
                  value={item.quantity}
                  onChange={handleQuantityChange(item.id)}
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={item.unitPrice}
                  onChange={handlePriceChange(item.id)}
                />
              </TableCell>
              <TableCell>S/ {(item.unitPrice * item.quantity).toFixed(2)}</TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" onClick={() => onRemove(item.id)}>
                  ✕
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
