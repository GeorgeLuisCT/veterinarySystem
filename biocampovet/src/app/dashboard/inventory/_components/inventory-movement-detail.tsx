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
import { InventoryMovementResponse } from "../_types/inventory-movement-response";
import InventoryMovementService from "../_service/inventory-movement-service";
import { InventoryMovementTypeLabels } from "../_enums/inventory-movement-type";
import { ProductUnitTypeLabels } from "../_enums/product-unit-type";
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

  const formatDateValue = (value?: string | null) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return format(parsed, "dd/MM/yyyy");
  };

  if (loading) {
    return <Skeleton className="h-[200px] w-full rounded-md" />;
  }

  if (!movement) {
    return <p className="text-sm text-muted-foreground">No se encontró el movimiento.</p>;
  }

  const fallbackEmployeeName = [movement.employee?.firstName, movement.employee?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const employeeName = movement.employee?.fullName ?? fallbackEmployeeName;
  const employeeDisplay = employeeName && employeeName.length > 0 ? employeeName : "-";

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
          <strong>Empleado:</strong>{" "}
          {employeeDisplay}
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
              <TableHead>Lote</TableHead>
              <TableHead>Vencimiento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movement.products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.product.name}</TableCell>
                <TableCell>{product.quantity}</TableCell>
                <TableCell>{ProductUnitTypeLabels[product.unitType]}</TableCell>
                <TableCell>
                  {product.unitCost !== undefined && product.unitCost !== null
                    ? `S/ ${Number(product.unitCost).toFixed(2)}`
                    : "-"}
                </TableCell>
                <TableCell>{product.batch?.batchNumber ?? "-"}</TableCell>
                <TableCell>{formatDateValue(product.batch?.expirationDate)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
