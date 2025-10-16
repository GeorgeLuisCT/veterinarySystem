"use client";

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, Syringe, Package, PlusCircle, ClipboardList, Building, Stethoscope } from "lucide-react";

import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { useToast } from "@/hooks/use-toast";

import SurgicalReportService from "../../service/surgical-report-service";
import { SurgicalReportDetailResponse } from "../../types/surgical-report-response";
import { updateSurgicalReportSchema, UpdateSurgicalReportRequest } from "../../types/surgical-report-request";
import { SurgicalReportStatusOptions } from "../../enums/surgical-report-status";
import { AnestheticPhaseLabels } from "../../enums/anesthetic-phase";
import { ProductUnitTypeLabels } from "@/app/dashboard/inventory/products/enums/product-unit-type";
import { AdministrationRouteLabels } from "@/app/dashboard/inventory/products/enums/administration-route";
import { FrequencyUnitLabels } from "../../enums/frequency-unit";

import { AddAnestheticDrugModal } from "../../components/operating-room/add-anesthetic-drug-modal";
import { AddMaterialModal } from "../../components/operating-room/add-material-modal";
import { AddPostOpIndicationModal } from "../../components/operating-room/add-post-op-indication-modal";

export type Option = { value: string; label: string };

const toInputDateTime = (v?: string | null) => {
    if (!v) return "";
    const s = v.trim();
    const noZone = s.replace(/([+-]\d{2}:?\d{2}|Z)$/i, "");
    return noZone.slice(0, 16);
};

const fromInputDateTime = (v?: string | null) => {
    if (!v || v === "") return null;
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(v) ? v : `${v}:00`;
};


export interface SurgicalReportFormHandle {
    triggerSaveAll: () => Promise<void>;
}

interface Props {
    reportId: number;
    detail: SurgicalReportDetailResponse;
    setDetail: (d: SurgicalReportDetailResponse) => void;
    optionsLoading: boolean;
    surgeonOptions: Option[];
    anesthetistOptions: Option[];
    assistantOptions: Option[];
    operatingRoomOptions: Option[];
}

type FormShape = UpdateSurgicalReportRequest;

