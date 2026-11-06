// app/dashboard/pos/_components/current-cash-session-page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/context/user-context";

import DashboardLayoutSection from "../../dashboard-layout-section";

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

import OpenSessionDialog from "../_components/open-session-dialog";
import RegisterMovementDialog from "../_components/register-movement-dialog";
import CloseSessionDialog from "../_components/close-session-dialog";

import TreasuryAccountService from "../../finance/_services/treasury-account-service";
import { TreasuryAccountResponse } from "../../finance/_types/treasury-account";

import CashSessionService from "../_service/cash-session.service";
import {
  CashboxPaymentBreakdownResponse,
  CashSessionDetailResponse,
  CashSessionSummaryResponse,
} from "../_types/cash-session-response";
import { CloseCashSessionRequest } from "../_types/cash-session-request";
import { CashMovementType } from "../_types/cash-session-enums";
import { PaymentMethodLabels } from "../../pos/_types/sale-enums";
import { MovementFormValues } from "../_schemas/movement-schema";

import { Wallet, ArrowUpRight, ArrowDownRight, Coins, Calculator, Receipt, ExternalLink, CalendarClock, User2 } from "lucide-react";
import { PageContainer } from "@/components/page/page-container";

import { PageHeader } from "@/components/page/page-header";
import { PageSection } from "@/components/page/page-section";
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
        "rounded-lg border p-4 h-full",
        highlight ? "bg-primary/5 border-primary/30" : "bg-card/60",
        "shadow-sm",
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
    <div className="rounded-lg border p-4 h-full bg-card/60 shadow-sm md:row-span-2">
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

const PEN = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
});

export default function CurrentCashSessionPage() {
  const { userInfo } = useUser();
  const { toast } = useToast();

  const branchId = userInfo?.selectedBranch?.id ?? 0;
  const userId = userInfo?.userId ?? 0;

  const [detail, setDetail] = useState<CashSessionDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [closingSummary, setClosingSummary] = useState<CashSessionSummaryResponse | null>(null);
  const [treasuryAccounts, setTreasuryAccounts] = useState<TreasuryAccountResponse[]>([]);

  const loadActiveSession = useCallback(async () => {
    try {
      setLoading(true);
      const response = await CashSessionService.getActiveSession(branchId);
      setDetail(response.open ? response : null);
      setClosingSummary(null);
    } catch (error) {
      console.error(error);
      setDetail(null);
      toast({ title: "No fue posible obtener el estado de caja", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [branchId, toast]);

  useEffect(() => {
    if (branchId) {
      loadActiveSession();
    }
  }, [branchId, loadActiveSession]);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const data = await TreasuryAccountService.list();
        setTreasuryAccounts(data);
      } catch (error) {
        console.error(error);
        toast({ title: "No se pudieron cargar las cuentas de tesorería", variant: "destructive" });
      }
    };
    fetchAccounts();
  }, [toast]);

  const handleOpenSession = useCallback(
    async (amount: number) => {
      try {
        await CashSessionService.openSession({
          branchId,
          cashierId: userId,
          openingAmount: amount,
        });
        toast({ title: "Caja abierta", description: "La sesión de caja se creó correctamente" });
        await loadActiveSession();
      } catch (error) {
        console.error(error);
        toast({ title: "No se pudo abrir la caja", variant: "destructive" });
      }
    },
    [branchId, userId, toast, loadActiveSession]
  );

  const handleRegisterMovement = useCallback(
    async (values: MovementFormValues) => {
      if (!detail) return;
      try {
        await CashSessionService.registerMovement(detail.session!.id, {
          movementType: values.movementType,
          amount: values.amount,
          reason: values.reason,
          reference: values.reference,
          registeredById: userId,
        });
        toast({ title: "Movimiento registrado" });
        await loadActiveSession();
      } catch (error) {
        console.error(error);
        toast({ title: "Error al registrar movimiento", variant: "destructive" });
      }
    },
    [detail, loadActiveSession, toast, userId]
  );

  const handleCloseSession = useCallback(
    async (values: CloseCashSessionRequest) => {
      if (!detail) return;
      try {
        const summary = await CashSessionService.closeSession(detail.session!.id, values);
        setClosingSummary(summary);
        setDetail(null);
        toast({ title: "Caja cerrada" });
      } catch (error) {
        console.error(error);
        toast({ title: "No se pudo cerrar la caja", variant: "destructive" });
      }
    },
    [detail, toast]
  );

  const totals = useMemo(() => {
    if (!detail) return null;
    return {
      opening: detail.session!.openingAmount,
      sales: detail.session!.totalSales,
      incomes: detail.session!.totalIncomeMovements,
      expenses: detail.session!.totalExpenseMovements,
      expected: detail.session!.calculatedClosingAmount,
    };
  }, [detail]);

  return (
    <DashboardLayoutSection>
      <PageContainer>
        <div className="space-y-4">
          <PageHeader
            title="Gestión de caja"
            actions={
              <>
                <div className="flex gap-2">
                  <OpenSessionDialog onOpenSession={handleOpenSession} disabled={Boolean(detail)} />
                  <RegisterMovementDialog onRegister={handleRegisterMovement} disabled={!detail} />
                  <CloseSessionDialog
                    onCloseSession={handleCloseSession}
                    disabled={!detail || treasuryAccounts.length === 0}
                    breakdown={detail?.paymentBreakdown ?? []}
                    accounts={treasuryAccounts}
                  />
                </div>
              </>
            }
          />

          {loading && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Cargando estado de caja…
              </CardContent>
            </Card>
          )}

          {!loading && !detail && !closingSummary && (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center">
                <p className="text-muted-foreground">
                  No hay una sesión de caja abierta. Usa{" "}
                  <span className="font-medium">“Abrir caja”</span> para iniciar.
                </p>
              </CardContent>
            </Card>
          )}

          {closingSummary && (
            <PageSection title="Último cierre">
<div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Abierta</p>
                  <p className="font-medium">
                    {new Date(closingSummary.openedAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cerrada</p>
                  <p className="font-medium">
                    {closingSummary.closedAt
                      ? new Date(closingSummary.closedAt).toLocaleString()
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Calculado</p>
                  <p className="font-medium">
                    {PEN.format(closingSummary.calculatedClosingAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contado</p>
                  <p className="font-medium">
                    {PEN.format(closingSummary.countedClosingAmount ?? 0)}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-sm text-muted-foreground">Diferencia</p>
                  <p
                    className={`font-semibold ${closingSummary.differenceAmount ? "text-destructive" : ""}`}
                  >
                    {PEN.format(closingSummary.differenceAmount ?? 0)}
                  </p>
                </div>
                {closingSummary.notes && (
                  <div className="sm:col-span-2">
                    <p className="text-sm text-muted-foreground">Notas</p>
                    <p className="font-normal">{closingSummary.notes}</p>
                  </div>
                )}
              </div>
</PageSection>
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
                    label="Total esperado"
                    value={totals.expected}
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
