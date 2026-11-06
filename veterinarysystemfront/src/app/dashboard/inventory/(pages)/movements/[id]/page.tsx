"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { ArrowLeft, CalendarDays, Building2, Truck, UserRound, FileText } from "lucide-react";

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
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";

import { getAaxiosErrorMessage } from "@/helpers/error";
import { InventoryMovementResponse } from "@/app/dashboard/inventory/_types/inventory-movement-response";
import InventoryMovementService from "@/app/dashboard/inventory/_service/inventory-movement-service";
import { ProductUnitTypeLabels } from "@/app/dashboard/inventory/_enums/product-unit-type";
import { InventoryMovementTypeLabels } from "@/app/dashboard/inventory/_enums/inventory-movement-type";
import DashboardLayoutSection from "@/app/dashboard/dashboard-layout-section";
import { PageContainer } from "@/components/page/page-container";

const formatDate = (value?: string | null, withTime = false) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return format(parsed, withTime ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy", { locale: es });
};

export default function MovementDetailPage() {
  const params = useParams();
  const router = useRouter();

  const RETURN_PATH = "/dashboard/inventory/movements";
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
          <Skeleton className="h-6 w-64" />
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
            aria-label="Regresar a la lista de movimientos"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </div>
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-muted-foreground">No se encontró el movimiento.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fallbackEmployeeName = [movement.employee?.firstName, movement.employee?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const employeeName = movement.employee?.fullName ?? fallbackEmployeeName;
  const employeeDisplay = employeeName && employeeName.length > 0 ? employeeName : "—";

  return (
    <DashboardLayoutSection>
      <PageContainer>
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className="gap-2"
                onClick={goBack}
                aria-label="Regresar a la lista de movimientos"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Button>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Detalle de movimiento #{movement.id}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDate(movement.date, true)}
              </Badge>
              <Badge>{InventoryMovementTypeLabels[movement.type]}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-muted/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Sucursal de origen
                </CardTitle>
                <CardDescription>De dónde sale el stock</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-base font-medium">{movement.sourceBranch?.name ?? "—"}</p>
              </CardContent>
            </Card>

            <Card className="border-muted/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Sucursal de destino
                </CardTitle>
                <CardDescription>Hacia dónde ingresa el stock</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-base font-medium">{movement.targetBranch?.name ?? "—"}</p>
              </CardContent>
            </Card>

            <Card className="border-muted/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <UserRound className="h-4 w-4" />
                  Registrado por
                </CardTitle>
                <CardDescription>Responsable</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-base font-medium">{employeeDisplay}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-muted/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Descripción
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">{movement.description?.trim() || "—"}</p>
            </CardContent>
          </Card>

          <Card className="border-muted/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Productos del movimiento</CardTitle>
              <CardDescription>Detalle de ítems</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="rounded-md border overflow-hidden">
                <div className="max-h-[60vh] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-right">Cantidad</TableHead>
                        <TableHead>Unidad</TableHead>
                        <TableHead>Lote</TableHead>
                        <TableHead>Vencimiento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movement.products?.map((item) => (
                        <TableRow key={item.id} className="hover:bg-muted/30">
                          <TableCell className="min-w-56">{item.product.name}</TableCell>
                          <TableCell className="text-right">{Number(item.quantity ?? 0)}</TableCell>
                          <TableCell>{ProductUnitTypeLabels[item.unitType]}</TableCell>
                          <TableCell>{item.batch?.batchNumber ?? "—"}</TableCell>
                          <TableCell>{formatDate(item.batch?.expirationDate)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </DashboardLayoutSection>
  );
}
