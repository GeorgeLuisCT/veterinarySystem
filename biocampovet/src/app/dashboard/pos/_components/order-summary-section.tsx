// app/dashboard/pos/_components/order-summary-section.tsx
"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import TotalsSummary from "./totals-summary";
import AddPaymentDialog from "./add-payment-dialog";
import PaymentTable from "./payment-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  ReceiptText,
  PlusCircle,
  Lock,
  Save,
  CircleDollarSign,
} from "lucide-react";
import { PaymentEntry } from "../_hooks/usePaymentCollector";

type Totals = {
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
};

type PaymentTotals = {
  totalPaid: number;
};

type Props = {
  isFinalized: boolean;
  submitting: boolean;
  totals: Totals;
  paymentTotals: PaymentTotals;
  payments: PaymentEntry[];
  totalDue: number;
  onAddPayment: (payment: Omit<PaymentEntry, "id" | "paymentId">) => void;
  onRemovePayment: (id: string) => void;
  onSaveDraft: () => void;
  paymentsErrorMessage?: string;
  isEditing?: boolean;
};

export default function OrderSummarySection({
  isFinalized,
  submitting,
  totals,
  paymentTotals,
  payments,
  totalDue,
  onAddPayment,
  onRemovePayment,
  onSaveDraft,
  paymentsErrorMessage,
  isEditing = false,
}: Props) {
  const netDue = Math.max(totalDue - paymentTotals.totalPaid, 0);
  const paidPct = totals.grandTotal > 0 ? Math.min((paymentTotals.totalPaid / totals.grandTotal) * 100, 100) : 0;

  return (
    <Card className="surface-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary"
            >
              <ReceiptText className="h-4 w-4" />
            </span>
            <div>
              <CardTitle className="text-base font-semibold leading-tight">Resumen del pedido</CardTitle>
              <p className="text-xs text-muted-foreground">Revisa los montos antes de finalizar la venta.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isFinalized ? (
              <Badge variant="secondary" className="gap-1">
                <Lock className="h-3.5 w-3.5" />
                <span className="text-[11px] tracking-wide">Bloqueado</span>
              </Badge>
            ) : isEditing ? (
              <Badge variant="outline" className="gap-1">
                <Save className="h-3.5 w-3.5" />
                <span className="text-[11px] tracking-wide">Guardado automático</span>
              </Badge>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Totales principales */}
        <TotalsSummary
          subtotal={totals.subtotal}
          taxTotal={totals.taxTotal}
          grandTotal={totals.grandTotal}
          paidAmount={paymentTotals.totalPaid}
        />

        {/* Estado de pagos */}
        <div className="space-y-3 rounded-xl border p-3 bg-background/50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <CircleDollarSign className="h-3.5 w-3.5" />
                <span className="text-[11px] tracking-wide">
                  Pagado: S/ {paymentTotals.totalPaid.toFixed(2)}
                </span>
              </Badge>
              <Badge variant={netDue > 0 ? "destructive" : "outline"} className="gap-1">
                <span className="text-[11px] tracking-wide">
                  Pendiente: S/ {netDue.toFixed(2)}
                </span>
              </Badge>
            </div>
          </div>

          <div className="space-y-1">
            <Progress value={paidPct} aria-label="Progreso de pago" />
            <p className="text-[11px] text-muted-foreground">
              {paidPct.toFixed(0)}% cubierto del total
            </p>
          </div>
          <div className="w-full flex justify-center">
            {!isFinalized && (
              <AddPaymentDialog
                totalDue={netDue}
                onAdd={onAddPayment}
                disabled={submitting}
              />
            )}
          </div>
        </div>

        <Separator />

        {/* Tabla de pagos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Pagos registrados</span>
          </div>

          {paymentsErrorMessage && (
            <p className="text-sm text-destructive">{paymentsErrorMessage}</p>
          )}

          {isFinalized && payments.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Esta venta no tiene pagos registrados.
            </p>
          )}

          <PaymentTable
            payments={payments}
            onRemove={(id) => {
              if (!isFinalized && !submitting) onRemovePayment(id);
            }}
          />
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
        <div className="flex w-full items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onSaveDraft}
            disabled={submitting || isFinalized || isEditing}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isEditing ? "Guardado automático" : "Guardar borrador"}
          </Button>

          <Button type="submit" disabled={submitting || isFinalized} className="gap-2">
            {isFinalized ? (
              <>
                <Lock className="h-4 w-4" />
                Venta finalizada
              </>
            ) : submitting ? (
              <>Procesando…</>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Finalizar venta
              </>
            )}
          </Button>
        </div>

        {/* Nota de accesibilidad/estado */}
        <p className="text-[11px] text-muted-foreground">
          {isFinalized
            ? "La venta está bloqueada; no se permiten cambios."
            : "Puedes seguir registrando pagos o guardar como borrador."}
        </p>
      </CardFooter>
    </Card>
  );
}
