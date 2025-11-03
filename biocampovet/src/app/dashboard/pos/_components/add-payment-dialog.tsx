"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PaymentMethod } from "../_types/sale-enums";
import { SalePaymentRequest } from "../_types/sale-request";

interface AddPaymentDialogProps {
  totalDue: number;
  onAdd: (payment: SalePaymentRequest) => void;
}

const paymentOptions: { value: PaymentMethod; label: string }[] = [
  { value: PaymentMethod.CASH, label: "Efectivo" },
  { value: PaymentMethod.CREDIT_CARD, label: "Tarjeta crédito" },
  { value: PaymentMethod.DEBIT_CARD, label: "Tarjeta débito" },
  { value: PaymentMethod.BANK_TRANSFER, label: "Transferencia" },
  { value: PaymentMethod.MOBILE_PAYMENT, label: "Pago móvil" },
  { value: PaymentMethod.CHECK, label: "Cheque" },
  { value: PaymentMethod.OTHER, label: "Otro" },
];

export default function AddPaymentDialog({ totalDue, onAdd }: AddPaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [amount, setAmount] = useState<number>(totalDue);
  const [reference, setReference] = useState<string>("");

  const handleConfirm = () => {
    if (amount <= 0) return;
    onAdd({
      amount,
      method,
      reference: reference || undefined,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Agregar pago</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <span className="text-sm font-medium">Método de pago</span>
            <Select value={method} onValueChange={(value) => setMethod(value as PaymentMethod)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona método" />
              </SelectTrigger>
              <SelectContent>
                {paymentOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-medium">Monto</span>
            <Input
              type="number"
              min={0.01}
              step={0.01}
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value))}
            />
          </div>
          <div className="space-y-1">
            <span className="text-sm font-medium">Referencia</span>
            <Input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Opcional" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={amount <= 0}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
