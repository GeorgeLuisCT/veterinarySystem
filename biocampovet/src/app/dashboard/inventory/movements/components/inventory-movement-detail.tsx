"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { InventoryMovementResponse } from "../types/inventory-movement-response";
import InventoryMovementService from "../service/inventory-movement-service";
import { InventoryMovementTypeLabels } from "../enums/inventory-movement-type";
import { ProductUnitTypeLabels } from "../../products/enums/product-unit-type";
import { getAaxiosErrorMessage } from "@/helpers/error";

type Props = {
  movementId: number;
};

export default function InventoryMovementDetail({ movementId }: Props) {
  const [movement, setMovement] = useState<InventoryMovementResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await InventoryMovementService.getMovement(movementId);
      setMovement(data);
    } catch (error: unknown) {
      const message = getAaxiosErrorMessage(error) || "Error al cargar el detalle";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [movementId]);

  if (loading) {
    return <Skeleton className="h-[200px] w-full rounded-md" />;
  }

  if (!movement) {
    return <p className="text-sm text-muted-foreground">No se encontró el movimiento.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <p>
          <strong>Tipo:</strong> {InventoryMovementTypeLabels[movement.type]}
        </p>
        <p>
          <strong>Fecha:</strong> {format(new Date(movement.date), "dd/MM/yyyy HH:mm")}
        </p>
        <p>
          <strong>Sucursal Origen:</strong> {movement.sourceBranch?.name}
        </p>
        <p>
          <strong>Sucursal Destino:</strong> {movement.targetBranch?.name || "-"}
        </p>
        <p>
          <strong>Proveedor:</strong> {movement.supplier?.name || "-"}
        </p>
        <p>
          <strong>Empleado:</strong> {movement.employee.firstName} {movement.employee.lastName}
        </p>
        <p className="md:col-span-2">
          <strong>Descripción:</strong> {movement.description || "-"}
        </p>
      </div>

      <div className="border rounded-md overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead>Costo Unitario</TableHead>
              <TableHead>Número de Lote</TableHead>
              <TableHead>Vencimiento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movement.products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.product.name}</TableCell>
                <TableCell>{product.quantity}</TableCell>
                <TableCell>{ProductUnitTypeLabels[product.productUnitType]}</TableCell>
                <TableCell>{product.unitCost ? `S/ ${product.unitCost}` : "-"}</TableCell>
                <TableCell>{product.batchNumber || "-"}</TableCell>
                <TableCell>{product.expirationDate || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
