"use client";

import { PaymentEntry } from "../_hooks/usePaymentCollector";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PaymentMethod } from "../_types/sale-enums";

interface PaymentTableProps {
  payments: PaymentEntry[];
  onRemove: (id: string) => void;
}

const paymentLabels: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: "Efectivo",
  [PaymentMethod.CREDIT_CARD]: "Tarjeta crédito",
  [PaymentMethod.DEBIT_CARD]: "Tarjeta débito",
  [PaymentMethod.BANK_TRANSFER]: "Transferencia",
  [PaymentMethod.MOBILE_PAYMENT]: "Pago móvil",
  [PaymentMethod.CHECK]: "Cheque",
  [PaymentMethod.OTHER]: "Otro",
};

export default function PaymentTable({ payments, onRemove }: PaymentTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Método</TableHead>
            <TableHead>Monto</TableHead>
            <TableHead>Referencia</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                Aún no hay pagos registrados.
              </TableCell>
            </TableRow>
          )}
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>{paymentLabels[payment.method]}</TableCell>
              <TableCell>S/ {payment.amount.toFixed(2)}</TableCell>
              <TableCell>{payment.reference ?? "—"}</TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" onClick={() => onRemove(payment.id)}>
                  ✕
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