const SurgicalReportForm = forwardRef<SurgicalReportFormHandle, Props>(({
    reportId,
    detail,
    setDetail,
    optionsLoading,
    surgeonOptions,
    anesthetistOptions,
    assistantOptions,
    operatingRoomOptions,
}, ref) => {
    const { toast } = useToast();

    const [openAnestheticDrug, setOpenAnestheticDrug] = useState(false);
    const [openMaterial, setOpenMaterial] = useState(false);
    const [openPostOpIndication, setOpenPostOpIndication] = useState(false);

    const form = useForm<FormShape>({
        resolver: zodResolver(updateSurgicalReportSchema),
        defaultValues: {
            version: detail.version,
            status: detail.status,
            surgeryStartAt: detail.surgeryStartAt ?? null,
            surgeryEndAt: detail.surgeryEndAt ?? null,
            surgeonId: detail.surgeonId ?? null,
            anesthesiologistId: detail.anesthesiologistId ?? null,
            assistantId: detail.assistantId ?? null,
            operatingRoomId: detail.operatingRoomId ?? null,
            monitoring: detail.monitoring ?? null,
            findings: detail.findings ?? null,
            surgicalTechniqueDescription: detail.surgicalTechniqueDescription ?? null,
        },
        mode: "onChange",
    });

    const versionRef = useRef<number>(detail.version);

    useEffect(() => {
        form.reset({
            version: detail.version,
            status: detail.status,
            surgeryStartAt: detail.surgeryStartAt ?? null,
            surgeryEndAt: detail.surgeryEndAt ?? null,
            surgeonId: detail.surgeonId ?? null,
            anesthesiologistId: detail.anesthesiologistId ?? null,
            assistantId: detail.assistantId ?? null,
            operatingRoomId: detail.operatingRoomId ?? null,
            monitoring: detail.monitoring ?? null,
            findings: detail.findings ?? null,
            surgicalTechniqueDescription: detail.surgicalTechniqueDescription ?? null,
        });
        versionRef.current = detail.version;
    }, [detail, form]);

    const patchField = useCallback(
        async (field: keyof Omit<FormShape, "version">, value: unknown) => {
            const body: UpdateSurgicalReportRequest = { version: versionRef.current } as UpdateSurgicalReportRequest;
            (body as any)[field] = value === "" ? null : value;
            const res = await SurgicalReportService.patch(reportId, body);
            versionRef.current = res.version;
            form.setValue("version", res.version, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
            if ((res as any).updated && (res as any).updated[field as string] !== undefined) {
                form.setValue(field as any, (res as any).updated[field as string], { shouldDirty: false });
            }
        },
        [form, reportId]
    );

    const debouncers = useRef<Record<string, NodeJS.Timeout>>({});
    const autosave = useCallback((field: keyof Omit<FormShape, "version">, value: unknown) => {
        const key = String(field);
        if (debouncers.current[key]) clearTimeout(debouncers.current[key]);
        debouncers.current[key] = setTimeout(() => {
            patchField(field, value).catch(() => {
                toast({ variant: "destructive", description: "Conflicto de edición. Se revirtió el campo." });
            });
        }, 600);
    }, [patchField, toast]);

    const saveAll = useCallback(async (values: FormShape) => {
        if (values.surgeryStartAt && values.surgeryEndAt) {
            if (values.surgeryEndAt < values.surgeryStartAt) {
                toast({ variant: "destructive", description: "La hora de fin no puede ser anterior al inicio." });
                return;
            }
        }
        const payload: UpdateSurgicalReportRequest = {
            version: versionRef.current,
            status: values.status ?? null,
            surgeryStartAt: values.surgeryStartAt ? fromInputDateTime(values.surgeryStartAt) : null,
            surgeryEndAt: values.surgeryEndAt ? fromInputDateTime(values.surgeryEndAt) : null,
            surgeonId: values.surgeonId ?? null,
            anesthesiologistId: values.anesthesiologistId ?? null,
            assistantId: values.assistantId ?? null,
            operatingRoomId: values.operatingRoomId ?? null,
            monitoring: values.monitoring ?? null,
            findings: values.findings ?? null,
            surgicalTechniqueDescription: values.surgicalTechniqueDescription ?? null,
        };
        const res = await SurgicalReportService.patch(reportId, payload);
        versionRef.current = res.version;
        form.setValue("version", res.version, { shouldDirty: false });
    }, [form, reportId, toast]);


    useImperativeHandle(ref, () => ({
        triggerSaveAll: () => form.handleSubmit(saveAll)(),
    }), [form, saveAll]);

    const anesthesiaEmpty = detail?.anestheticProtocol.length === 0;
    const materialsEmpty = detail?.materialsUsed.length === 0;
    const postOpEmpty = detail?.postOperativeIndications.length === 0;

    return (
        <Form {...form}>
            <form className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Detalles de la cirugía</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <FormField
                            control={form.control}
                            name="surgeryStartAt"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <FloatingLabelInput
                                            id="surgeryStartAt"
                                            label="Inicio de cirugía"
                                            type="datetime-local"
                                            value={toInputDateTime(field.value)}
                                            onChange={(value) => {
                                                const normalized = fromInputDateTime(value ?? null);
                                                field.onChange(normalized);
                                                autosave("surgeryStartAt", normalized);
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="surgeryEndAt"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <FloatingLabelInput
                                            id="surgeryEndAt"
                                            label="Fin de cirugía"
                                            type="datetime-local"
                                            value={toInputDateTime(field.value)}
                                            onChange={(value) => {
                                                const normalized = fromInputDateTime(value ?? null);
                                                field.onChange(normalized);
                                                autosave("surgeryEndAt", normalized);
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <FloatingLabelSelect
                                            id="status"
                                            label="Estado del reporte"
                                            options={SurgicalReportStatusOptions}
                                            value={field.value ?? ""}
                                            onValueChange={(value) => {
                                                field.onChange(value || null);
                                                autosave("status", value || null);
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="operatingRoomId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <FloatingLabelSelect
                                            id="operatingRoomId"
                                            label="Quirófano"
                                            options={operatingRoomOptions}
                                            value={field.value ? String(field.value) : ""}
                                            onValueChange={(value) => {
                                                const v = value ? Number(value) : null;
                                                field.onChange(v);
                                                autosave("operatingRoomId", v);
                                            }}
                                            disabled={optionsLoading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="surgeonId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <FloatingLabelSelect
                                            id="surgeonId"
                                            label="Cirujano"
                                            options={surgeonOptions}
                                            value={field.value ? String(field.value) : ""}
                                            onValueChange={(value) => {
                                                const v = value ? Number(value) : null;
                                                field.onChange(v);
                                                autosave("surgeonId", v);
                                            }}
                                            disabled={optionsLoading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="anesthesiologistId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <FloatingLabelSelect
                                            id="anesthesiologistId"
                                            label="Anestesista"
                                            options={anesthetistOptions}
                                            value={field.value ? String(field.value) : ""}
                                            onValueChange={(value) => {
                                                const v = value ? Number(value) : null;
                                                field.onChange(v);
                                                autosave("anesthesiologistId", v);
                                            }}
                                            disabled={optionsLoading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="assistantId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <FloatingLabelSelect
                                            id="assistantId"
                                            label="Asistente"
                                            options={assistantOptions}
                                            value={field.value ? String(field.value) : ""}
                                            onValueChange={(value) => {
                                                const v = value ? Number(value) : null;
                                                field.onChange(v);
                                                autosave("assistantId", v);
                                            }}
                                            disabled={optionsLoading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-2">
                            <Syringe className="h-5 w-5 text-blue-600" />
                            <CardTitle>Protocolo anestésico</CardTitle>
                        </div>
                        <Button type="button" variant="outline" onClick={() => setOpenAnestheticDrug(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Agregar fármaco
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {anesthesiaEmpty ? (
                            <p className="text-sm text-muted-foreground">No se registraron fármacos anestésicos. Puedes agregar uno utilizando el botón superior.</p>
                        ) : (
                            detail.anestheticProtocol.map((drug) => (
                                <div key={drug.id} className="rounded-lg border bg-white p-3 shadow-sm">
                                    <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                                        <p className="font-semibold text-slate-900">{drug.productName ?? "Producto no registrado"}</p>
                                        <Badge variant="secondary">{AnestheticPhaseLabels[drug.phase]}</Badge>
                                    </div>
                                    <div className="mt-2 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                                        <div className="flex items-center gap-2">
                                            <Building className="h-4 w-4 text-purple-500" />
                                            Fase: {AnestheticPhaseLabels[drug.phase]}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <ClipboardList className="h-4 w-4 text-blue-500" />
                                            <span>
                                                Dosis: {drug.doseAmount !== null && drug.doseUnit ? `${drug.doseAmount} ${ProductUnitTypeLabels[drug.doseUnit]}` : "No especificada"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Syringe className="h-4 w-4 text-emerald-500" />
                                            <span>Vía: {drug.route ? AdministrationRouteLabels[drug.route] : "No especificada"}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-blue-600" />
                            <CardTitle>Materiales utilizados</CardTitle>
                        </div>
                        <Button type="button" variant="outline" onClick={() => setOpenMaterial(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Agregar material
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {materialsEmpty ? (
                            <p className="text-sm text-muted-foreground">Aún no registras materiales utilizados durante el procedimiento.</p>
                        ) : (
                            detail.materialsUsed.map((material) => (
                                <div key={material.id} className="flex items-center justify-between rounded-lg border bg-white p-3 shadow-sm">
                                    <div>
                                        <p className="font-semibold text-slate-900">{material.productName ?? material.unregisteredProductName ?? "Material sin nombre"}</p>
                                        {material.productName && material.unregisteredProductName && (
                                            <p className="text-xs text-muted-foreground">Alias: {material.unregisteredProductName}</p>
                                        )}
                                    </div>
                                    <Badge variant="outline">x{material.quantity}</Badge>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-2">
                            <Stethoscope className="h-5 w-5 text-blue-600" />
                            <CardTitle>Indicaciones post operatorias</CardTitle>
                        </div>
                        <Button type="button" variant="outline" onClick={() => setOpenPostOpIndication(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Agregar indicación
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {postOpEmpty ? (
                            <p className="text-sm text-muted-foreground">Todavía no hay indicaciones registradas para el post operatorio.</p>
                        ) : (
                            detail.postOperativeIndications.map((indication) => (
                                <div key={indication.id} className="rounded-lg border bg-white p-3 shadow-sm">
                                    <p className="font-semibold text-slate-900">{indication.productName ?? indication.nonDrugInstruction ?? "Indicacion sin título"}</p>
                                    <div className="mt-2 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                                        {indication.productName && (
                                            <div>
                                                Dosis: {indication.doseAmount !== null && indication.doseUnit ? `${indication.doseAmount} ${ProductUnitTypeLabels[indication.doseUnit]}` : "No especificada"}
                                            </div>
                                        )}
                                        {indication.frequencyValue !== null && indication.frequencyUnit && (
                                            <div>Frecuencia: {indication.frequencyValue} {FrequencyUnitLabels[indication.frequencyUnit]}</div>
                                        )}
                                        {indication.route && <div>Vía: {AdministrationRouteLabels[indication.route]}</div>}
                                        {indication.nonDrugInstruction && <div className="sm:col-span-2 text-muted-foreground">{indication.nonDrugInstruction}</div>}
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Monitoreo</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <FormField
                            control={form.control}
                            name="monitoring"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Textarea
                                            id="monitoring"
                                            rows={4}
                                            value={field.value ?? ""}
                                            onChange={(event) => {
                                                const v = event.target.value === "" ? null : event.target.value;
                                                field.onChange(v);
                                                autosave("monitoring", v);
                                            }}
                                            placeholder="Especifica los parámetros de monitoreo utilizados durante la cirugía."
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Hallazgos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <FormField
                            control={form.control}
                            name="findings"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Textarea
                                            id="findings"
                                            rows={4}
                                            value={field.value ?? ""}
                                            onChange={(event) => {
                                                const v = event.target.value === "" ? null : event.target.value;
                                                field.onChange(v);
                                                autosave("findings", v);
                                            }}
                                            placeholder="Describe los hallazgos relevantes del procedimiento."
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Descripción de la técnica quirúrgica</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <FormField
                            control={form.control}
                            name="surgicalTechniqueDescription"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Textarea
                                            id="surgicalTechniqueDescription"
                                            rows={6}
                                            value={field.value ?? ""}
                                            onChange={(event) => {
                                                const v = event.target.value === "" ? null : event.target.value;
                                                field.onChange(v);
                                                autosave("surgicalTechniqueDescription", v);
                                            }}
                                            placeholder="Detalla los pasos principales del procedimiento quirúrgico."
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
            </form>

            {openAnestheticDrug && <AddAnestheticDrugModal
                reportId={reportId}
                open={openAnestheticDrug}
                onClose={() => setOpenAnestheticDrug(false)}
                onAdded={(updated) => {
                    setDetail(updated);
                    form.setValue("version", updated.version, { shouldDirty: false });
                    versionRef.current = updated.version;
                }}
            />}
            {openMaterial && <AddMaterialModal
                reportId={reportId}
                open={openMaterial}
                onClose={() => setOpenMaterial(false)}
                onAdded={(updated) => {
                    setDetail(updated);
                    form.setValue("version", updated.version, { shouldDirty: false });
                    versionRef.current = updated.version;
                }}
            />}
            {openPostOpIndication && <AddPostOpIndicationModal
                reportId={reportId}
                open={openPostOpIndication}
                onClose={() => setOpenPostOpIndication(false)}
                onAdded={(updated) => {
                    setDetail(updated);
                    form.setValue("version", updated.version, { shouldDirty: false });
                    versionRef.current = updated.version;
                }}
            />}
        </Form>
    );
});

SurgicalReportForm.displayName = "SurgicalReportForm";
export default SurgicalReportForm;
