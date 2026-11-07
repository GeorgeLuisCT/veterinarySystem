"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import { HospitalizationResponse, TreatmentScheduleResponse } from "../../types/hospitalization-response";
import { useUser } from "@/context/user-context";
import ProductService from "@/app/dashboard/inventory/_service/product-service";
import { ProductUnitType, ProductUnitTypeLabels } from "@/app/dashboard/inventory/_enums/product-unit-type";
import { z } from "zod";

type UpdateTreatmentScheduleFormValues = z.input<typeof updateTreatmentScheduleSchema>;

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    hospitalizationId: number;
    schedule: TreatmentScheduleResponse;
    onSuccess: (updated: HospitalizationResponse) => void;
};

export function CompleteTreatmentModal({ open, onOpenChange, hospitalizationId, schedule, onSuccess }: Props) {
    const { toast } = useToast();
    const { userInfo } = useUser();
    const [productOptionsMap, setProductOptionsMap] = useState<Record<string, { value: string; label: string }[]>>({});

    const buildDefaultValues = React.useCallback(
        (initialSchedule?: TreatmentScheduleResponse): UpdateTreatmentScheduleFormValues => {
            const products =
                initialSchedule?.products && initialSchedule.products.length > 0
                    ? initialSchedule.products.map((product) => ({
                        productId: product.productId,
                        quantity: product.quantity,
                        unit: product.unit,
                    }))
                    : [
                        {
                            productId: 0,
                            quantity: 0,
                            unit: ProductUnitType.UNIT,
                        },
                    ];

            return {
                isCompleted: true,
                completedByEmployeeId: userInfo?.employeeId || null,
                notes: "",
                products,
            };
        },
        [userInfo?.employeeId]
    );

    const form = useForm<UpdateTreatmentScheduleFormValues>({
        resolver: zodResolver(updateTreatmentScheduleSchema),
        defaultValues: buildDefaultValues(schedule),
    });

    const { fields: productFields, append, remove, replace } = useFieldArray({
        control: form.control,
        name: "products",
    });

    useEffect(() => {
        if (open) {
            const defaults = buildDefaultValues(schedule);
            form.reset(defaults);
            replace(defaults.products);
            setProductOptionsMap({});
        }
    }, [open, schedule, buildDefaultValues, form, replace]);

    useEffect(() => {
        if (userInfo?.employeeId) {
            form.setValue("completedByEmployeeId", userInfo.employeeId);
        }
    }, [userInfo, form]);

    const handleSearchProducts = async (query: string, fieldId: string) => {
        const trimmed = query.trim();
        if (trimmed.length < 2) {
            setProductOptionsMap((prev) => ({ ...prev, [fieldId]: [] }));
            return;
        }
        try {
            const results = await ProductService.searchProducts(trimmed, userInfo?.selectedBranch.id);
            setProductOptionsMap((prev) => ({
                ...prev,
                [fieldId]: results.map((p) => ({ value: String(p.id), label: p.name })),
            }));
        } catch {
            setProductOptionsMap((prev) => ({ ...prev, [fieldId]: [] }));
        }
    };

    const unitOptions = useMemo(
        () => Object.entries(ProductUnitTypeLabels).map(([value, label]) => ({ value, label })),
        []
    );

    const scheduledTimeLabel = useMemo(
        () =>
            new Date(schedule.scheduledTime).toLocaleString("es-ES", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
            }),
        [schedule.scheduledTime]
    );

    const handleSubmit = async (values: UpdateTreatmentScheduleFormValues) => {
        const payload: UpdateTreatmentScheduleRequest = {
            isCompleted: true,
            completedByEmployeeId: values.completedByEmployeeId,
            notes: values.notes,
            products: values.products,
        };
        try {
            const updated = await HospitalizationService.updateTreatmentSchedule(hospitalizationId, schedule.id, payload);
            toast({
                title: "Tratamiento completado",
                description: "El tratamiento se ha marcado como completado y se descontó el inventario programado.",
            });
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
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Administrar tratamiento</DialogTitle>
                </DialogHeader>
                <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
                    <p className="font-semibold text-foreground whitespace-pre-line">{schedule.treatmentName}</p>
                    <p className="text-muted-foreground">Programado para {scheduledTimeLabel}</p>
                    {schedule.notes && (
                        <p className="text-muted-foreground whitespace-pre-line">Notas del plan: {schedule.notes}</p>
                    )}
                </div>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <div className="space-y-1">
                            <p className="text-sm font-medium">Fecha y hora de aplicación</p>
                            <p className="rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">
                                {new Date(schedule.scheduledTime).toLocaleString("es-ES", {
                                    day: "2-digit",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Se registrará en la misma hora programada para asegurar la coherencia de la hoja.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <p className="text-sm font-medium text-foreground">
                                Productos aplicados y a descontar del inventario
                            </p>
                            {productFields.map((productField, index) => (
                                <div key={productField.id} className="rounded-lg border p-3 space-y-3">
                                    <div className="flex items-start justify-between">
                                        <p className="text-sm font-medium">Producto #{index + 1}</p>
                                        {productFields.length > 1 && (
                                            <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                                                Quitar
                                            </Button>
                                        )}
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-3">
                                        <FormField
                                            control={form.control}
                                            name={`products.${index}.productId`}
                                            render={({ field }) => (
                                                <FormItem className="sm:col-span-2">
                                                    <FormControl>
                                                        <FloatingLabelSelect
                                                            id={`products.${index}.productId`}
                                                            label="Producto *"
                                                            placeholder="Buscar producto..."
                                                            options={productOptionsMap[productField.id] ?? []}
                                                            onSearch={(query) => handleSearchProducts(query, productField.id)}
                                                            value={field.value ? String(field.value) : ""}
                                                            onValueChange={(value) => field.onChange(value ? Number(value) : 0)}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <FormField
                                                control={form.control}
                                                name={`products.${index}.quantity`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <FloatingLabelInput
                                                                id={`products.${index}.quantity`}
                                                                label="Cantidad *"
                                                                type="number"
                                                                step="0.01"
                                                                value={!field.value ? "" : String(field.value)}
                                                                onChange={(v) => field.onChange(v === "" ? 0 : Number(v))}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`products.${index}.unit`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <FloatingLabelSelect
                                                                id={`products.${index}.unit`}
                                                                label="Unidad *"
                                                                value={field.value}
                                                                options={unitOptions}
                                                                onValueChange={(value) => field.onChange(value as ProductUnitType)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    append({
                                        productId: 0,
                                        quantity: 0,
                                        unit: ProductUnitType.UNIT,
                                    })
                                }
                            >
                                Agregar otro producto
                            </Button>
                        </div>

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notas de aplicación (opcional)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Observaciones de esta aplicación..." {...field} value={field.value || ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                            <Button type="submit">Confirmar y descontar</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
