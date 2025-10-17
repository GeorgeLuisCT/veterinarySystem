"use client";

import React, { useCallback, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { LaboratoryRequestDetailResponse, LaboratoryRequestItemResponse } from "../../types/laboratory-request-response";
import { addResultValuesSchema, AddResultValuesRequest } from "../../types/laboratory-request-request";
import { LaboratoryRequestService } from "../../service/laboratory-request-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  detail: LaboratoryRequestDetailResponse;
}

// We create a schema for a single result value for the form
const resultValueSchema = z.object({
    parameterId: z.number(),
    numericValue: z.number().nullable(),
    textValue: z.string().nullable(),
    booleanValue: z.boolean().nullable(),
    comment: z.string().nullable(),
});

type ResultValueForm = z.infer<typeof resultValueSchema>;

const ResultInput = ({ item, parameter }: { item: LaboratoryRequestItemResponse, parameter: any }) => {
    const { toast } = useToast();
    const form = useForm<ResultValueForm>({
        defaultValues: {
            parameterId: parameter.id,
            numericValue: null,
            textValue: null,
            booleanValue: null,
            comment: null,
        },
    });

    const patchField = useCallback(async (value: Partial<ResultValueForm>) => {
        const payload: AddResultValuesRequest = {
            results: [{ ...form.getValues(), ...value }],
        };
        try {
            await LaboratoryRequestService.addResults(item.id, payload);
        } catch (error) {
            toast({ description: "Error al guardar resultado.", variant: "destructive" });
        }
    }, [item.id, form, toast]);

    const debouncers = useRef<NodeJS.Timeout>();

    const autosave = useCallback((value: Partial<ResultValueForm>) => {
        if (debouncers.current) clearTimeout(debouncers.current);
        debouncers.current = setTimeout(() => {
            patchField(value);
        }, 800);
    }, [patchField]);

    // This is a simplified input, in a real scenario you would have different inputs based on parameter.valueType
    return (
        <Form {...form}>
            <FormField
                control={form.control}
                name="textValue"
                render={({ field }) => (
                    <Input
                        {...field}
                        placeholder="Ingresar resultado..."
                        value={field.value ?? ""}
                        onChange={(e) => {
                            field.onChange(e.target.value);
                            autosave({ textValue: e.target.value });
                        }}
                    />
                )}
            />
        </Form>
    );
};

export default function LaboratoryRequestForm({ detail }: Props) {
    return (
        <div className="space-y-6">
            {detail.items.map(item => (
                <Card key={item.id}>
                    <CardHeader>
                        <CardTitle>{item.testName} ({item.testCode})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <h4 className="font-medium">Parámetros</h4>
                            {item.parameters.map(param => (
                                <div key={param.id} className="grid grid-cols-2 gap-4 items-center">
                                    <p>{param.name}</p>
                                    <ResultInput item={item} parameter={param} />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
