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
import { Textarea } from "@/components/ui/textarea";
import { closeSessionSchema, CloseSessionFormValues } from "../_schemas/close-session-schema";

interface CloseSessionDialogProps {
  onCloseSession: (values: CloseSessionFormValues) => Promise<void>;
  disabled?: boolean;
}

export default function CloseSessionDialog({ onCloseSession, disabled }: CloseSessionDialogProps) {
  const [open, setOpen] = useState(false);
  const form = useForm<CloseSessionFormValues>({
    resolver: zodResolver(closeSessionSchema),
    defaultValues: { countedClosingAmount: 0, notes: "" },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onCloseSession(values);
    setOpen(false);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" disabled={disabled}>
          Cerrar caja
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cierre de caja</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Monto contado</label>
            <Input
              type="number"
              step={0.01}
              min={0}
              {...form.register("countedClosingAmount", { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Notas</label>
            <Textarea rows={3} {...form.register("notes")} />
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
            <Button type="submit">Confirmar cierre</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
