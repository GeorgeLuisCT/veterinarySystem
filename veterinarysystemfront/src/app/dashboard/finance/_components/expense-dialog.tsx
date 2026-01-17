// app/dashboard/finance/_components/expense-dialog.tsx
"use client";
import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelDateInput } from "@/components/floating-label-date-input";
import { getAaxiosErrorMessage } from "@/helpers/error";
import { useToast } from "@/hooks/use-toast";
import { ExpenseFormValues, expenseSchema } from "../_schemas/expense-schema";
import { TreasuryAccountResponse } from "../_types/treasury-account";
import TreasuryAccountService from "../_services/treasury-account-service";

type Props = {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    onSubmit: (values: ExpenseFormValues) => Promise<void> | void;
};

function toLocalDateTimeInputValue(d: Date) {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ExpenseDialog({ open, onOpenChange, onSubmit }: Props) {
    const { toast } = useToast();
    const [accounts, setAccounts] = useState<TreasuryAccountResponse[]>([]);
    const [loadingAccounts, setLoadingAccounts] = useState(true);

    const form = useForm<ExpenseFormValues>({
        resolver: zodResolver(expenseSchema),
        defaultValues: {
            treasuryAccountId: undefined,
            description: "",
            amount: 0,
            occurredAt: toLocalDateTimeInputValue(new Date()),
        },
        mode: "onChange",
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
    }, [form.setValue, toast]);

    useEffect(() => {
        if (open) {
            form.reset({
                treasuryAccountId: undefined,
                description: "",
                amount: 0,
                occurredAt: toLocalDateTimeInputValue(new Date()),
            });
            loadAccounts();
        }
    }, [open, form.reset, loadAccounts]);

    const handleSubmit = form.handleSubmit(async (values) => {
        await onSubmit({
            treasuryAccountId: values.treasuryAccountId,
            description: values.description.trim(),
            amount: values.amount,
            occurredAt: values.occurredAt,
        });
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Registrar gasto</DialogTitle>
                    <DialogDescription>Genera un egreso directo restando el importe desde una cuenta de tesorería.</DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="treasuryAccountId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <FloatingLabelSelect
                                            id="treasuryAccountId"
                                            label={loadingAccounts ? "Cuenta (cargando…)" : "Cuenta"}
                                            value={field.value ? String(field.value) : ""}
                                            onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}
                                            options={accounts.map((a) => ({ value: String(a.id), label: a.name }))}
                                            emptyMessage="Sin cuentas"
                                            disabled={loadingAccounts}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <FloatingLabelInput id="description" label="Descripción" {...field} />
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
                            name="occurredAt"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <FloatingLabelDateInput
                                            id="occurredAt"
                                            label="Fecha y hora"
                                            value={field.value}
                                            onChange={(v) => field.onChange(v)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={form.formState.isSubmitting || !accounts.length}>
                                {form.formState.isSubmitting ? "Registrando..." : "Registrar gasto"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
