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
import { expenseSchema, ExpenseFormValues } from "../../_schemas/expense-schema";

const ExpensesPage = () => {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<TreasuryAccountResponse[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      treasuryAccountId: undefined,
      description: "",
      amount: 0,
      occurredAt: new Date().toISOString().slice(0, 16),
    },
  });

  const loadAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    try {
      const response = await TreasuryAccountService.list();
      setAccounts(response);
      if (response.length) {
        form.setValue("treasuryAccountId", response[0].id);
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
      await FinanceActionService.registerExpense({
        treasuryAccountId: values.treasuryAccountId,
        description: values.description.trim(),
        amount: values.amount,
        occurredAt: values.occurredAt ? new Date(values.occurredAt).toISOString() : undefined,
      });
      toast({ title: "Gasto registrado" });
      form.reset({
        treasuryAccountId: values.treasuryAccountId,
        description: "",
        amount: 0,
        occurredAt: new Date().toISOString().slice(0, 16),
      });
      loadAccounts();
    } catch (error) {
      toast({
        title: "No se pudo registrar el gasto",
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
            <h1 className="text-2xl font-semibold">Registrar gasto</h1>
            <p className="text-muted-foreground">
              Genera un egreso directo restando el importe desde una cuenta de tesorería.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Datos del gasto</CardTitle>
              <CardDescription>Todos los gastos manuales quedan registrados con tipo EXPENSE.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Cuenta</Label>
                  <Select
                    value={form.watch("treasuryAccountId") ? String(form.watch("treasuryAccountId")) : undefined}
                    onValueChange={(value) => form.setValue("treasuryAccountId", Number(value))}
                    disabled={loadingAccounts}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una cuenta" />
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
                  <Label>Descripción</Label>
                  <Input placeholder="Ej. Pago de servicios" {...form.register("description")} />
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

                <Button type="submit" disabled={form.formState.isSubmitting || !accounts.length}>
                  {form.formState.isSubmitting ? "Registrando..." : "Registrar gasto"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayoutSection>
  );
};

export default ExpensesPage;
