"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useUser } from "@/context/user-context";
import CashBoxService from "../service/cashbox-service";
import { OpenCashBoxForm } from "../forms/open-cash-box-form";
import { ActionDialog } from "@/components/action-dialog";
import { CashboxDetails } from "../components/cashbox-details";

export default function CurrentCashBoxPage() {
  const { userInfo } = useUser();
  const branchId = userInfo?.selectedBranch?.id;

  const [isLoading, setIsLoading] = useState(true);
  const [hasOpen, setHasOpen] = useState<boolean>(false);
  const [cashboxId, setCashboxId] = useState<number | null>(null);

  const [isOpenDialogOpen, setIsOpenDialogOpen] = useState(false);

  const fetchCurrentCashBox = async () => {
    if (!branchId) {
      setHasOpen(false);
      setCashboxId(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const exists = await CashBoxService.checkOpenCashBox(branchId);
      setHasOpen(exists);

      if (exists) {
        const data = await CashBoxService.getOpenCashBox(branchId);
        console.log("Caja abierta:", data);
        setCashboxId(data.id);
      } else {
        setCashboxId(null);
      }
    } catch (error) {
      console.error("Error al verificar caja abierta:", error);
      setHasOpen(false);
      setCashboxId(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentCashBox();
  }, [branchId]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className=" px-4">
      {hasOpen && cashboxId ? (
        <>
          <div className="flex gap-4 flex-wrap justify-end">
          </div>
          <CashboxDetails cashboxId={cashboxId} />
        </>
      ) : (
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">No hay ninguna caja abierta</h2>

          <ActionDialog
            open={isOpenDialogOpen}
            setOpen={setIsOpenDialogOpen}
            title="Abrir Nueva Caja"
            description="Ingresa el monto inicial para abrir la caja en esta sucursal."
            triggerLabel="Abrir Caja"
          >
            <OpenCashBoxForm
              branchId={branchId!}
              onSuccess={() => {
                setIsOpenDialogOpen(false);
                fetchCurrentCashBox();
              }}
            />
          </ActionDialog>
        </div>
      )}
    </div>
  );
}
