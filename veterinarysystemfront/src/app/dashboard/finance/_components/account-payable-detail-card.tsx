// app/dashboard/finance/_components/account-payable-detail-card.tsx
"use client";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { AccountPayableDetail, AccountPayableStatus } from "../_types/account-payable";

const PEN = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", minimumFractionDigits: 2 });
const DATE_TIME_FMT = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short" });

type Props = {
  detail: AccountPayableDetail | null;
  loading: boolean;
  outstanding: number;
  onRegisterPayment: () => void;
  canRegisterPayment: boolean;
};

export default function AccountPayableDetailCard({ detail, loading, outstanding, onRegisterPayment, canRegisterPayment }: Props) {
  return (
    <div className="space-y-4">
      {loading && <p className="text-center text-muted-foreground">Cargando detalle...</p>}
      {!loading && !detail && <p className="text-center text-muted-foreground">Selecciona una cuenta por pagar.</p>}
      {detail && !loading && (
        <>
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Descripción</p>
                <p className="font-medium">{detail.description}</p>
              </div>
              <Badge variant="outline">
                {detail.status === AccountPayableStatus.PAID ? "Pagada" : detail.status === AccountPayableStatus.PARTIALLY_PAID ? "Parcial" : "Pendiente"}
              </Badge>
            </div>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Proveedor</p>
                <p>{detail.supplierName || "No asignado"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Emisión</p>
                <p>{DATE_TIME_FMT.format(new Date(detail.issueDateTime))}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total</p>
                <p className="font-semibold">{PEN.format(detail.totalAmount)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Pendiente</p>
                <p className="font-semibold text-warning-strong">{PEN.format(outstanding)}</p>
              </div>
            </div>
            {detail.status !== AccountPayableStatus.PAID && (
              <Button className="w-full" onClick={onRegisterPayment} disabled={!canRegisterPayment}>
                Registrar pago
              </Button>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <p className="font-medium">Historial de pagos</p>
              <span className="text-sm text-muted-foreground">{detail.payments.length} registros</span>
            </div>
            <Separator className="my-3" />
            <ScrollArea className="h-[280px]">
              {detail.payments.length === 0 && (
                <p className="text-center text-sm text-muted-foreground">Aún no hay pagos registrados.</p>
              )}
              <div className="space-y-3">
                {detail.payments.map((p, idx) => {
                  const key = `${p.id ?? "noid"}-${p.paymentDateTime}-${idx}`;
                  return (
                    <div key={key} className="rounded-lg border p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span>{DATE_TIME_FMT.format(new Date(p.paymentDateTime))}</span>
                        <span className="font-semibold">{PEN.format(p.amount)}</span>
                      </div>
                      <div className="text-muted-foreground">
                        {p.treasuryAccountName || `Cuenta #${p.treasuryAccountId}`}
                      </div>
                      {p.notes && <p className="text-xs text-muted-foreground">{p.notes}</p>}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  );
}
