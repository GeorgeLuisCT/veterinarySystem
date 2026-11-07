// app/dashboard/pos/_components/add-payment-dialog.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Banknote,
  CircleDollarSign,
  CreditCard,
  Landmark,
  MoreHorizontal,
  Receipt,
  Smartphone,
} from "lucide-react";
import { useEffect, useState } from "react";
import { PaymentMethod } from "../_types/sale-enums";
import { SalePaymentRequest } from "../_types/sale-request";

interface AddPaymentDialogProps {
  totalDue: number;
  onAdd: (payment: SalePaymentRequest) => void;
  /** Opcional: permite pasar tu propio trigger (por ejemplo, un botón en otra parte del UI). */
  trigger?: React.ReactNode;
  /** Opcional: deshabilitar apertura/acción desde afuera si lo necesitas */
  disabled?: boolean;
}

const paymentOptions: { value: PaymentMethod; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: PaymentMethod.CASH, label: "Efectivo", icon: Banknote },
  { value: PaymentMethod.CREDIT_CARD, label: "Tarjeta crédito", icon: CreditCard },
  { value: PaymentMethod.DEBIT_CARD, label: "Tarjeta débito", icon: CreditCard },
  { value: PaymentMethod.YAPE, label: "Yape", icon: Smartphone },
  { value: PaymentMethod.PLIN, label: "Plin", icon: Smartphone },
  { value: PaymentMethod.BANK_TRANSFER, label: "Transferencia", icon: Landmark },
  { value: PaymentMethod.MOBILE_PAYMENT, label: "Pago móvil", icon: Smartphone },
  { value: PaymentMethod.CHECK, label: "Cheque", icon: Receipt },
  { value: PaymentMethod.OTHER, label: "Otro", icon: MoreHorizontal },
];

const PEN = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", minimumFractionDigits: 2 });

export default function AddPaymentDialog({ totalDue, onAdd, trigger, disabled }: AddPaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [amount, setAmount] = useState<number>(totalDue);
  const [reference, setReference] = useState<string>("");

  // Reset amable cada vez que se abre
  useEffect(() => {
    if (open) {
      setMethod(PaymentMethod.CASH);
      setAmount(totalDue);
      setReference("");
    }
  }, [open, totalDue]);

  const overpay = Math.max(amount - totalDue, 0);
  const valid = amount > 0;

  const handleConfirm = () => {
    if (!valid) return;
    onAdd({
      amount,
      method,
      reference: reference || undefined,
    });
    setOpen(false);
  };

  const quickSetters = [
    { label: "Restante", value: totalDue },
    { label: "Mitad", value: Math.max(totalDue / 2, 0.01) },
    { label: "Exacto", value: totalDue },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          <span className={cn(disabled && "pointer-events-none opacity-60")}>{trigger}</span>
        ) : (
          <Button type="button" variant="secondary" disabled={disabled} className="gap-2 w-full">
            <CircleDollarSign className="h-4 w-4" />
            Agregar pago
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="surface-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              aria-hidden
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"
            >
              <CircleDollarSign className="h-4 w-4" />
            </span>
            Registrar pago
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Método de pago */}
          <div className="space-y-1.5">
            <span className="text-sm font-medium">Método de pago</span>
            <Select
              value={method}
              onValueChange={(value) => setMethod(value as PaymentMethod)}
            >
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2 w-full">
                  <SelectValue placeholder="Selecciona método" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {paymentOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className="h-4 w-4 opacity-80" />
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Monto */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Monto</span>
              <div className="flex items-center gap-1">
                {quickSetters.map(({ label, value }) => (
                  <Badge
                    key={label}
                    role="button"
                    tabIndex={0}
                    onClick={() => setAmount(Number(value.toFixed(2)))}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setAmount(Number(value.toFixed(2)))}
                    className="cursor-pointer select-none text-[11px]"
                    variant={label === "Restante" ? "secondary" : "outline"}
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            </div>
            <Input
              inputMode="decimal"
              type="number"
              min={0.01}
              step={0.01}
              value={Number.isFinite(amount) ? amount : 0}
              onChange={(e) => setAmount(Number(e.target.value))}
              onFocus={(e) => e.currentTarget.select()}
            />
            <div className="text-xs text-muted-foreground">
              Pendiente: <strong>{PEN.format(totalDue)}</strong> · Ingresado:{" "}
              <strong>{PEN.format(Number.isFinite(amount) ? amount : 0)}</strong>
              {overpay > 0 && (
                <>
                  {" "}- Vuelto: <strong>{PEN.format(overpay)}</strong>
                </>
              )}
            </div>
          </div>

          {/* Referencia */}
          <div className="space-y-1.5">
            <span className="text-sm font-medium">Referencia</span>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Opcional (voucher, operación, últimos 4 dígitos, etc.)"
              maxLength={60}
            />
          </div>

          <Separator />

          {/* Resumen breve */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="outline" className="gap-1">
              Total: {PEN.format(totalDue)}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              A registrar: {PEN.format(Number.isFinite(amount) ? amount : 0)}
            </Badge>
            {overpay > 0 && (
              <Badge variant="outline" className="gap-1">
                Vuelto: {PEN.format(overpay)}
              </Badge>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!valid}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
