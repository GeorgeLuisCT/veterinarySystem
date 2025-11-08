"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { closeSessionSchema, CloseSessionFormValues } from "../_schemas/close-session-schema";
import { CashboxPaymentBreakdownResponse } from "../_types/cash-session-response";
import { CashboxTransferChannel, TreasuryAccountResponse } from "@/app/dashboard/finance/_types/treasury-account";
import { useToast } from "@/hooks/use-toast";
import { CloseCashSessionRequest } from "../_types/cash-session-request";

interface CloseSessionDialogProps {
  onCloseSession: (payload: CloseCashSessionRequest) => Promise<void>;
  disabled?: boolean;
  breakdown: CashboxPaymentBreakdownResponse[];
  accounts: TreasuryAccountResponse[];
}

const CHANNEL_LABELS: Record<CashboxTransferChannel, string> = {
  [CashboxTransferChannel.CASH]: "Efectivo",
  [CashboxTransferChannel.YAPE]: "Yape",
  [CashboxTransferChannel.PLIN]: "Plin",
  [CashboxTransferChannel.CARD]: "Tarjeta",
  [CashboxTransferChannel.OTHER]: "Otros",
};

export default function CloseSessionDialog({ onCloseSession, disabled, breakdown, accounts }: CloseSessionDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [allocations, setAllocations] = useState<Record<CashboxTransferChannel, number | undefined>>({});

  const form = useForm<CloseSessionFormValues>({
    resolver: zodResolver(closeSessionSchema),
    defaultValues: { countedClosingAmount: 0, notes: "" },
  });

  useEffect(() => {
    if (!open) return;
    setAllocations((prev) => {
      const next = { ...prev };
      breakdown.forEach((item) => {
        if (!next[item.channel]) {
          next[item.channel] = accounts[0]?.id;
        }
      });
      return next;
    });
  }, [open, breakdown, accounts]);

  const actionableBreakdown = useMemo(
    () => breakdown.filter((item) => item.amount > 0),
    [breakdown]
  );

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!accounts.length) {
      toast({ title: "No hay cuentas disponibles", variant: "destructive" });
      return;
    }

    const transfers = actionableBreakdown.map((item) => ({
      channel: item.channel,
      treasuryAccountId: allocations[item.channel],
    }));

    const missing = transfers.some((transfer) => !transfer.treasuryAccountId);
    if (missing) {
      toast({
        title: "Selecciona una cuenta",
        description: "Cada método con monto debe transferirse a una cuenta de tesorería.",
        variant: "destructive",
      });
      return;
    }

    await onCloseSession({
      countedClosingAmount: values.countedClosingAmount,
      notes: values.notes,
      paymentTransfers: transfers as { channel: CashboxTransferChannel; treasuryAccountId: number }[],
    });
    form.reset();
    setOpen(false);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" disabled={disabled || !accounts.length}>
          Cerrar caja
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Cierre de caja</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Monto contado</Label>
              <Input type="number" step={0.01} min={0} {...form.register("countedClosingAmount", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea rows={3} {...form.register("notes")} />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Transferir montos por método</p>
            <div className="space-y-2 rounded-lg border p-3">
              {breakdown.map((item) => (
                <div key={item.channel} className="grid gap-2 sm:grid-cols-[1fr_180px] sm:items-center">
                  <div>
                    <p className="text-sm font-semibold">{CHANNEL_LABELS[item.channel]}</p>
                    <p className="text-sm text-muted-foreground">Total: {item.amount.toFixed(2)}</p>
                  </div>
                  <Select
                    value={allocations[item.channel] ? String(allocations[item.channel]) : undefined}
                    onValueChange={(value) =>
                      setAllocations((prev) => ({ ...prev, [item.channel]: Number(value) }))
                    }
                    disabled={item.amount <= 0 || !accounts.length}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona cuenta" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={String(account.id)}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset();
                setOpen(false);
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!accounts.length}>
              Confirmar cierre
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
