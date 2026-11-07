"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

import DashboardLayoutSection from "../../../dashboard-layout-section";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

import CashSessionService from "../../_service/cash-session.service";
import {
  CashboxPaymentBreakdownResponse,
  CashSessionDetailResponse,
} from "../../_types/cash-session-response";
import { CashMovementType } from "../../_types/cash-session-enums";
import { PaymentMethodLabels } from "../../../pos/_types/sale-enums";

import { Wallet, ArrowUpRight, ArrowDownRight, Coins, Calculator, Receipt, ExternalLink, CalendarClock, User2, ArrowLeft, Banknote, AlertTriangle } from "lucide-react";
import { PageContainer } from "@/components/page/page-container";

import { PageHeader } from "@/components/page/page-header";
import { PageSection } from "@/components/page/page-section";
const PEN = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
});

type SummaryItemProps = {
  label: string;
  value: number;
  negative?: boolean;
  highlight?: boolean;
  icon?: React.ElementType;
};

function SummaryItem({ label, value, negative, highlight, icon: Icon }: SummaryItemProps) {
  return (
    <div
      className={[
        "rounded-lg p-4 h-full",
        highlight ? "bg-primary/10" : "bg-muted/50",
      ].join(" ")}
    >
      <div className="flex items-center gap-2">
        {Icon && (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
      <p className={`mt-1 text-2xl font-semibold ${negative ? "text-destructive" : ""}`}>
        {negative && value !== 0 ? "-" : ""}
        {PEN.format(Math.abs(value))}
      </p>
    </div>
  );
}

function SalesSummaryCard({
  totalSales,
  breakdown,
}: {
  totalSales: number;
  breakdown: CashboxPaymentBreakdownResponse[];
}) {
  return (
    <div className="rounded-lg p-4 h-full bg-muted/50 md:row-span-2">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Receipt className="h-4 w-4" />
        </span>
        <p className="text-sm text-muted-foreground">Total en ventas</p>
      </div>
      <p className="mt-1 text-2xl font-semibold">{PEN.format(totalSales)}</p>
      <Separator className="my-3" />
      <div className="space-y-1.5">
        {breakdown.length === 0 && (
          <p className="text-xs text-muted-foreground">Sin ventas registradas.</p>
        )}
        {breakdown.map((item) => (
          <div
            key={item.paymentMethod}
            className="flex justify-between text-xs text-muted-foreground"
          >
            <span>{item.label}</span>
            <span className="font-medium">{PEN.format(item.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CashSessionDetailPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const sessionId = Number(params.id);

  const [detail, setDetail] = useState<CashSessionDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSessionDetail = useCallback(
    async (id: number) => {
      try {
        setLoading(true);
        const response = await CashSessionService.getSessionDetail(id);
        setDetail(response);
      } catch (error) {
        console.error(error);
        setDetail(null);
        toast({ title: "No fue posible obtener el detalle de la sesión", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    if (sessionId) {
      loadSessionDetail(sessionId);
    }
  }, [sessionId, loadSessionDetail]);

  const totals = useMemo(() => {
    if (!detail || !detail.session) return null;
    return {
      opening: detail.session.openingAmount,
      sales: detail.session.totalSales,
      incomes: detail.session.totalIncomeMovements,
      expenses: detail.session.totalExpenseMovements,
      calculated: detail.session.calculatedClosingAmount,
      counted: detail.session.countedClosingAmount ?? 0,
      difference: detail.session.differenceAmount ?? 0,
    };
  }, [detail]);

  return (
    <DashboardLayoutSection>
      <PageContainer>
        <div className="space-y-4">
          <PageHeader
            title="Detalle de Cierre de Caja"
            description="Resumen detallado de una sesión de caja cerrada."
            actions={
              <>
                <Button variant="outline" onClick={() => router.back()}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver al historial
                </Button>
              </>
            }
          />

          {loading && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Cargando detalle de la sesión...
              </CardContent>
            </Card>
          )}

          {!loading && !detail && (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center">
                <p className="text-muted-foreground">
                  No se pudo encontrar la sesión de caja con ID #{sessionId}.
                </p>
              </CardContent>
            </Card>
          )}

          {detail && totals && (
            <PageSection title="Resumen de sesión">
<div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <SummaryItem label="Apertura" value={totals.opening} icon={Wallet} />
                  <SalesSummaryCard totalSales={totals.sales} breakdown={detail.paymentBreakdown} />
                  <SummaryItem
                    label="Ingresos adicionales"
                    value={totals.incomes}
                    icon={ArrowUpRight}
                  />
                  <SummaryItem
                    label="Total Calculado"
                    value={totals.calculated}
                    highlight
                    icon={Calculator}
                  />
                  <SummaryItem
                    label="Egresos"
                    value={totals.expenses}
                    negative
                    icon={ArrowDownRight}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <SummaryItem
                    label="Monto Contado (Cierre)"
                    value={totals.counted}
                    icon={Banknote}
                  />
                  <SummaryItem
                    label="Diferencia"
                    value={totals.difference}
                    negative={totals.difference !== 0}
                    highlight={totals.difference !== 0}
                    icon={AlertTriangle}
                  />
                </div>

                <div className="rounded-lg border p-4 bg-card/60 shadow-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <User2 className="h-4 w-4 text-primary/80 flex-shrink-0" />
                      <div>
                        <span className="text-muted-foreground">Cajero:</span>
                        <p className="font-medium">{detail.session?.cashierName ?? "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Wallet className="h-4 w-4 text-primary/80 flex-shrink-0" />
                      <div>
                        <span className="text-muted-foreground">Sucursal:</span>
                        <p className="font-medium">{detail.session?.branchName ?? "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarClock className="h-4 w-4 text-primary/80 flex-shrink-0" />
                      <div>
                        <span className="text-muted-foreground">Apertura:</span>
                        <p className="font-medium">
                          {detail.session?.openedAt
                            ? new Date(detail.session.openedAt).toLocaleString()
                            : "-"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarClock className="h-4 w-4 text-primary/80 flex-shrink-0" />
                      <div>
                        <span className="text-muted-foreground">Cierre:</span>
                        <p className="font-medium">
                          {detail.session?.closedAt
                            ? new Date(detail.session.closedAt).toLocaleString()
                            : "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {detail.session?.notes && (
                  <div className="rounded-lg border p-4 bg-card/60 shadow-sm">
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Notas de Cierre
                    </p>
                    <p className="text-sm">{detail.session.notes}</p>
                  </div>
                )}

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-2">Movimientos adicionales</h2>
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Monto</TableHead>
                          <TableHead>Motivo</TableHead>
                          <TableHead>Registrado por</TableHead>
                          <TableHead>Referencia</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detail.movements.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="text-center text-muted-foreground py-6"
                            >
                              No hay movimientos registrados en esta sesión.
                            </TableCell>
                          </TableRow>
                        )}
                        {detail.movements.map((movement) => (
                          <TableRow key={movement.id} className="hover:bg-accent/40">
                            <TableCell className="whitespace-nowrap">
                              {new Date(movement.registeredAt).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  movement.movementType === CashMovementType.INCOME
                                    ? "secondary"
                                    : "outline"
                                }
                              >
                                {movement.movementType === CashMovementType.INCOME
                                  ? "Ingreso"
                                  : "Egreso"}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {movement.movementType === CashMovementType.EXPENSE ? "-" : ""}
                              {PEN.format(movement.amount)}
                            </TableCell>
                            <TableCell className="max-w-[320px] truncate" title={movement.reason}>
                              {movement.reason}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {movement.registeredByName ?? movement.registeredById ?? ""}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {movement.reference ?? "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Cobros de Ventas</h2>
                    <Badge variant="outline" className="gap-1">
                      <Coins className="h-3.5 w-3.5" />
                      {detail.salePayments.length}
                    </Badge>
                  </div>

                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Venta</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Método</TableHead>
                          <TableHead className="text-right">Monto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detail.salePayments.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="text-center text-muted-foreground py-6"
                            >
                              No hay pagos de ventas registrados en esta sesión.
                            </TableCell>
                          </TableRow>
                        )}

                        {detail.salePayments.map((payment) => (
                          <TableRow key={payment.paymentId} className="hover:bg-accent/40">
                            <TableCell className="whitespace-nowrap">
                              <div className="flex items-center gap-1 text-sm">
                                <CalendarClock className="h-3.5 w-3.5 opacity-70" />
                                {new Date(payment.paidAt).toLocaleString()}
                              </div>
                            </TableCell>

                            <TableCell className="max-w-[320px]">
                              <Link
                                href={`/dashboard/pos/sales/history/${payment.saleId}`}
                                className="hover:text-primary transition-colors inline-flex items-center gap-1"
                              >
                                <span className="font-medium">Venta #{payment.saleId}</span>
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Link>
                              <div className="mt-1">
                                {payment.saleDocumentNumber && (
                                  <Badge variant="outline" className="font-normal">
                                    {payment.saleDocumentNumber}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>

                            <TableCell className="text-sm text-muted-foreground">
                              <div className="inline-flex items-center gap-1">
                                <User2 className="h-3.5 w-3.5 opacity-70" />
                                {payment.customerName ?? "Cliente General"}
                              </div>
                            </TableCell>

                            <TableCell className="whitespace-nowrap">
                              {PaymentMethodLabels[payment.paymentMethod]}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {PEN.format(payment.amountPaid)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
</PageSection>
          )}
        </div>
      </PageContainer>
    </DashboardLayoutSection>
  );
}
