"use client";

import { useEffect, useState } from "react";
import SaleService from "../service/sale-service";
import { toast } from "sonner";
import { format } from "date-fns";
import { SaleResponse } from "../types/sale-response";
import { SaleStatusLabels } from "../enums/sale-status";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building,
  User,
  Calendar,
  CreditCard,
  CheckCircle,
} from "lucide-react";

export function SaleDetail({ saleId }: { saleId: number }) {
  const [sale, setSale] = useState<SaleResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSale = async () => {
      setLoading(true);
      try {
        const response = await SaleService.getSale(saleId);
        setSale(response);
      } catch (error: unknown) {
        toast.error("Error al cargar detalles de la venta");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchSale();
  }, [saleId]);

  if (loading || !sale)
    return <div className="text-muted-foreground">Cargando detalles...</div>;

  const totalAmount = calculateTotalAmount(sale);
  const totalPaid = calculateTotalPaid(sale);
  const totalRemaining = totalAmount - totalPaid;

  return (
    <div className="space-y-8">
      {/* Información General */}
      <section className="bg-white rounded-md p-6 shadow-sm border">
        <h2 className="text-xl font-semibold mb-6">Información General</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 text-sm text-gray-700">
          {/* Sucursal */}
          <div className="flex items-center space-x-2">
            <Building className="w-5 h-5 text-gray-500" />
            <div>
              <dt className="font-medium text-muted-foreground">Sucursal</dt>
              <dd className="font-semibold">{sale.branch.name}</dd>
            </div>
          </div>
          {/* Estado */}
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-gray-500" />
            <div>
              <dt className="font-medium text-muted-foreground">Estado</dt>
              <dd>
                <span className="inline-block rounded-md bg-yellow-200 px-3 py-1 text-yellow-900 font-semibold select-none">
                  {SaleStatusLabels[sale.status]}
                </span>
              </dd>
            </div>
          </div>
          {/* Empleado */}
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-gray-500" />
            <div>
              <dt className="font-medium text-muted-foreground">Empleado</dt>
              <dd className="font-semibold">{`${sale.employee.firstName} ${sale.employee.lastName}`}</dd>
            </div>
          </div>
          {/* Total */}
          <div className="flex items-center space-x-2 justify-end">
            <CreditCard className="w-5 h-5 text-gray-500" />
            <div className="text-right">
              <dt className="font-medium text-muted-foreground">Total</dt>
              <dd className="font-bold text-green-600 text-lg">
                S/ {totalAmount.toFixed(2)}
              </dd>
            </div>
          </div>
          {/* Cliente */}
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-gray-500" />
            <div>
              <dt className="font-medium text-muted-foreground">Cliente</dt>
              <dd className="font-semibold">{sale.customer?.name ?? "Sin cliente"}</dd>
            </div>
          </div>
          {/* Pagado */}
          <div className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-gray-500" />
            <div>
              <dt className="font-medium text-muted-foreground">Pagado</dt>
              <dd className="font-semibold">S/ {totalPaid.toFixed(2)}</dd>
            </div>
          </div>
          {/* Fecha */}
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <div>
              <dt className="font-medium text-muted-foreground">Fecha</dt>
              <dd className="font-semibold">
                {format(new Date(sale.saleDate), "dd/MM/yyyy HH:mm")}
              </dd>
            </div>
          </div>
          {/* Por pagar */}
          <div className="flex items-center space-x-2 justify-end">
            <CreditCard className="w-5 h-5 text-gray-500" />
            <div className="text-right">
              <dt className="font-medium text-muted-foreground">Por pagar</dt>
              <dd
                className={
                  totalRemaining > 0 ? "text-red-600 font-semibold" : "text-green-600 font-semibold"
                }
              >
                S/ {totalRemaining.toFixed(2)}
              </dd>
            </div>
          </div>
        </div>
      </section>

      {/* Productos */}
      {sale.saleProducts.length > 0 && (
        <section className="bg-white rounded-md p-6 shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Productos</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead>Subtotal (S/)</TableHead>
                <TableHead>Paciente</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sale.saleProducts.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.product.name}</TableCell>
                  <TableCell>{item.quantityEquivalent}</TableCell>
                  <TableCell>{item.unitType.toLowerCase()}</TableCell>
                  <TableCell>{item.subtotal.toFixed(2)}</TableCell>
                  <TableCell>{item.animal?.name ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      )}

      {/* Pagos */}
      {sale.salePayments?.length > 0 && (
        <section className="bg-white rounded-md p-6 shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Pagos</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Método de Pago</TableHead>
                <TableHead>Monto (S/)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sale.salePayments.map((pago) => (
                <TableRow key={pago.id}>
                  <TableCell>{pago.methodName}</TableCell>
                  <TableCell>{pago.amount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      )}
    </div>
  );
}

function calculateTotalAmount(sale: SaleResponse): number {
  const productsTotal = sale.saleProducts.reduce((sum, p) => sum + p.subtotal, 0);
  return productsTotal;
}

function calculateTotalPaid(sale: SaleResponse): number {
  return sale.salePayments?.reduce((sum, p) => sum + p.amount, 0) ?? 0;
}
