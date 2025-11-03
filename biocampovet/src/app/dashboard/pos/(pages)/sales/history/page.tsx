"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SalesService from "../../../_service/sales.service";
import { SaleSummaryResponse } from "../../../_types/sale-response";
import { SaleStatus } from "../../../_types/sale-enums";
import { PaginatedResponse } from "@/types/paginated-response";
import { useToast } from "@/hooks/use-toast";

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<SaleSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const loadSales = async () => {
      try {
        setLoading(true);
        const data: PaginatedResponse<SaleSummaryResponse> = await SalesService.listSales({ page: 0, size: 20 });
        setSales(data.content);
      } catch (error) {
        console.error(error);
        toast({ title: "Error al cargar historial", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    loadSales();
  }, [toast]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Historial de ventas</h1>
          <p className="text-sm text-muted-foreground">Listado de las últimas ventas registradas.</p>
        </div>
        <Button onClick={() => router.push("/dashboard/pos/new")}>Nueva venta</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ventas recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Comprobante</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Cargando...
                  </TableCell>
                </TableRow>
              )}
              {!loading && sales.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No se encontraron ventas registradas.
                  </TableCell>
                </TableRow>
              )}
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{sale.id}</TableCell>
                  <TableCell>
                    {sale.documentType} - {sale.documentNumber}
                  </TableCell>
                  <TableCell>S/ {sale.grandTotal.toFixed(2)}</TableCell>
                  <TableCell>
                    <span
                      className={
                        sale.status === SaleStatus.VOIDED
                          ? "text-destructive"
                          : sale.status === SaleStatus.COMPLETED
                          ? "text-green-600"
                          : "text-muted-foreground"
                      }
                    >
                      {sale.status}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(sale.createdAt).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {sale.status === SaleStatus.DRAFT && (
                      <Button variant="outline" onClick={() => router.push(`/dashboard/pos/new?saleId=${sale.id}`)}>
                        Continuar
                      </Button>
                    )}
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
