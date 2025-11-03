"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import SalesService from "../../../_service/sales.service";
import { SaleSummaryResponse } from "../../../_types/sale-response";
import { SaleStatus } from "../../../_types/sale-enums";

export default function PendingSalesPage() {
  const [sales, setSales] = useState<SaleSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await SalesService.listPendingSales();
        setSales(data.filter((sale) => sale.status === SaleStatus.DRAFT));
      } catch (error) {
        console.error(error);
        toast({ title: "No se pudo cargar el listado", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Ventas en progreso</h1>
          <p className="text-sm text-muted-foreground">Continúa con los borradores pendientes.</p>
        </div>
        <Button onClick={() => router.push("/dashboard/pos/new")}>Crear nueva venta</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Borradores</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Total</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Cargando...
                  </TableCell>
                </TableRow>
              )}
              {!loading && sales.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No hay ventas pendientes.
                  </TableCell>
                </TableRow>
              )}
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{sale.id}</TableCell>
                  <TableCell>
                    {sale.documentType} • {sale.documentNumber}
                  </TableCell>
                  <TableCell>{new Date(sale.createdAt).toLocaleString()}</TableCell>
                  <TableCell>S/ {sale.grandTotal.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" onClick={() => router.push(`/dashboard/pos/new?saleId=${sale.id}`)}>
                      Continuar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
