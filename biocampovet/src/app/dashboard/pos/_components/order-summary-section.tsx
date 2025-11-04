// app/dashboard/pos/_components/order-summary-section.tsx
"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import TotalsSummary from "./totals-summary";
import AddPaymentDialog from "./add-payment-dialog";
import PaymentTable from "./payment-table";
import { Button } from "@/components/ui/button";
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
  isEditing?: boolean; // Prop para saber si estamos editando
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
  isEditing = false, // Valor por defecto
}: Props) {
  return (
    <Card className="lg:sticky lg:top-24">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Resumen del pedido</CardTitle>
        <p className="text-xs text-muted-foreground">Revisa los montos antes de finalizar la venta.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <TotalsSummary
          subtotal={totals.subtotal}
          taxTotal={totals.taxTotal}
          grandTotal={totals.grandTotal}
          paidAmount={paymentTotals.totalPaid}
        />
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Pagos registrados</span>
            {!isFinalized && (
              <AddPaymentDialog
                totalDue={Math.max(totalDue - paymentTotals.totalPaid, 0)}
                onAdd={onAddPayment}
                // Deshabilitar si se está procesando otra acción
                disabled={submitting}
              />
            )}
          </div>

          {paymentsErrorMessage && <p className="text-sm text-destructive">{paymentsErrorMessage}</p>}

          {isFinalized && payments.length === 0 && (
            <p className="text-xs text-muted-foreground">Esta venta no tiene pagos registrados.</p>
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
        <Button
          type="button"
          variant="outline"
          onClick={onSaveDraft}
          // Deshabilitado si: procesando, finalizada, o editando (auto-guardado)
          disabled={submitting || isFinalized || isEditing}
        >
          {isEditing ? "Guardado automático" : "Guardar borrador"}
        </Button>
        <Button
          type="submit"
          disabled={submitting || isFinalized}
        >
          {submitting ? "Procesando..." : isFinalized ? "Venta finalizada" : "Finalizar venta"}
        </Button>
      </CardFooter>
    </Card>
  );
}