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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { FrequencyUnitLabels } from "../../enums/frequency-unit";
import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";
import {
    createTreatmentScheduleSchema,
    CreateTreatmentScheduleRequest,
} from "../../types/hospitalization-request";
import HospitalizationService from "../../service/hospitalization-service";
import { HospitalizationResponse } from "../../types/hospitalization-response";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    hospitalizationId: number;
    onSuccess: (updated: HospitalizationResponse) => void;
};

export function AddTreatmentModal({ open, onOpenChange, hospitalizationId, onSuccess }: Props) {
    const { toast } = useToast();

    const form = useForm<CreateTreatmentScheduleRequest>({
        resolver: zodResolver(createTreatmentScheduleSchema),
        defaultValues: {
            treatmentName: "",
            scheduledTime: new Date().toISOString(),
            notes: "",
            frequencyValue: null,
            frequencyUnit: null,
            numberOfDoses: null,
        },
    });

    const frequencyUnitOptions = React.useMemo(
        () => Object.entries(FrequencyUnitLabels).map(([value, label]) => ({ value, label })),
        []
    );

    useEffect(() => {
        if (open) {
            form.reset({
                treatmentName: "",
                scheduledTime: new Date().toISOString(),
                notes: "",
                frequencyValue: null,
                frequencyUnit: null,
                numberOfDoses: null,
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
                                    <FormLabel>Tratamiento / Medicamento</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej. Amoxicilina 500mg" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="scheduledTime"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fecha y Hora Programada</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="datetime-local"
                                            value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ""}
                                            onChange={(e) => {
                                                const date = new Date(e.target.value);
                                                if (!isNaN(date.getTime())) {
                                                    field.onChange(date.toISOString());
                                                }
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notas (Opcional)</FormLabel>
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
