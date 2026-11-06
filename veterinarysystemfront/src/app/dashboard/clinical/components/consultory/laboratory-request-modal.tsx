"use client";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    addClinicalAttentionLaboratorySchema,
    AddClinicalAttentionLaboratoryRequest,
} from "../../types/clinical-attention-request";
import { LabRequestStatus } from "@/app/dashboard/clinical/enums/lab-request-status";
import { ClinicalAttentionService } from "../../service/clinical-attention-service";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useMemo, useState } from "react";
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from "@/components/ui/form";
import { ClinicalAttentionDetailResponse } from "../../types/clinical-attention-response";
import LaboratoryTestService from "../../service/laboratory-test-service";
import { LaboratoryTestQuickSearchResponse } from "../../types/laboratory-test-response";
import { LaboratoryResponse } from "../../../branche/types/laboratory-response";
import LaboratoryService from "../../../branche/services/laboratory-service";
import { useUser } from "@/context/user-context";
import { PlusCircle, Trash2 } from "lucide-react";

type CommonProps = { id: number; onClose: () => void; onAdded: (data: ClinicalAttentionDetailResponse) => void };

export function LaboratoryRequestModal({ id, onClose, onAdded }: CommonProps) {
    const { userInfo } = useUser();
    const [laboratories, setLaboratories] = useState<LaboratoryResponse[]>([]);
    const [submitting, setSubmitting] = useState(false);

    // opciones por fila: rowIndex -> opciones para ese select
    const [testOptionsMap, setTestOptionsMap] = useState<Record<number, { value: string; label: string }[]>>({});

    const form = useForm<AddClinicalAttentionLaboratoryRequest>({
        resolver: zodResolver(addClinicalAttentionLaboratorySchema),
        defaultValues: {
            requestingEmployeeId: userInfo?.employeeId || null,
            status: LabRequestStatus.REQUESTED,
            createdAt: new Date().toISOString(),
            laboratoryId: undefined,
            clinicalNotes: "",
            items: [],
        },
        mode: "onChange",
    });

    const { fields, append, remove, replace } = useFieldArray({ control: form.control, name: "items" });

    const laboratoryId = form.watch("laboratoryId");

    useEffect(() => {
        if (userInfo?.employeeId) form.setValue("requestingEmployeeId", userInfo.employeeId);
    }, [userInfo, form]);

    useEffect(() => {
        LaboratoryService.listAll().then(setLaboratories);
    }, []);

    // buscar pruebas (SIN debounce)
    const handleSearchTests = async (rowIndex: number, q: string) => {
        const qq = q.trim();
        if (!laboratoryId || qq.length < 2) {
            setTestOptionsMap((prev) => ({ ...prev, [rowIndex]: [] }));
            return;
        }
        try {
            const res: LaboratoryTestQuickSearchResponse[] = await LaboratoryTestService.quickSearch(qq, laboratoryId);
            const opts = res.map((t) => ({ value: String(t.id), label: `${t.name}` }));
            setTestOptionsMap((prev) => ({ ...prev, [rowIndex]: opts }));
        } catch {
            setTestOptionsMap((prev) => ({ ...prev, [rowIndex]: [] }));
        }
    };

    // al elegir prueba: llena testId, unitPrice usando getById y guarda el nombre
    const handleSelectTest = async (rowIndex: number, value?: string) => {
        if (!value) {
            form.setValue(`items.${rowIndex}.testId`, undefined as unknown as number, { shouldValidate: true });
            return;
        }
        const id = Number(value);
        try {
            const detail = await LaboratoryTestService.getById(id);
            form.setValue(`items.${rowIndex}.testId`, id, { shouldValidate: true });
            form.setValue(`items.${rowIndex}.unitPrice`, detail.price ?? 0, { shouldValidate: true });
            if (form.getValues(`items.${rowIndex}.quantity`) == null) {
                form.setValue(`items.${rowIndex}.quantity`, 1, { shouldValidate: true });
            }

        } catch {
            // si falla, dejamos los campos como estaban
        }
    };

    const addEmptyRow = () => {
        append({
            testId: undefined as unknown as number,
            unitPrice: 0,
            quantity: 1,
            notes: null,
        });
    };

    // Al cambiar laboratorio: limpiar y crear fila inicial
    useEffect(() => {
        replace([]);
        setTestOptionsMap({});

        if (laboratoryId) addEmptyRow();
    }, [laboratoryId, replace]);

    const onSubmit = async (values: AddClinicalAttentionLaboratoryRequest) => {
        setSubmitting(true);
        try {
            const res = await ClinicalAttentionService.addLaboratoryRequest(id, values);
            onAdded(res);
            onClose();
        } finally {
            setSubmitting(false);
        }
    };

    const laboratoryOptions = useMemo(
        () => laboratories.map((l) => ({ value: String(l.id), label: l.name })),
        [laboratories]
    );

    const hasLab = !!laboratoryId;

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="w-[min(92vw,900px)] max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-lg sm:max-w-3xl">
                <DialogHeader className="space-y-1">
                    <DialogTitle>Registrar solicitud de laboratorio</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        Selecciona el laboratorio, agrega las pruebas requeridas y deja observaciones clínicas si es necesario.
                    </p>
                </DialogHeader>

                <Form {...form}>
                    <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
                        {/* Laboratorio */}
                        <FormField
                            control={form.control}
                            name="laboratoryId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <div className="w-full">
                                            <FloatingLabelSelect
                                                id="laboratoryId"
                                                label="Laboratorio *"
                                                options={laboratoryOptions}
                                                value={field.value ? String(field.value) : ""}
                                                onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Ítems / Pruebas */}
                        <fieldset className="border-t pt-4 first:border-t-0 first:pt-0">
                            <legend className="mb-3 text-sm font-semibold text-foreground">Pruebas</legend>

                            {!hasLab ? (
                                <p className="text-sm text-muted-foreground">Primero selecciona un laboratorio para agregar pruebas.</p>
                            ) : (
                                <>
                                    <div className="mb-3 flex items-center justify-between">
                                        <p className="text-sm text-muted-foreground">Agrega una o más pruebas al pedido.</p>
                                        <Button type="button" size="sm" variant="secondary" className="gap-2" onClick={addEmptyRow}>
                                            <PlusCircle className="h-4 w-4" />
                                            Añadir prueba
                                        </Button>
                                    </div>

                                    {fields.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No hay pruebas agregadas.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {fields.map((row, index) => {
                                                return (
                                                    <div key={row.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 rounded-lg border p-3">
                                                        {/* Prueba */}
                                                        <div className="sm:col-span-5 min-w-0">
                                                            <FormField
                                                                control={form.control}
                                                                name={`items.${index}.testId`}
                                                                render={({ field: f }) => (
                                                                    <FormItem>
                                                                        <FormControl>
                                                                            <div className="w-full">
                                                                                <FloatingLabelSelect
                                                                                    id={`test-${index}`}
                                                                                    label="Prueba *"
                                                                                    placeholder="Buscar prueba…"
                                                                                    options={testOptionsMap[index] || []}
                                                                                    onSearch={(q) => handleSearchTests(index, q)}
                                                                                    value={f.value ? String(f.value) : ""}
                                                                                    onValueChange={(v) => handleSelectTest(index, v)}
                                                                                />
                                                                            </div>
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </div>

                                                        {/* Precio */}
                                                        <div className="sm:col-span-2 min-w-0">
                                                            <FormField
                                                                control={form.control}
                                                                name={`items.${index}.unitPrice`}
                                                                render={({ field: f }) => (
                                                                    <FormItem>
                                                                        <FormControl>
                                                                            <div className="w-full">
                                                                                <FloatingLabelInput
                                                                                    id={`price-${index}`}
                                                                                    label="Precio"
                                                                                    type="number"
                                                                                    step="0.01"
                                                                                    value={String(f.value ?? "")}
                                                                                    onChange={(v) => f.onChange(v === "" ? 0 : Number(v))}
                                                                                />
                                                                            </div>
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </div>

                                                        {/* Cantidad */}
                                                        <div className="sm:col-span-2 min-w-0">
                                                            <FormField
                                                                control={form.control}
                                                                name={`items.${index}.quantity`}
                                                                render={({ field: f }) => (
                                                                    <FormItem>
                                                                        <FormControl>
                                                                            <div className="w-full">
                                                                                <FloatingLabelInput
                                                                                    id={`qty-${index}`}
                                                                                    label="Cantidad"
                                                                                    type="number"
                                                                                    step="1"
                                                                                    value={String(f.value ?? "")}
                                                                                    onChange={(v) => f.onChange(v === "" ? 1 : Number(v))}
                                                                                />
                                                                            </div>
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </div>
                                                        {/* Subtotal + quitar */}
                                                        <div className="sm:col-span-1 flex items-center justify-between gap-2">
                                                            <div className="text-sm font-semibold tabular-nums">
                                                                {(
                                                                    Number(form.getValues(`items.${index}.quantity`) || 0) *
                                                                    Number(form.getValues(`items.${index}.unitPrice`) || 0)
                                                                ).toFixed(2)}
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                className="gap-1 text-destructive hover:text-destructive hover:bg-red-50 shrink-0"
                                                                onClick={() => remove(index)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                                Quitar
                                                            </Button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </>
                            )}
                        </fieldset>

                        {/* Notas clínicas */}
                        <FormField
                            control={form.control}
                            name="clinicalNotes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel htmlFor="clinicalNotes">Notas clínicas</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            id="clinicalNotes"
                                            rows={3}
                                            value={field.value ?? ""}
                                            onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.value)}
                                            placeholder="Ej.: Observaciones: ayuno 8 h; control en 48 h."
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter className="gap-2">
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? "Guardando..." : "Guardar"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
