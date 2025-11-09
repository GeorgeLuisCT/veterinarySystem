// app/dashboard/finance/_components/transfer-dialog.tsx
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
import { TransferFormValues, transferSchema } from "../_schemas/transfer-schema";
import { TreasuryAccountResponse } from "../_types/treasury-account";
import TreasuryAccountService from "../_services/treasury-account-service";

type Props = {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    onSubmit: (values: TransferFormValues) => Promise<void> | void;
};

function toLocalDateTimeInputValue(d: Date) {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function TransferDialog({ open, onOpenChange, onSubmit }: Props) {
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
            occurredAt: toLocalDateTimeInputValue(new Date()),
        },
        mode: "onChange",
    });

    const loadAccounts = useCallback(async () => {
        setLoadingAccounts(true);
        try {
            const response = await TreasuryAccountService.list();
            setAccounts(response);
            if (response.length >= 2) {
                form.setValue("sourceAccountId", response[0].id);
                form.setValue("targetAccountId", response[1].id);
            } else if (response.length === 1) {
                form.setValue("sourceAccountId", response[0].id);
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
        if (open) {
            form.reset({
                sourceAccountId: undefined,
                targetAccountId: undefined,
                amount: 0,
                description: "",
                occurredAt: toLocalDateTimeInputValue(new Date()),
            });
            loadAccounts();
        }
    }, [open, form, loadAccounts]);

    const handleSubmit = form.handleSubmit(async (values) => {
        await onSubmit({
            sourceAccountId: values.sourceAccountId,
            targetAccountId: values.targetAccountId,
            amount: values.amount,
            description: values.description?.trim() || undefined,
            occurredAt: values.occurredAt,
        });
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Registrar transferencia</DialogTitle>
                    <DialogDescription>Se generan dos movimientos: egreso en origen e ingreso en destino.</DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={handleSubmit} className="space-y-4">

                        <FormField
                            control={form.control}
                            name="sourceAccountId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <FloatingLabelSelect
                                            id="sourceAccountId"
                                            label={loadingAccounts ? "Cuenta origen (cargando…)" : "Cuenta origen"}
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
                            name="targetAccountId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <FloatingLabelSelect
                                            id="targetAccountId"
                                            label={loadingAccounts ? "Cuenta destino (cargando…)" : "Cuenta destino"}
                                            value={field.value ? String(field.value) : ""}
                                            onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}
                                            options={accounts.map((a) => ({ value: String(a.id), label: a.name }))}
                                            emptyMessage="Sin cuentas"
                                            disabled={loadingAccounts || accounts.length < 2}
                                        />
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
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <FloatingLabelInput id="description" label="Notas (opcional)" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={form.formState.isSubmitting || accounts.length < 2}>
                                {form.formState.isSubmitting ? "Registrando..." : "Registrar transferencia"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
