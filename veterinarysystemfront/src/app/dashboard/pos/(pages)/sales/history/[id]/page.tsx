"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  FileText,
  DollarSign,
  ShoppingCart,
  ReceiptText, // Cambiado de Receipt a ReceiptText
  User,
  Store,
  Package, // Para la tabla de items
  Ban, // Para ventas anuladas
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getAaxiosErrorMessage } from "@/helpers/error";
import { SaleResponse } from "@/app/dashboard/pos/_types/sale-response";
import SalesService from "@/app/dashboard/pos/_service/sales.service";
import {
  BillableServiceTypeLabels,
  PaymentMethodLabels,
  SalesDocumentTypeLabels,
  SaleStatus,
} from "@/app/dashboard/pos/_types/sale-enums";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

import { PageHeader } from "@/components/page/page-header";
import { PageContainer } from "@/components/page/page-container";
import { PageSection } from "@/components/page/page-section";
// Helper para estilos de Badge (de tu código original)
const getStatusStyle = (
  status: SaleStatus
): {
  variant: "default" | "destructive" | "outline" | "secondary";
  className?: string;
  label: string;
} => {
  switch (status) {
    case SaleStatus.VOIDED:
      return { variant: "destructive", label: "Anulada" };
    case SaleStatus.DRAFT:
      return { variant: "default", label: "Borrador" };
    case SaleStatus.COMPLETED:
      return {
        variant: "secondary",
        className: "bg-success-soft text-success-strong",
        label: "Completada",
      };
    default:
      return { variant: "secondary", label: String(status) };
  }
};

// Pequeño componente helper para mostrar info (inspirado en tu `SaleDetailsSection`)
const InfoItem = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1">
    <dt className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </dt>
    <dd className="text-base font-semibold text-foreground">{value || "N/A"}</dd>
  </div>
);

// Componente helper para la barra lateral de totales
const TotalRow = ({
  label,
  value,
  isLarge = false,
}: {
  label: string;
  value: string;
  isLarge?: boolean;
}) => (
  <div className="flex items-baseline justify-between">
    <span
      className={cn("text-sm", isLarge ? "font-semibold text-foreground" : "text-muted-foreground")}
    >
      {label}
    </span>
    <span
      className={cn("font-medium", isLarge ? "text-xl font-bold" : "text-base text-foreground")}
    >
      {value}
    </span>
  </div>
);

