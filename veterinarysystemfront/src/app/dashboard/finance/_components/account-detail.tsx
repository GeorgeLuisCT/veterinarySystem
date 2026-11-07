"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import DataTable from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { AccountMovementResponse, TreasuryAccountResponse } from "../_types/treasury-account";
import { ManualMovementFormValues, manualMovementSchema } from "../_schemas/manual-movement-schema";
import { DATE_TIME, PEN } from "../_lib/formatters";
import TreasuryAccountService from "../_services/treasury-account-service";
import type { PaginatedResponse } from "@/types/paginated-response";
import { AccountMovementTypeLabels, TreasuryAccountTypeLabels } from "../_enums/accounts-enums";
import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";

export function AccountDetail({
  account,
  onRegisterMovement,
  refreshSignal,
}: {
  account: TreasuryAccountResponse;
  onRegisterMovement: (payload: ManualMovementFormValues) => Promise<void> | void;
  refreshSignal?: number;
}) {
  const [pageData, setPageData] = useState<PaginatedResponse<AccountMovementResponse> | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const { toast } = useToast();

  const form = useForm<ManualMovementFormValues>({
    resolver: zodResolver(manualMovementSchema),
    defaultValues: { amount: 0, description: "", income: true },
    mode: "onChange",
  });

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await TreasuryAccountService.getMovements(account.id, { page: pageIndex, size: pageSize });
      setPageData(res);
    } catch (error) {
      setPageData(null);
      toast({
        title: "No se pudieron cargar los movimientos",
        description: getAaxiosErrorMessage(error) ?? "Intenta nuevamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [account.id, pageIndex, pageSize, toast]);

  useEffect(() => {
    setPageIndex(0);
  }, [account.id]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  useEffect(() => {
    if (refreshSignal !== undefined) {
      fetchMovements();
    }
  }, [fetchMovements, refreshSignal]);

  const submit = form.handleSubmit(async (values) => {
    await onRegisterMovement({
      amount: values.amount,
      description: values.description?.trim() || undefined,
      income: values.income,
    });
    form.reset({ amount: 0, description: "", income: values.income });
    fetchMovements();
  });

  const isSubmitting = form.formState.isSubmitting;

  const columns: ColumnDef<AccountMovementResponse>[] = useMemo(
    () => [
      {
        accessorKey: "movementDate",
        header: "Fecha",
        cell: ({ row }) => DATE_TIME.format(new Date(row.original.movementDate)),
      },
      {
        accessorKey: "description",
        header: "Descripción",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <div>{row.original.description || "Sin descripción"}</div>
            <div className="text-xs text-muted-foreground">{row.original.reference ?? ""}</div>
          </div>
        ),
      },
      {
        accessorKey: "movementType",
        header: "Tipo",
        cell: ({ row }) => (
          <Badge variant="secondary" className="rounded-full capitalize">
            {AccountMovementTypeLabels[row.original.movementType]}
          </Badge>
        ),
      },
      {
        accessorKey: "amount",
        header: "Monto",
        cell: ({ row }) => (
          <div
            className={cn(
              "text-right font-medium",
              row.original.amount >= 0 ? "text-success-strong" : "text-destructive"
            )}
          >
            {PEN.format(row.original.amount)}
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6 flex flex-row gap-4">
      <div className="w-full max-w-xl">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-medium">Detalles de la cuenta</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saldo actual</p>
                <p className="text-2xl font-semibold">{PEN.format(account.currentBalance)}</p>
              </div>
              <Badge>{TreasuryAccountTypeLabels[account.type]}</Badge>
            </div>
            {account.description && <p className="mt-2 text-sm text-muted-foreground">{account.description}</p>}
          </div>

          <Form {...form}>
            <form onSubmit={submit} className="rounded-lg border p-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">Registrar movimiento manual</p>
                <div className="flex gap-2 text-xs">
                  <Button
                    type="button"
                    variant={form.watch("income") ? "default" : "outline"}
                    onClick={() => form.setValue("income", true, { shouldValidate: true })}
                    disabled={isSubmitting}
                  >
                    Ingreso
                  </Button>
                  <Button
                    type="button"
                    variant={!form.watch("income") ? "default" : "outline"}
                    onClick={() => form.setValue("income", false, { shouldValidate: true })}
                    disabled={isSubmitting}
                  >
                    Egreso
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Monto</Label>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          inputMode="decimal"
                          value={Number.isNaN(field.value as number) ? "" : field.value}
                          onChange={(e) => {
                            const v = e.target.value;
                            field.onChange(v === "" ? 0 : Number(v));
                          }}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Se registrará como {form.watch("income") ? "ingreso" : "egreso"}.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Descripción</Label>
                      <FormControl>
                        <Input placeholder="Ej. Ajuste manual" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Registrando..." : "Guardar movimiento"}
              </Button>
            </form>
          </Form>
        </div>
      </div>

      <div className="flex-1 space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-medium">Últimos movimientos</p>
        </div>

        <DataTable<AccountMovementResponse>
          pageData={pageData}
          columns={columns}
          actions={[]}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPageIndexChange={setPageIndex}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPageIndex(0);
          }}
          loading={loading}
        />
      </div>
    </div>
  );
}
