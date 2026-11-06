"use client";

import React, { useEffect } from "react";
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
import { FrequencyUnit, FrequencyUnitLabels } from "../../enums/frequency-unit";
import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";
import {
    createTreatmentScheduleSchema,
    CreateTreatmentScheduleRequest,
} from "../../types/hospitalization-request";
import HospitalizationService from "../../service/hospitalization-service";
import { HospitalizationResponse } from "../../types/hospitalization-response";
import { FloatingLabelDateInput } from "@/components/floating-label-date-input";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    hospitalizationId: number;
    onSuccess: (updated: HospitalizationResponse) => void;
};

const toLocalDateTimeString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}:00`;
};

export function AddTreatmentModal({ open, onOpenChange, hospitalizationId, onSuccess }: Props) {
    const { toast } = useToast();

    const form = useForm<CreateTreatmentScheduleRequest>({
        resolver: zodResolver(createTreatmentScheduleSchema),
        defaultValues: {
            treatmentName: "",
            scheduledTime: toLocalDateTimeString(new Date()),
            notes: "",
            frequencyValue: null,
            frequencyUnit: null,
            numberOfDoses: 1,
        },
    });

    const frequencyUnitOptions = React.useMemo(
        () => Object.entries(FrequencyUnitLabels).map(([value, label]) => ({ value, label })),
        []
    );

    const watchedScheduledTime = form.watch("scheduledTime");
    const watchedFrequencyValue = form.watch("frequencyValue");
    const watchedFrequencyUnit = form.watch("frequencyUnit");
    const watchedNumberOfDoses = form.watch("numberOfDoses");

    const addInterval = React.useCallback((date: Date, value: number, unit: FrequencyUnit) => {
        const next = new Date(date);
        switch (unit) {
            case FrequencyUnit.MINUTES:
                next.setMinutes(next.getMinutes() + value);
                break;
            case FrequencyUnit.HOURS:
                next.setHours(next.getHours() + value);
                break;
            case FrequencyUnit.DAYS:
                next.setDate(next.getDate() + value);
                break;
            default:
                break;
        }
        return next;
    }, []);

    const dosePreview = React.useMemo(() => {
        if (!watchedScheduledTime) return [];
        const initial = new Date(watchedScheduledTime);
        if (Number.isNaN(initial.getTime())) return [];

        const hasFrequency = watchedFrequencyValue != null && watchedFrequencyUnit != null;
        const totalDoses =
            hasFrequency && watchedNumberOfDoses && watchedNumberOfDoses > 0 ? watchedNumberOfDoses : 1;

        const entries: { index: number; date: Date }[] = [];
        let current = initial;
        for (let i = 0; i < totalDoses; i += 1) {
            entries.push({ index: i + 1, date: new Date(current) });
            if (hasFrequency) {
                current = addInterval(current, watchedFrequencyValue as number, watchedFrequencyUnit as FrequencyUnit);
            }
        }
        return entries;
    }, [watchedScheduledTime, watchedFrequencyValue, watchedFrequencyUnit, watchedNumberOfDoses, addInterval]);

    const formatPreviewDate = (date: Date) =>
        date.toLocaleString("es-ES", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });

    useEffect(() => {
        if (open) {
            form.reset({
                treatmentName: "",
                scheduledTime: toLocalDateTimeString(new Date()),
                notes: "",
                frequencyValue: null,
                frequencyUnit: null,
                numberOfDoses: 1,
            });
        }
    }, [open, form]);

    const handleSubmit = async (values: CreateTreatmentScheduleRequest) => {
        try {
            const updated = await HospitalizationService.addTreatmentSchedule(hospitalizationId, values);
            toast({ title: "Tratamiento programado", description: "El tratamiento se ha añadido correctamente." });
            onSuccess(updated);
            onOpenChange(false);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: getAaxiosErrorMessage(error) ?? "No se pudo programar el tratamiento.",
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Programar Tratamiento</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="treatmentName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descripción del tratamiento</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            rows={3}
                                            placeholder="Ej. 50 ml de Amoxicilina + 30 ml de Solución Hartmann"
                                            {...field}
                                        />
                                    </FormControl>
                                    <p className="text-xs text-muted-foreground">
                                        Usa este campo para detallar todo el procedimiento o combinación de medicamentos.
                                    </p>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="scheduledTime"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <FloatingLabelDateInput
                                            id="scheduledTime"
                                            label="Fecha y hora de la primera dosis"
                                            mode="datetime"
                                            value={field.value ?? ""}
                                            onChange={(value) => field.onChange(value || "")}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <fieldset className="border-t pt-4 first:border-t-0 first:pt-0">
                            <legend className="mb-3 text-sm font-semibold text-foreground">Frecuencia (opcional)</legend>
                            <div className="grid gap-3 sm:grid-cols-3">
                                <FormField
                                    control={form.control}
                                    name="frequencyValue"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Cada</FormLabel>
                                            <FormControl>
                                                <FloatingLabelInput
                                                    id="frequencyValue"
                                                    label="Valor"
                                                    type="number"
                                                    step="1"
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
                                    name="frequencyUnit"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Unidad</FormLabel>
                                            <FormControl>
                                                <FloatingLabelSelect
                                                    id="frequencyUnit"
                                                    label="Unidad"
                                                    value={field.value ?? ""}
                                                    options={frequencyUnitOptions}
                                                    onValueChange={(value) => field.onChange(value || null)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="numberOfDoses"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Total de dosis</FormLabel>
                                            <FormControl>
                                                <FloatingLabelInput
                                                    id="numberOfDoses"
                                                    label="N° de dosis"
                                                    type="number"
                                                    value={field.value === null ? "" : String(field.value)}
                                                    onChange={(v) => field.onChange(v === "" ? null : Number(v))}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Define cada cuánto se repite y cuántas dosis se planifican para generar el cronograma.
                            </p>
                        </fieldset>

                        {watchedFrequencyUnit && watchedFrequencyValue && dosePreview.length > 1 && (
                            <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                                <p className="text-sm font-medium text-foreground">Cronograma estimado</p>
                                <ol className="mt-2 space-y-1 text-foreground">
                                    {dosePreview.map(({ index, date }) => (
                                        <li key={index} className="flex items-center justify-between gap-3">
                                            <span>
                                                Dosis {index}
                                                {index === 1 ? " (inicio)" : ""}
                                            </span>
                                            <span>{formatPreviewDate(date)}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        )}

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notas del plan (Opcional)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Instrucciones adicionales..." {...field} value={field.value || ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                            <Button type="submit">Guardar</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
