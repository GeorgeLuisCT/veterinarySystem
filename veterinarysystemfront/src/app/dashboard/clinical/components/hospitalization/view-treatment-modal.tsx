"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TreatmentScheduleResponse } from "../../types/hospitalization-response";
import { ProductUnitTypeLabels } from "@/app/dashboard/inventory/_enums/product-unit-type";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: TreatmentScheduleResponse;
};

export function ViewTreatmentModal({ open, onOpenChange, schedule }: Props) {
  const scheduledAt = React.useMemo(
    () =>
      new Date(schedule.scheduledTime).toLocaleString("es-ES", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [schedule.scheduledTime]
  );

  const completedAt = schedule.completedAt
    ? new Date(schedule.completedAt).toLocaleString("es-ES", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Detalle del tratamiento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="font-semibold text-slate-900 whitespace-pre-line">{schedule.treatmentName}</p>
            <p className="text-slate-600">Programado: {scheduledAt}</p>
            {completedAt && (
              <p className="text-slate-600">
                Administrado: {completedAt}
                {schedule.completedByEmployeeFullName ? ` por ${schedule.completedByEmployeeFullName}` : ""}
              </p>
            )}
          </div>

          {schedule.notes && (
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Notas del plan</p>
              <p className="whitespace-pre-wrap text-slate-800">{schedule.notes}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Productos registrados</p>
            {schedule.products && schedule.products.length > 0 ? (
              <ul className="mt-1 space-y-1">
                {schedule.products.map((product) => (
                  <li key={product.id} className="rounded-md border p-2">
                    <p className="font-medium text-slate-900">{product.productName}</p>
                    <p className="text-xs text-slate-600">
                      {product.quantity} {ProductUnitTypeLabels[product.unit]}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">No se registraron productos para esta dosis.</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
