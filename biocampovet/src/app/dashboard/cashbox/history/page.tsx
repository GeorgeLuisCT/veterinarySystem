"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import CashSessionService from "../_service/cash-session.service";
import { CashSessionHistoryResponse } from "../_types/cash-session-response";

export default function CashSessionHistoryPage() {
  const [history, setHistory] = useState<CashSessionHistoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        const data = await CashSessionService.listHistory({ page: 0, size: 20 });
        setHistory(data.content);
      } catch (error) {
        console.error(error);
        toast({ title: "Error al cargar historial", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [toast]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Historial de cierres</h1>
          <p className="text-sm text-muted-foreground">Revisa las sesiones de caja cerradas recientemente.</p>
        </div>
        <Button onClick={() => router.push("/dashboard/cashbox")}>Volver a caja</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sesiones recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Sucursal</TableHead>
                <TableHead>Cajero</TableHead>
                <TableHead>Apertura</TableHead>
                <TableHead>Cierre</TableHead>
                <TableHead>Calculado</TableHead>
                <TableHead>Contado</TableHead>
                <TableHead>Diferencia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Cargando...
                  </TableCell>
                </TableRow>
              )}
              {!loading && history.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Aún no hay cierres registrados.
                  </TableCell>
                </TableRow>
              )}
              {history.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>{session.id}</TableCell>
                  <TableCell>{session.branchName ?? session.branchId}</TableCell>
                  <TableCell>{session.cashierName ?? session.cashierId}</TableCell>
                  <TableCell>{new Date(session.openedAt).toLocaleString()}</TableCell>
                  <TableCell>{session.closedAt ? new Date(session.closedAt).toLocaleString() : ""}</TableCell>
                  <TableCell>S/ {session.calculatedClosingAmount.toFixed(2)}</TableCell>
                  <TableCell>S/ {(session.countedClosingAmount ?? 0).toFixed(2)}</TableCell>
                  <TableCell className={session.differenceAmount ? "text-destructive" : ""}>
                    S/ {(session.differenceAmount ?? 0).toFixed(2)}
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
