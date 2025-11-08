"use client";

import { useCallback, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import DashboardLayoutSection from "@/app/dashboard/dashboard-layout-section";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";
import TreasuryAccountService from "../../_services/treasury-account-service";
import { TreasuryAccountResponse } from "../../_types/treasury-account";
import FinanceActionService from "../../_services/finance-action-service";
import { transferSchema, TransferFormValues } from "../../_schemas/transfer-schema";

const TransferPage = () => {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<TreasuryAccountResponse[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      sourceAccountId: undefined,
      targetAccountId: undefined,
      amount: 0,
      description: "",
      occurredAt: new Date().toISOString().slice(0, 16),
    },
  });

  const loadAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    try {
      const response = await TreasuryAccountService.list();
      setAccounts(response);
      if (response.length >= 2) {
        form.setValue("sourceAccountId", response[0].id);
        form.setValue("targetAccountId", response[1].id);
      }
    } catch (error) {
      toast({
        title: "No se pudieron cargar las cuentas",
        description: getAaxiosErrorMessage(error) ?? "Intenta nuevamente",
        variant: "destructive",
      });
    } finally {
      setLoadingAccounts(false);
    }
  }, [form, toast]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await FinanceActionService.registerTransfer({
        sourceAccountId: values.sourceAccountId,
        targetAccountId: values.targetAccountId,
        amount: values.amount,
        description: values.description?.trim() || undefined,
        occurredAt: values.occurredAt ? new Date(values.occurredAt).toISOString() : undefined,
      });
      toast({ title: "Transferencia registrada" });
      form.reset({
        sourceAccountId: values.sourceAccountId,
        targetAccountId: values.targetAccountId,
        amount: 0,
        description: "",
        occurredAt: new Date().toISOString().slice(0, 16),
      });
      loadAccounts();
    } catch (error) {
      toast({
        title: "No se pudo registrar la transferencia",
        description: getAaxiosErrorMessage(error) ?? "Intenta nuevamente",
        variant: "destructive",
      });
    }
  });

  return (
    <DashboardLayoutSection>
      <div className="h-full bg-gray-50 p-4 sm:p-6">
        <div className="mx-auto flex h-full max-w-4xl flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold">Transferencias internas</h1>
            <p className="text-muted-foreground">
              Mueve fondos entre cuentas bancarias, cajas o billeteras para mantener tus saldos actualizados.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Datos de la transferencia</CardTitle>
              <CardDescription>Se generan dos movimientos: egreso en origen e ingreso en destino.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Cuenta origen</Label>
                    <Select
                      value={form.watch("sourceAccountId") ? String(form.watch("sourceAccountId")) : undefined}
                      onValueChange={(value) => form.setValue("sourceAccountId", Number(value))}
                      disabled={loadingAccounts}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Cuenta origen" />
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
                  <div>
                    <Label>Cuenta destino</Label>
                    <Select
                      value={form.watch("targetAccountId") ? String(form.watch("targetAccountId")) : undefined}
                      onValueChange={(value) => form.setValue("targetAccountId", Number(value))}
                      disabled={loadingAccounts}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Cuenta destino" />
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
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Monto</Label>
                    <Input type="number" step="0.01" min="0" {...form.register("amount", { valueAsNumber: true })} />
                  </div>
                  <div>
                    <Label>Fecha y hora</Label>
                    <Input type="datetime-local" {...form.register("occurredAt")} />
                  </div>
                </div>

                <div>
                  <Label>Notas</Label>
                  <Input placeholder="Opcional" {...form.register("description")} />
                </div>

                <Button type="submit" disabled={form.formState.isSubmitting || accounts.length < 2}>
                  {form.formState.isSubmitting ? "Registrando..." : "Registrar transferencia"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayoutSection>
  );
};

export default TransferPage;
