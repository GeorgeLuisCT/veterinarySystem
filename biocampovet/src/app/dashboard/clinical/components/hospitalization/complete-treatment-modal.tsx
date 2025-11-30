"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";
import {
    updateTreatmentScheduleSchema,
    UpdateTreatmentScheduleRequest,
} from "../../types/hospitalization-request";
import HospitalizationService from "../../service/hospitalization-service";
import { HospitalizationResponse } from "../../types/hospitalization-response";
import { useUser } from "@/context/user-context";
import ProductService from "@/app/dashboard/inventory/_service/product-service";
import { ProductUnitTypeLabels } from "@/app/dashboard/inventory/_enums/product-unit-type";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    hospitalizationId: number;
    scheduleId: number;
    treatmentName: string;
    onSuccess: (updated: HospitalizationResponse) => void;
};

export function CompleteTreatmentModal({ open, onOpenChange, hospitalizationId, scheduleId, treatmentName, onSuccess }: Props) {
    const { toast } = useToast();
    const { userInfo } = useUser();
    const [productOptions, setProductOptions] = useState<{ value: string; label: string }[]>([]);

    const form = useForm<UpdateTreatmentScheduleRequest>({
        resolver: zodResolver(updateTreatmentScheduleSchema),
        defaultValues: {
            isCompleted: true,
            completedByEmployeeId: userInfo?.employeeId || null,
            notes: "",
            productId: null,
            quantity: null,
            unit: null,
        },
    });

    useEffect(() => {
        if (open && userInfo?.employeeId) {
            form.setValue("completedByEmployeeId", userInfo.employeeId);
        }
    }, [open, userInfo, form]);

    const handleSearchProducts = async (query: string) => {
        if (query.trim().length < 2) {
            setProductOptions([]);
            return;
        }
        try {
            const results = await ProductService.searchProducts(query.trim(), userInfo?.selectedBranch.id);
            setProductOptions(results.map((p) => ({ value: String(p.id), label: p.name })));
        } catch {
            setProductOptions([]);
        }
    };

    const unitOptions = useMemo(
        () => Object.entries(ProductUnitTypeLabels).map(([value, label]) => ({ value, label })),
        []
    );

    const handleSubmit = async (values: UpdateTreatmentScheduleRequest) => {
        try {
            const updated = await HospitalizationService.updateTreatmentSchedule(hospitalizationId, scheduleId, values);
            toast({ title: "Tratamiento completado", description: "El tratamiento se ha marcado como completado y se ha descontado del inventario." });
            onSuccess(updated);
            onOpenChange(false);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: getAaxiosErrorMessage(error) ?? "No se pudo completar el tratamiento.",
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Administrar Tratamiento: {treatmentName}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Selecciona el producto utilizado para descontarlo del inventario.
                        </p>

                        <FormField
                            control={form.control}
                            name="productId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <FloatingLabelSelect
                                            id="productId"
                                            label="Producto *"
                                            placeholder="Buscar producto..."
                                            options={productOptions}
                                            onSearch={handleSearchProducts}
                                            value={field.value ? String(field.value) : ""}
                                            onValueChange={(v) => field.onChange(v ? Number(v) : null)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <FloatingLabelInput
                                                id="quantity"
                                                label="Cantidad *"
                                                type="number"
                                                step="0.01"
                                                value={field.value === null ? "" : String(field.value)}
                                                onChange={(v) => field.onChange(v === "" ? null : Number(v))}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="unit"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <FloatingLabelSelect
                                                id="unit"
                                                label="Unidad *"
                                                value={field.value ?? ""}
                                                options={unitOptions}
                                                onValueChange={(v) => field.onChange(v || null)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Textarea placeholder="Notas adicionales (opcional)..." {...field} value={field.value || ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                            <Button type="submit">Confirmar y Descontar</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
