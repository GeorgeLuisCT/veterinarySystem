"use client";

import React, { useState } from "react";
import { ActionDialog } from "@/components/action-dialog";
import { CashboxMovementForm } from "../forms/cashbox-movement-form";
import { CashboxAuditForm } from "../forms/cashbox-audit-form";
import { CloseCashBoxForm } from "../forms/close-cashbox-form";
import { CashboxMovementType } from "../enums/cashbox-movement-type";

interface CashBoxActionsProps {
  cashboxId: number;
  fetchCurrentCashBox: () => void;
}

export function CashBoxActions({
  cashboxId,
  fetchCurrentCashBox,
}: CashBoxActionsProps) {
  const[isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isIncomeDialogOpen, setIsIncomeDialogOpen] = useState(false);
  const [isAuditDialogOpen, setIsAuditDialogOpen] = useState(false);
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);

  return (
    <>
      <div className="flex gap-4 flex-wrap justify-end">
        <ActionDialog
          open={isExpenseDialogOpen}
          setOpen={setIsExpenseDialogOpen}
          title="Registrar Egreso"
          description="Agrega un egreso a esta caja."
          triggerLabel="Registrar Egreso"
        >
          <CashboxMovementForm
            movementType={CashboxMovementType.EXPENSE}
            cashboxId={cashboxId}
            onSuccess={() => {
              setIsExpenseDialogOpen(false);
              fetchCurrentCashBox();
            }}
          />
        </ActionDialog>

        <ActionDialog
          open={isIncomeDialogOpen}
          setOpen={setIsIncomeDialogOpen}
          title="Registrar Ingreso"
          description="Agrega un ingreso a esta caja."
          triggerLabel="Registrar Ingreso"
        >
          <CashboxMovementForm
            movementType={CashboxMovementType.INCOME}
            cashboxId={cashboxId}
            onSuccess={() => {
              setIsIncomeDialogOpen(false);
              fetchCurrentCashBox();
            }}
          />
        </ActionDialog>

        <ActionDialog
          open={isAuditDialogOpen}
          setOpen={setIsAuditDialogOpen}
          title="Corte de Caja"
          description="Registra los montos contados por cada método de pago."
          triggerLabel="Registrar Corte"
        >
          <CashboxAuditForm
            cashboxId={cashboxId}
            onSuccess={() => {
              setIsAuditDialogOpen(false);
              fetchCurrentCashBox();
            }}
          />
        </ActionDialog>

        <ActionDialog
          open={isCloseDialogOpen}
          setOpen={setIsCloseDialogOpen}
          title="Cerrar Caja"
          description="Confirma el cierre e ingresa el monto físico contado."
          triggerLabel="Cerrar Caja"
          triggerVariant="destructive"
        >
          <CloseCashBoxForm
            cashboxId={cashboxId}
            onSuccess={() => {
              setIsCloseDialogOpen(false);
              fetchCurrentCashBox();
            }}
          />
        </ActionDialog>
      </div>
    </>
  );
}
