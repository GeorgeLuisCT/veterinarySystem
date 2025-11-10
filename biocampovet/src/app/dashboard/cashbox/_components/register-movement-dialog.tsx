// app/dashboard/pos/_components/register-movement-dialog.tsx
"use client";

import { useState } from "react";
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
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { useForm } from "react-hook-form";
import { movementSchema, MovementFormValues } from "../_schemas/movement-schema";
import { CashMovementType } from "../_types/cash-session-enums";

interface RegisterMovementDialogProps {
  onRegister: (data: MovementFormValues) => Promise<void>;
  disabled?: boolean;
}

const MOVEMENT_OPTIONS: { value: CashMovementType; label: string }[] = [
  { value: CashMovementType.INCOME, label: "Ingreso" },
  { value: CashMovementType.EXPENSE, label: "Egreso" },
];

export default function RegisterMovementDialog({ onRegister, disabled }: RegisterMovementDialogProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<MovementFormValues>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      movementType: CashMovementType.INCOME,
      amount: 0,
      reason: "",
      reference: "",
    },
    mode: "onChange",
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onRegister({
      ...values,
      reason: values.reason.trim(),
      reference: values.reference?.trim() || "",
    });
    form.reset({
      movementType: CashMovementType.INCOME,
      amount: 0,
      reason: "",
      reference: "",
    });
    setOpen(false);
  });

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" disabled={disabled}>Registrar movimiento</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Movimiento de caja</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="movementType"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelSelect
                      id="movementType"
                      label="Tipo"
                      value={field.value}
                      onValueChange={(v) => field.onChange(v as CashMovementType)}
                      options={MOVEMENT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelInput
                      id="reason"
                      label="Motivo"
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
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelInput
                      id="reference"
                      label="Referencia (opcional)"
                      value={field.value || ""}
                      onChange={(v) => field.onChange(v)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset({
                    movementType: CashMovementType.INCOME,
                    amount: 0,
                    reason: "",
                    reference: "",
                  });
                  setOpen(false);
                }}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
