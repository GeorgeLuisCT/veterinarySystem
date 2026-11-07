"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import SalesService from "../../../_service/sales.service";
import { SaleSummaryResponse } from "../../../_types/sale-response";
import { SaleStatus } from "../../../_types/sale-enums";

import { PageHeader } from "@/components/page/page-header";
import { PageContainer } from "@/components/page/page-container";
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
    <PageContainer>
      <PageHeader
        title="Ventas en progreso"
        description="Continúa con los borradores pendientes."
        actions={
          <>
            <Button onClick={() => router.push("/dashboard/pos/new")}>Crear nueva venta</Button>
          </>
        }
      />

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
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/dashboard/pos/new?saleId=${sale.id}`)}
                    >
                      Continuar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
