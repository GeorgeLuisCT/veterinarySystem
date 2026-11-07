"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { ArrowLeft, CalendarDays, Factory, Building2, UserRound } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/page/page-header";
import { PageSection } from "@/components/page/page-section";
import { SummaryPanel, SummaryItem } from "@/components/page/summary-panel";
import { ExpirationBadge } from "@/app/dashboard/inventory/_components/expiration-badge";

import { getAaxiosErrorMessage } from "@/helpers/error";
import { InventoryMovementResponse } from "@/app/dashboard/inventory/_types/inventory-movement-response";
import InventoryMovementService from "@/app/dashboard/inventory/_service/inventory-movement-service";
import { ProductUnitTypeLabels } from "@/app/dashboard/inventory/_enums/product-unit-type";
import DashboardLayoutSection from "@/app/dashboard/dashboard-layout-section";
import { PageContainer } from "@/components/page/page-container";

const formatDate = (value?: string | null, withTime = false) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return format(parsed, withTime ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy", { locale: es });
};

const currency = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

export default function PurchaseDetailPage() {
  const params = useParams();
  const router = useRouter();

  const RETURN_PATH = "/dashboard/inventory/movements/purchase";
  const goBack = () => router.push(RETURN_PATH);

  const movementId = useMemo(() => {
    const raw = (params?.id ?? "") as string | string[];
    const idStr = Array.isArray(raw) ? raw[0] : raw;
    return Number(idStr);
  }, [params]);

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
    if (!Number.isFinite(movementId)) return;
    fetchData();
  }, [movementId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="h-9 w-9 p-0" disabled>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-6 w-56" />
        </div>
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!movement) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={goBack}
            className="gap-2 cursor-pointer"
            aria-label="Regresar a la lista de compras"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">No se encontró la compra.</p>
      </div>
    );
  }

  const fallbackEmployeeName = [movement.employee?.firstName, movement.employee?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const employeeName = movement.employee?.fullName ?? fallbackEmployeeName;
  const employeeDisplay = employeeName && employeeName.length > 0 ? employeeName : "-";

  const purchaseTotal =
    movement.products?.reduce((acc, p) => {
      const q = Number(p.quantity ?? 0);
      const c = Number(p.unitCost ?? 0);
      return acc + q * c;
    }, 0) ?? 0;

  return (
    <DashboardLayoutSection>
      <PageContainer>
        <div className="space-y-4">
          <PageHeader
            title={`Detalle de compra #${movement.id}`}
            onBack={goBack}
            meta={
              <>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatDate(movement.date, true)}
                </Badge>
              </>
            }
          />

          <SummaryPanel
            footer={
              <span className={movement.description?.trim() ? "text-foreground" : ""}>
                {movement.description?.trim() || "Sin descripción"}
              </span>
            }
          >
            <SummaryItem icon={Factory} label="Proveedor">
              {movement.supplier?.name ?? "—"}
            </SummaryItem>
            <SummaryItem icon={Building2} label="Sucursal de ingreso">
              {movement.targetBranch?.name ?? "—"}
            </SummaryItem>
            <SummaryItem icon={UserRound} label="Registrado por">
              {employeeDisplay}
            </SummaryItem>
          </SummaryPanel>

          <PageSection
            title="Productos comprados"
            description="Detalle de ítems y costos"
            actions={<Badge variant="neutral">{movement.products?.length ?? 0} productos</Badge>}
          >
            <div className="rounded-md border overflow-hidden">
              <div className="max-h-[60vh] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-muted/60">
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead>Unidad</TableHead>
                      <TableHead className="text-right">Costo unitario</TableHead>
                      <TableHead>Lote</TableHead>
                      <TableHead>Vencimiento</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movement.products?.map((item) => {
                      const qty = Number(item.quantity ?? 0);
                      const unitCost = Number(item.unitCost ?? 0);
                      const subtotal = qty * unitCost;
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="min-w-56 font-medium">
                            {item.product.name}
                          </TableCell>
                          <TableCell className="text-right text-base font-semibold tabular-nums">
                            {qty}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {ProductUnitTypeLabels[item.unitType]}
                          </TableCell>
                          <TableCell className="text-right">
                            {unitCost ? currency.format(unitCost) : "—"}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {item.batch?.batchNumber ?? "—"}
                          </TableCell>
                          <TableCell>
                            <ExpirationBadge date={item.batch?.expirationDate} />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {subtotal ? currency.format(subtotal) : "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-end border-t bg-muted/20">
                <div className="w-full md:w-80 p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Total ítems</span>
                    <span className="font-medium">{movement.products?.length ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-base">
                    <span className="font-medium">Total de la compra</span>
                    <span className="font-semibold">{currency.format(purchaseTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </PageSection>
        </div>
      </PageContainer>
    </DashboardLayoutSection>
  );
}
