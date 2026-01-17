"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { useToast } from "@/hooks/use-toast";
import { CloseCashSessionRequest } from "../_types/cash-session-request";
import { closeSessionSchema, CloseSessionFormValues } from "../_schemas/close-session-schema";
import { CashboxPaymentBreakdownResponse } from "../_types/cash-session-response";
import { TreasuryAccountResponse } from "@/app/dashboard/finance/_types/treasury-account";
import { PaymentMethod, PaymentMethodLabels } from "../../pos/_types/sale-enums";

type Props = {
  onCloseSession: (payload: CloseCashSessionRequest) => Promise<void>;
  disabled?: boolean;
  breakdown: CashboxPaymentBreakdownResponse[];
  accounts: TreasuryAccountResponse[];
};

const PEN = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
});

export default function CloseSessionDialog({
  onCloseSession,
  disabled,
  breakdown,
  accounts,
}: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const form = useForm<CloseSessionFormValues>({
    resolver: zodResolver(closeSessionSchema),
    defaultValues: { countedClosingAmount: 0, notes: "" },
    mode: "onChange",
  });

  const actionableBreakdown = useMemo(
    () => breakdown.filter((b) => b.amount > 0),
    [breakdown]
  );

  const [allocations, setAllocations] = useState<Partial<Record<PaymentMethod, number>>>({});

  useEffect(() => {
    if (!open) return;
    const initial: Partial<Record<PaymentMethod, number>> = {};
    actionableBreakdown.forEach((b) => {
      initial[b.paymentMethod] = accounts[0]?.id;
    });
    setAllocations(initial);
    form.reset({ countedClosingAmount: 0, notes: "" });
  }, [open, actionableBreakdown, accounts, form]);

  const accountOptions = useMemo(
    () => accounts.map((a) => ({ value: String(a.id), label: a.name })),
    [accounts]
  );

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!accounts.length) {
      toast({ title: "No hay cuentas disponibles", variant: "destructive" });
      return;
    }

    const transfers = actionableBreakdown.map((item) => ({
      paymentMethod: item.paymentMethod,
      treasuryAccountId: allocations[item.paymentMethod],
    }));

    if (transfers.some((t) => !t.treasuryAccountId)) {
      toast({
        title: "Selecciona una cuenta",
        description: "Cada método con monto debe transferirse a una cuenta de tesorería.",
        variant: "destructive",
      });
      return;
    }

    await onCloseSession({
      countedClosingAmount: values.countedClosingAmount,
      notes: values.notes?.trim() || undefined,
      paymentTransfers: transfers.map((t) => ({
        paymentMethod: t.paymentMethod,
        treasuryAccountId: t.treasuryAccountId as number,
      })),
    });

    setOpen(false);
  });

  const isSubmitting = form.formState.isSubmitting;

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

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <FormField
              control={form.control}
              name="countedClosingAmount"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelInput
                      id="countedClosingAmount"
                      label="Monto contado"
                      type="number"
                      step="0.01"
                      value={Number.isNaN(field.value as number) ? "" : String(field.value)}
                      onChange={(v) => field.onChange(v === "" ? 0 : Number(v))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelInput
                      id="notes"
                      label="Notas (opcional)"
                      value={field.value || ""}
                      onChange={(v) => field.onChange(v)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <p className="text-sm font-medium">Transferir montos por método</p>
              <div className="space-y-3 rounded-2xl border p-3">
                {actionableBreakdown.length === 0 && (
                  <p className="text-sm text-muted-foreground">No hay montos por transferir.</p>
                )}

                {actionableBreakdown.map((item) => (
                  <div
                    key={`${item.paymentMethod}-${item.amount}`}
                    className="grid gap-2 sm:grid-cols-[1fr_220px] sm:items-center"
                  >
                    <div>
                      <p className="text-sm font-semibold">
                        {PaymentMethodLabels[item.paymentMethod]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Total: {PEN.format(item.amount)}
                      </p>
                    </div>

                    <FloatingLabelSelect
                      id={`alloc-${item.paymentMethod}`}
                      label="Cuenta de tesorería"
                      value={
                        allocations[item.paymentMethod]
                          ? String(allocations[item.paymentMethod])
                          : ""
                      }
                      onValueChange={(v) =>
                        setAllocations((prev) => ({
                          ...prev,
                          [item.paymentMethod]: v ? Number(v) : undefined,
                        }))
                      }
                      options={accountOptions}
                      disabled={!accounts.length}
                    />
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset({ countedClosingAmount: 0, notes: "" });
                  setOpen(false);
                }}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || !accounts.length}>
                {isSubmitting ? "Confirmando..." : "Confirmar cierre"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}