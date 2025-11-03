"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/context/user-context";
import CashSessionService from "./_service/cash-session.service";
import { CashSessionDetailResponse, CashSessionSummaryResponse } from "./_types/cash-session-response";
import { CashMovementType } from "./_types/cash-session-enums";
import OpenSessionDialog from "./_components/open-session-dialog";
import RegisterMovementDialog from "./_components/register-movement-dialog";
import CloseSessionDialog from "./_components/close-session-dialog";
import { MovementFormValues } from "./_schemas/movement-schema";
import { CloseSessionFormValues } from "./_schemas/close-session-schema";

export default function CurrentCashSessionPage() {
  const { userInfo } = useUser();
  const { toast } = useToast();
  const branchId = userInfo?.selectedBranch?.id ?? 0;
  const userId = userInfo?.userId ?? 0;
  const [detail, setDetail] = useState<CashSessionDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [closingSummary, setClosingSummary] = useState<CashSessionSummaryResponse | null>(null);

  const loadActiveSession = useCallback(async () => {
    try {
      setLoading(true);
      const response = await CashSessionService.getActiveSession(branchId, userId);
      setDetail(response);
      setClosingSummary(null);
    } catch (error: unknown) {
      console.error(error);
      setDetail(null);
      const status =
        typeof error === "object" && error !== null && "response" in error
          ? (error as { response?: { status?: number } }).response?.status
          : undefined;
      if (status !== 404) {
        toast({ title: "No fue posible obtener el estado de caja", variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  }, [branchId, toast, userId]);

  useEffect(() => {
    if (branchId && userId) {
      loadActiveSession();
    }
  }, [branchId, userId, loadActiveSession]);

  const handleOpenSession = useCallback(async (amount: number) => {
    try {
      await CashSessionService.openSession({ branchId, cashierId: userId, openingAmount: amount });
      toast({ title: "Caja abierta", description: "La sesión de caja se creó correctamente" });
      await loadActiveSession();
    } catch (error) {
      console.error(error);
      toast({ title: "No se pudo abrir la caja", variant: "destructive" });
    }
  }, [branchId, userId, toast, loadActiveSession]);

  const handleRegisterMovement = useCallback(async (values: MovementFormValues) => {
    if (!detail) return;
    try {
      await CashSessionService.registerMovement(detail.session.id, {
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
  }, [detail, loadActiveSession, toast, userId]);

  const handleCloseSession = useCallback(async (values: CloseSessionFormValues) => {
    if (!detail) return;
    try {
      const summary = await CashSessionService.closeSession(detail.session.id, values);
      setClosingSummary(summary);
      setDetail(null);
      toast({ title: "Caja cerrada" });
    } catch (error) {
      console.error(error);
      toast({ title: "No se pudo cerrar la caja", variant: "destructive" });
    }
  }, [detail, toast]);

  const totals = useMemo(() => {
    if (!detail) return null;
    return {
      opening: detail.session.openingAmount,
      cashSales: detail.session.totalCashSales,
      incomes: detail.session.totalIncomeMovements,
      expenses: detail.session.totalExpenseMovements,
      expected: detail.session.calculatedClosingAmount,
    };
  }, [detail]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Gestión de caja</h1>
          <p className="text-sm text-muted-foreground">
            Sucursal: {userInfo?.selectedBranch?.name ?? "No asignada"}
          </p>
        </div>
        <div className="flex gap-2">
          <OpenSessionDialog onOpenSession={handleOpenSession} disabled={Boolean(detail)} />
          <RegisterMovementDialog onRegister={handleRegisterMovement} disabled={!detail} />
          <CloseSessionDialog onCloseSession={handleCloseSession} disabled={!detail} />
        </div>
      </div>

      {loading && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">Cargando estado de caja...</CardContent>
        </Card>
      )}

      {!loading && !detail && !closingSummary && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No hay una sesión de caja abierta. Utiliza el botón &quot;Abrir caja&quot; para iniciar una nueva sesión.
          </CardContent>
        </Card>
      )}

      {closingSummary && (
        <Card>
          <CardHeader>
            <CardTitle>Último cierre</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-2">
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Abierta</span>
              <p>{new Date(closingSummary.openedAt).toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Cerrada</span>
              <p>{closingSummary.closedAt ? new Date(closingSummary.closedAt).toLocaleString() : ""}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Calculado</span>
              <p>S/ {closingSummary.calculatedClosingAmount.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Contado</span>
              <p>S/ {(closingSummary.countedClosingAmount ?? 0).toFixed(2)}</p>
            </div>
            <div className="space-y-1 md:col-span-2">
              <span className="text-sm text-muted-foreground">Diferencia</span>
              <p className={closingSummary.differenceAmount && closingSummary.differenceAmount !== 0 ? "text-destructive" : ""}>
                S/ {(closingSummary.differenceAmount ?? 0).toFixed(2)}
              </p>
            </div>
            {closingSummary.notes && (
              <div className="md:col-span-2 space-y-1">
                <span className="text-sm text-muted-foreground">Notas</span>
                <p>{closingSummary.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {detail && totals && (
        <Card>
          <CardHeader>
            <CardTitle>Resumen de sesión</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <SummaryItem label="Apertura" value={totals.opening} />
              <SummaryItem label="Ventas en efectivo" value={totals.cashSales} />
              <SummaryItem label="Ingresos adicionales" value={totals.incomes} />
              <SummaryItem label="Egresos" value={totals.expenses} negative />
              <SummaryItem label="Total esperado" value={totals.expected} highlight />
            </div>

            <Separator />

            <div>
              <h2 className="text-lg font-semibold mb-2">Movimientos adicionales</h2>
              <Table>
                <TableHeader>
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
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No hay movimientos registrados en esta sesión.
                      </TableCell>
                    </TableRow>
                  )}
                  {detail.movements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>{new Date(movement.registeredAt).toLocaleString()}</TableCell>
                      <TableCell>
                        {movement.movementType === CashMovementType.INCOME ? "Ingreso" : "Egreso"}
                      </TableCell>
                      <TableCell>
                        {movement.movementType === CashMovementType.EXPENSE ? "-" : ""}S/ {movement.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>{movement.reason}</TableCell>
                      <TableCell>{movement.registeredByName ?? movement.registeredById ?? ""}</TableCell>
                      <TableCell>{movement.reference ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface SummaryItemProps {
  label: string;
  value: number;
  negative?: boolean;
  highlight?: boolean;
}

function SummaryItem({ label, value, negative, highlight }: SummaryItemProps) {
  return (
    <div className={`rounded-md border p-4 ${highlight ? "bg-muted" : ""}`}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold ${negative ? "text-destructive" : ""}`}>
        {negative && value !== 0 ? "-" : ""}S/ {Math.abs(value).toFixed(2)}
      </p>
    </div>
  );
}
