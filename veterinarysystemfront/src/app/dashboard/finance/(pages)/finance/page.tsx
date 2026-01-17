"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayoutSection from "@/app/dashboard/dashboard-layout-section";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";
import TreasuryAccountService, { ManualMovementPayload, TreasuryAccountPayload } from "../../_services/treasury-account-service";
import { TreasuryAccountResponse } from "../../_types/treasury-account";
import { accountBadges } from "../../_lib/formatters";
import { AccountsList } from "../../_components/accounts-list";
import { AccountDetail } from "../../_components/account-detail";
import { AccountFormDialog } from "../../_components/account-form-dialog";
import { ConfirmDeleteDialog } from "../../_components/confirm-delete-dialog";
import { PlusCircle, ArrowLeftRight, ReceiptText } from "lucide-react";
import { TreasuryAccountType } from "../../_enums/accounts-enums";
import TransferDialog from "../../_components/transfer-dialog";
import ExpenseDialog from "../../_components/expense-dialog";
import type { TransferFormValues } from "../../_schemas/transfer-schema";
import type { ExpenseFormValues } from "../../_schemas/expense-schema";
import FinanceActionService from "../../_services/finance-action-service";

export default function TreasuryAccountsPage() {
  const { toast } = useToast();

  const [accounts, setAccounts] = useState<TreasuryAccountResponse[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<TreasuryAccountResponse | null>(null);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formDefaults, setFormDefaults] = useState<{ name: string; type: TreasuryAccountType; description?: string } | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<TreasuryAccountResponse | null>(null);

  const [detailRefresh, setDetailRefresh] = useState(0);

  const [transferOpen, setTransferOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);

  const loadAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    try {
      const data = await TreasuryAccountService.list();
      setAccounts(data);
      setSelectedAccount((prev) => {
        if (!data.length) return null;
        if (!prev) return data[0];
        return data.find((i) => i.id === prev.id) ?? data[0];
      });
    } catch (error) {
      toast({
        title: "No se pudieron cargar las cuentas",
        description: getAaxiosErrorMessage(error) ?? "Intenta nuevamente",
        variant: "destructive",
      });
    } finally {
      setLoadingAccounts(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const refreshAccountsAndDetail = useCallback(async () => {
    await loadAccounts();
    setDetailRefresh((x) => x + 1);
  }, [loadAccounts]);

  const handleOpenCreate = () => {
    setFormMode("create");
    setFormDefaults({ name: "", type: TreasuryAccountType.CASH, description: "" });
    setFormOpen(true);
  };

  const handleOpenEdit = (account: TreasuryAccountResponse) => {
    setFormMode("edit");
    setFormDefaults({ name: account.name, type: account.type, description: account.description ?? "" });
    setSelectedAccount(account);
    setFormOpen(true);
  };

  const handleSubmitAccount = async (values: { name: string; type: TreasuryAccountType; description?: string }) => {
    const payload: TreasuryAccountPayload = {
      name: values.name.trim(),
      type: values.type,
      description: values.description?.trim() || undefined,
    };

    try {
      let updated: TreasuryAccountResponse;
      if (formMode === "edit" && selectedAccount) {
        updated = await TreasuryAccountService.update(selectedAccount.id, payload);
      } else {
        updated = await TreasuryAccountService.create(payload);
      }
      toast({ title: "Cuenta guardada correctamente" });
      setFormOpen(false);
      await refreshAccountsAndDetail();
      setSelectedAccount(updated);
    } catch (error) {
      toast({
        title: "No se pudo guardar la cuenta",
        description: getAaxiosErrorMessage(error) ?? "Revisa los campos e intenta nuevamente",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirmDelete) return;
    try {
      await TreasuryAccountService.remove(confirmDelete.id);
      toast({ title: "Cuenta eliminada" });
      setConfirmDelete(null);
      await refreshAccountsAndDetail();
      if (selectedAccount?.id === confirmDelete.id) setSelectedAccount(null);
    } catch (error) {
      toast({
        title: "No se pudo eliminar la cuenta",
        description: getAaxiosErrorMessage(error) ?? "Verifica que no tenga movimientos",
        variant: "destructive",
      });
    }
  };

  const handleRegisterMovement = async (values: ManualMovementPayload) => {
    if (!selectedAccount) return;
    try {
      await TreasuryAccountService.registerManualMovement(selectedAccount.id, values);
      toast({ title: "Movimiento registrado" });
      await refreshAccountsAndDetail();
    } catch (error) {
      toast({
        title: "No se pudo registrar el movimiento",
        description: getAaxiosErrorMessage(error) ?? "Intenta nuevamente",
        variant: "destructive",
      });
    }
  };

  const handleSubmitTransfer = async (values: TransferFormValues) => {
    try {
      await FinanceActionService.registerTransfer({
        sourceAccountId: values.sourceAccountId,
        targetAccountId: values.targetAccountId,
        amount: values.amount,
        description: values.description?.trim() || undefined,
        occurredAt: values.occurredAt ? new Date(values.occurredAt).toISOString() : undefined,
      });
      toast({ title: "Transferencia registrada" });
      setTransferOpen(false);
      await refreshAccountsAndDetail();
    } catch (error) {
      toast({
        title: "No se pudo registrar la transferencia",
        description: getAaxiosErrorMessage(error) ?? "Intenta nuevamente",
        variant: "destructive",
      });
    }
  };

  const handleSubmitExpense = async (values: ExpenseFormValues) => {
    try {
      await FinanceActionService.registerExpense({
        treasuryAccountId: values.treasuryAccountId,
        description: values.description.trim(),
        amount: values.amount,
        occurredAt: values.occurredAt ? new Date(values.occurredAt).toISOString() : undefined,
      });
      toast({ title: "Gasto registrado" });
      setExpenseOpen(false);
      await refreshAccountsAndDetail();
    } catch (error) {
      toast({
        title: "No se pudo registrar el gasto",
        description: getAaxiosErrorMessage(error) ?? "Intenta nuevamente",
        variant: "destructive",
      });
    }
  };

  const badges = useMemo(() => accountBadges, []);

  return (
    <DashboardLayoutSection>
      <div className="h-full bg-gray-50 p-4 sm:p-6">
        <div className="mx-auto flex h-full max-w-8xl flex-col overflow-auto">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Tesorería</h1>
              <p className="mt-1 text-gray-600">
                Administra las cuentas bancarias, cajas y billeteras digitales. Registra movimientos manuales y consulta el historial.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => setExpenseOpen(true)}>
                <ReceiptText className="mr-2 h-4 w-4" />
                Registrar gasto
              </Button>
              <Button variant="outline" onClick={() => setTransferOpen(true)}>
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                Transferencia
              </Button>
              <Button onClick={handleOpenCreate}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nueva Cuenta
              </Button>
            </div>
          </div>

          <div className="w-full flex flex-col gap-4">
            <AccountsList
              accounts={accounts}
              loading={loadingAccounts}
              selectedId={selectedAccount?.id ?? null}
              onSelect={setSelectedAccount}
              onEdit={handleOpenEdit}
              onDelete={setConfirmDelete}
              badges={badges}
            />

            <Card>
              <CardContent className="pb-8">
                {selectedAccount ? (
                  <AccountDetail
                    account={selectedAccount}
                    onRegisterMovement={handleRegisterMovement}
                    refreshSignal={detailRefresh}
                  />
                ) : (
                  <div className="rounded-lg border bg-muted/30 p-6 text-center text-muted-foreground">
                    Selecciona una cuenta para ver el detalle.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <AccountFormDialog
            open={formOpen}
            mode={formMode}
            defaults={formDefaults ?? { name: "", type: TreasuryAccountType.CASH, description: "" }}
            onOpenChange={setFormOpen}
            onSubmit={handleSubmitAccount}
          />

          <ConfirmDeleteDialog
            open={Boolean(confirmDelete)}
            onOpenChange={() => setConfirmDelete(null)}
            onConfirm={handleDeleteAccount}
          />

          <TransferDialog
            open={transferOpen}
            onOpenChange={setTransferOpen}
            onSubmit={handleSubmitTransfer}
          />
          <ExpenseDialog
            open={expenseOpen}
            onOpenChange={setExpenseOpen}
            onSubmit={handleSubmitExpense}
          />
        </div>
      </div>
    </DashboardLayoutSection>
  );
}