export default function SalesDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [sale, setSale] = useState<SaleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const saleId = Number(params.id);

  useEffect(() => {
    if (isNaN(saleId) || saleId <= 0) {
      setError("ID de venta no válido.");
      setLoading(false);
      return;
    }

    const fetchSale = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await SalesService.getSale(saleId);
        setSale(data);
      } catch (err: unknown) {
        console.error(err);
        const message = getAaxiosErrorMessage(err) || "Error al cargar la venta";
        toast({ title: message, variant: "destructive" });
        setError("No se pudo cargar la información de la venta.");
      } finally {
        setLoading(false);
      }
    };

    fetchSale();
  }, [saleId, toast]);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-destructive">
        <AlertCircle className="h-8 w-8" />
        <p className="text-lg font-semibold">{error}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4">
        <FileText className="h-8 w-8 text-muted-foreground" />
        <p className="text-lg font-semibold">Venta no encontrada.</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>
    );
  }

  // Cálculos para la barra lateral
  const statusStyle = getStatusStyle(sale.status);
  const totalPaid = sale.payments.reduce((acc, p) => acc + p.amount, 0);
  const netDue = Math.max(sale.grandTotal - totalPaid, 0);
  const paidPct = sale.grandTotal > 0 ? Math.min((totalPaid / sale.grandTotal) * 100, 100) : 0;

  return (
    <PageContainer>
      {/* Encabezado (Inspirado en PointOfSalePage) */}
      <PageHeader
        title="Detalle de Venta"
        description={
          <>
            Visualizando la venta <span className="font-medium text-foreground">#{sale.id}</span>
          </>
        }
        actions={
          <>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al historial
            </Button>
          </>
        }
      />

      {/* Layout principal (Inspirado en PointOfSalePage) */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] flex-1">
        {/* Columna Izquierda (Principal) */}
        <div className="space-y-6 flex flex-col">
          {/* Detalles de la Venta (Inspirado en SaleDetailsSection) */}
          <PageSection title="Información General">
<div>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-4">
                <InfoItem
                  icon={FileText}
                  label="Documento"
                  value={
                    <span className="font-bold">
                      {SalesDocumentTypeLabels[sale.documentType]}{" "}
                      {sale.documentNumber ? ` - ${sale.documentNumber}` : ""}
                    </span>
                  }
                />
                <InfoItem icon={User} label="Cliente" value={sale.customerName || "N/A"} />
                <InfoItem icon={Store} label="Sucursal" value={sale.branchName || "N/A"} />
                <InfoItem icon={User} label="Vendedor" value={sale.sellerName || "N/A"} />
                <div className="sm:col-span-2">
                  <InfoItem
                    icon={FileText}
                    label="Notas"
                    value={
                      <p className="text-base font-normal text-muted-foreground">
                        {sale.notes || "Sin notas"}
                      </p>
                    }
                  />
                </div>
              </dl>
            </div>
</PageSection>

          {/* Tabla de Detalles (Inspirado en SaleItemsSection) */}
          <PageSection title={<span className="inline-flex items-center gap-2"><ShoppingCart className="h-5 w-5" /> Artículos de la Venta ({sale.details.length})</span>}>
<div>
              <div className="overflow-hidden rounded-md border">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Concepto</TableHead>
                      <TableHead className="w-32 text-right">P. Unitario</TableHead>
                      <TableHead className="w-24 text-right">Cantidad</TableHead>
                      <TableHead className="w-32 text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sale.details.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          No hay artículos en esta venta.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sale.details.map((item) => {
                        let metadata: { kind?: string; saleModeLabel?: string } = {};
                        try {
                          if (item.metadataJson) {
                            metadata = JSON.parse(item.metadataJson);
                          }
                        } catch (e) {
                          console.error("Failed to parse detail metadata", e);
                        }

                        const saleModeLabel = metadata?.saleModeLabel;
                        const kind = metadata?.kind;

                        let typeLabel: string | null = null;
                        if (kind === "SERVICE" && item.serviceType) {
                          typeLabel = BillableServiceTypeLabels[item.serviceType] ?? "Servicio";
                        } else if (kind === "PRODUCT") {
                          typeLabel = "Producto";
                        }

                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-start gap-2">
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                </span>
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-medium">{item.description}</p>
                                    {saleModeLabel && (
                                      <Badge variant="secondary" className="text-[11px]">
                                        {saleModeLabel}
                                      </Badge>
                                    )}
                                  </div>
                                  {typeLabel && (
                                    <span className="text-xs text-muted-foreground">
                                      {typeLabel}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              S/ {item.unitPrice.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right font-medium">
                              S/ {item.lineSubtotal.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
</PageSection>
        </div>

        {/* Columna Derecha (Barra Lateral) (Inspirado en OrderSummarySection) */}
        <div className="space-y-6">
          <Card className="surface-card">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ReceiptText className="h-5 w-5" />
                  Resumen de Venta
                </CardTitle>
                <Badge
                  variant={statusStyle.variant}
                  className={cn("rounded-md text-sm", statusStyle.className)}
                >
                  {statusStyle.label}
                </Badge>
              </div>
              <CardDescription>
                Registrada el: {new Date(sale.createdAt).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Totales */}
              <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
                <TotalRow label="Subtotal" value={`S/ ${sale.subtotal.toFixed(2)}`} />
                <TotalRow label="Impuestos (IGV)" value={`S/ ${sale.taxTotal.toFixed(2)}`} />
                <Separator className="my-2" />
                <TotalRow
                  label="Total Venta"
                  value={`S/ ${sale.grandTotal.toFixed(2)}`}
                  isLarge={true}
                />
              </div>

              {/* Sección de Anulación */}
              {sale.status === SaleStatus.VOIDED && (
                <div className="rounded-md border border-destructive bg-destructive/10 p-3">
                  <h4 className="flex items-center gap-2 font-semibold text-destructive">
                    <Ban className="h-4 w-4" />
                    Venta Anulada
                  </h4>
                  <p className="mt-1 text-sm text-destructive/80">
                    <strong>Razón:</strong> {sale.voidReason || "No especificada"}
                  </p>
                  <p className="text-sm text-destructive/80">
                    <strong>Fecha:</strong>{" "}
                    {sale.voidedAt ? new Date(sale.voidedAt).toLocaleString() : "N/A"}
                  </p>
                </div>
              )}

              {/* Estado de Pagos (si no está anulada) */}
              {sale.status !== SaleStatus.VOIDED && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Progress value={paidPct} aria-label="Progreso de pago" />
                    <p className="text-xs text-muted-foreground">
                      {paidPct.toFixed(0)}% cubierto del total
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="gap-1">
                      <DollarSign className="h-3.5 w-3.5" />
                      <span className="text-[11px] tracking-wide">
                        Pagado: S/ {totalPaid.toFixed(2)}
                      </span>
                    </Badge>
                    <Badge variant={netDue > 0 ? "destructive" : "outline"} className="gap-1">
                      <span className="text-[11px] tracking-wide">
                        Pendiente: S/ {netDue.toFixed(2)}
                      </span>
                    </Badge>
                  </div>
                </div>
              )}

              <Separator />

              {/* Tabla de Pagos */}
              <div className="space-y-3">
                <h4 className="font-semibold">Pagos Recibidos ({sale.payments.length})</h4>
                <div className="overflow-hidden rounded-md border">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Método</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sale.payments.length > 0 ? (
                        sale.payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>
                              <Badge variant="outline" className="rounded-full">
                                {PaymentMethodLabels[payment.method]}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(payment.paidAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              S/ {payment.amount.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">
                            No se registraron pagos.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
