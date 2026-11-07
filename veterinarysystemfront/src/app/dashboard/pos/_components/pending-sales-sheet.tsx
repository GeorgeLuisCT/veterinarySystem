// app/dashboard/pos/_components/pending-sales-sheet.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale/es";
import {
  RefreshCw,
  Workflow,
  CalendarClock,
  Search,
} from "lucide-react";
import SalesService from "../_service/sales.service";
import type { SaleSummaryResponse } from "../_types/sale-response";
import { SaleStatusLabels } from "../_types/sale-enums";

interface Props {
  branchId?: number;
}

const PEN = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
});

export default function PendingSalesSheet({ branchId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sales, setSales] = useState<SaleSummaryResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, branchId]);

  const totalCount = useMemo(() => sales.length, [sales]);

  const statusVariant = (status?: string) => {
    switch ((status || "").toLowerCase()) {
      case "draft":
      case "borrador":
        return "secondary" as const;
      case "pending":
      case "pendiente":
        return "outline" as const;
      case "canceled":
      case "anulada":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sales;
    return sales.filter((s) => {
      const id = String(s.id);
      const customer = (s.customerName || "SIN CLIENTE").toLowerCase();
      const doc = (s.documentType || "").toLowerCase();
      return id.includes(q) || customer.includes(q) || doc.includes(q);
    });
  }, [sales, query]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Workflow className="h-4 w-4" />
          Flujo de Venta
        </Button>
      </SheetTrigger>

      <SheetContent
        className="bg-app-gradient p-0 h-dvh sm:h-screen flex flex-col min-h-0"
      >
        <div className="sticky top-0 z-10 bg-background/95">
          <div className="p-4">
            <SheetHeader>
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"
                >
                  <Workflow className="h-4 w-4" />
                </span>
                <div>
                  <SheetTitle>Flujo de Venta</SheetTitle>
                  <SheetDescription>
                    Ventas en borrador pendientes en la sucursal seleccionada.
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>
          </div>

          <Separator />
          <div className="px-4 py-2 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="relative w-full">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por #numero o cliente"
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <span className="text-sm text-muted-foreground">Total: {totalCount}</span>
              <Button
                size="sm"
                variant="secondary"
                onClick={fetchPending}
                disabled={loading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
              <Button size="sm" onClick={() => setOpen(false)}>
                Cerrar
              </Button>
            </div>
          </div>
          <Separator />
        </div>

        <ScrollArea
          className="flex-1 min-h-0 px-4 pb-4 [&_[data-radix-scroll-area-viewport]]:h-full"
        >
          <div className="space-y-3 py-3">
            {loading && (
              <div className="grid gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <Card key={i} className="surface-card">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-2">
                          <Skeleton className="h-4 w-48 rounded-md" />
                          <div className="flex flex-wrap items-center gap-3">
                            <Skeleton className="h-3 w-40 rounded-md" />
                            <Skeleton className="h-3 w-28 rounded-md" />
                          </div>
                        </div>
                        <Skeleton className="h-5 w-24 rounded-full" />
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2">
                      <Skeleton className="h-4 w-28 rounded-md" />
                      <div className="ml-auto">
                        <Skeleton className="h-8 w-32 rounded-lg" />
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}

            {error && !loading && (
              <div className="text-sm text-destructive py-4">{error}</div>
            )}

            {!loading && !error && sales.length === 0 && (
              <Card className="surface-card">
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No hay ventas pendientes.
                </CardContent>
              </Card>
            )}

            {!loading && !error && sales.length > 0 && filtered.length === 0 && (
              <Card className="surface-card">
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No hay coincidencias para “{query}”.
                </CardContent>
              </Card>
            )}

            {!loading &&
              !error &&
              filtered.map((s) => {
                const created = new Date(s.createdAt);
                const relative = formatDistanceToNow(created, { addSuffix: true, locale: es });

                return (
                  <Card
                    key={s.id}
                    className="surface-card transition-colors hover:bg-accent/40 gap-2"
                  >
                    <CardContent className="pt-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">
                            #{s.id} · {s.customerName || "SIN CLIENTE"}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <CalendarClock className="h-3.5 w-3.5" />
                              {format(created, "yyyy-MM-dd HH:mm")} · {relative}
                            </span>
                          </div>
                        </div>

                        <Badge variant={statusVariant(s.status)} className="whitespace-nowrap">
                          {SaleStatusLabels[s.status]}
                        </Badge>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="font-semibold">
                          Total: {PEN.format(s.grandTotal)}
                        </div>
                      </div>
                      <div className="ml-auto">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => router.push(`/dashboard/pos/sales/new?saleId=${s.id}`)}
                        >
                          Reanudar venta
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                );
              })}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
