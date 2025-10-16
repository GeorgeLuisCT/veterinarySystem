"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil } from "lucide-react";
import { ProductUnitTypeLabels } from "../../products/enums/product-unit-type";
import { InventoryMovementProductLocal } from "../types/inventory-movement-product-request";
import { InventoryMovementType } from "../enums/inventory-movement-type";

interface Props {
  products: InventoryMovementProductLocal[];
  onRemove: (index: number) => void;
  onEdit?: (index: number) => void;
  movementType?: InventoryMovementType;
}

export default function InventoryProductTable({
  products,
  onRemove,
  onEdit,
  movementType,
}: Props) {
  const showCost =
    movementType === InventoryMovementType.PURCHASE;


  const hiddenClass = "hidden";

  return (
    <div className="overflow-auto border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Producto</TableHead>
            <TableHead>Cantidad</TableHead>
            <TableHead>Unidad</TableHead>
            <TableHead className={!showCost ? hiddenClass : ""}>Costo Unitario</TableHead>
            <TableHead>Lote</TableHead>
            <TableHead>Vencimiento</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                No hay productos añadidos.
              </TableCell>
            </TableRow>
          ) : (
            products.map((item, index) => (
              <TableRow key={`${item.product.id}-${index}`}>
                <TableCell>{item.product.name}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>
                  {
                    ProductUnitTypeLabels[item.productUnitType as keyof typeof ProductUnitTypeLabels] ??
                    item.productUnitType
                  }
                </TableCell>
                <TableCell className={!showCost ? hiddenClass : ""}>
                  {item.unitCost ?? "-"}
                </TableCell>
                <TableCell>
                  {item.batchNumber}
                </TableCell>
                <TableCell className={!showCost ? hiddenClass : ""}>
                  {item.expirationDate || "-"}
                </TableCell>
                <TableCell className="text-right space-x-1">
                  {onEdit && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(index)}
                    >
                      <Pencil className="w-4 h-4 text-blue-500" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(index)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
