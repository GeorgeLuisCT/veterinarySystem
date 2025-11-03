"use client";

import { useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onRegister(values);
    form.reset({ movementType: CashMovementType.INCOME, amount: 0, reason: "", reference: "" });
    setOpen(false);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" disabled={disabled}>
          Registrar movimiento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Movimiento de caja</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo</label>
              <Select
                value={form.watch("movementType")}
                onValueChange={(value) => form.setValue("movementType", value as CashMovementType)}
              >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {MOVEMENT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Monto</label>
            <Input
              type="number"
              min={0.01}
              step={0.01}
              {...form.register("amount", { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Motivo</label>
            <Input {...form.register("reason")} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Referencia (opcional)</label>
            <Input {...form.register("reference")} />
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
            <Button type="submit">Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
