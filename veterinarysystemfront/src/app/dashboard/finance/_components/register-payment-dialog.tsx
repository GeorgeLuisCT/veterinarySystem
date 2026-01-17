// app/dashboard/finance/_components/register-payment-dialog.tsx
"use client";
import { useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { FloatingLabelDateInput } from "@/components/floating-label-date-input";
import { TreasuryAccountResponse } from "../_types/treasury-account";
import { RegisterPaymentFormValues, registerPaymentSchema } from "../_schemas/payment-schema";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  outstanding: number;
  accounts: TreasuryAccountResponse[];
  onSubmit: (values: RegisterPaymentFormValues) => Promise<void> | void;
};

const PEN = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", minimumFractionDigits: 2 });

function toLocalDateTimeInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export default function RegisterPaymentDialog({ open, onOpenChange, outstanding, accounts, onSubmit }: Props) {
  const form = useForm<RegisterPaymentFormValues>({
    resolver: zodResolver(registerPaymentSchema),
    defaultValues: {
      amount: 0,
      treasuryAccountId: undefined,
      paymentDateTime: toLocalDateTimeInputValue(new Date()),
      notes: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (open) {
      form.reset({
        amount: Number(outstanding.toFixed(2)),
        treasuryAccountId: accounts[0]?.id,
        paymentDateTime: toLocalDateTimeInputValue(new Date()),
        notes: "",
      });
    }
  }, [open, outstanding, accounts, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit({
      amount: values.amount,
      treasuryAccountId: values.treasuryAccountId,
      paymentDateTime: values.paymentDateTime,
      notes: values.notes?.trim() || undefined,
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
          <DialogDescription>Saldo pendiente: {PEN.format(outstanding)}.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelInput
                      id="amount"
                      label="Monto"
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
              name="treasuryAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelSelect
                      id="treasuryAccountId"
                      label="Cuenta de tesorería"
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}
                      options={accounts.map((a) => ({ value: String(a.id), label: a.name }))}
                      emptyMessage="Sin cuentas"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentDateTime"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelDateInput
                      id="paymentDateTime"
                      label="Fecha y hora"
                      value={field.value}
                      onChange={(v) => field.onChange(v)}
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
                    <FloatingLabelInput id="notes" label="Notas (opcional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Registrando..." : "Registrar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
