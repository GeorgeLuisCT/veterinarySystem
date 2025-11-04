"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import SalesService from "../_service/sales.service";
import type { SaleSummaryResponse } from "../_types/sale-response";

interface Props {
  branchId?: number;
}

export default function PendingSalesSheet({ branchId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sales, setSales] = useState<SaleSummaryResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchPending = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await SalesService.listPendingSales(branchId);
      setSales(data || []);
    } catch {
      setError("No se pudieron cargar las ventas pendientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchPending();
  }, [open, branchId]);

  const totalCount = useMemo(() => sales.length, [sales]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">Flujo de Venta</Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col gap-4 p-0">
        <div className="p-4">
          <SheetHeader>
            <SheetTitle>Flujo de Venta</SheetTitle>
            <SheetDescription>Ventas en borrador pendientes en la sucursal seleccionada.</SheetDescription>
          </SheetHeader>
        </div>
        <Separator />
        <div className="px-4 pb-2 flex items-center justify-between gap-2">
          <div className="text-sm text-muted-foreground">Total: {totalCount}</div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={fetchPending} disabled={loading}>
              Actualizar
            </Button>
            <Button size="sm" onClick={() => setOpen(false)}>
              Cerrar
            </Button>
          </div>
        </div>
        <ScrollArea className="flex-1 px-4 pb-4">
          <div className="space-y-2">
            {loading && (
              <div className="text-sm text-muted-foreground py-4">Cargando ventas...</div>
            )}
            {error && (
              <div className="text-sm text-red-600 py-4">{error}</div>
            )}
            {!loading && !error && sales.length === 0 && (
              <div className="text-sm text-muted-foreground py-4">No hay ventas pendientes.</div>
            )}
            {!loading &&
              !error &&
              sales.map((s) => (
                <div key={s.id} className="rounded-xl border p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium">#{s.id} · {s.documentNumber || "SIN NÚMERO"}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(s.createdAt), "yyyy-MM-dd HH:mm")}
                      </div>
                    </div>
                    <Badge variant="outline">{s.status}</Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <div className="text-muted-foreground">Tipo: {s.documentType}</div>
                    <div className="font-medium">Total: {s.grandTotal.toFixed(2)}</div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => router.push(`/dashboard/pos/sales/new?saleId=${s.id}`)}
                    >
                      Ver en historial
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
