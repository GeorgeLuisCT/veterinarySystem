"use client";

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Syringe, Package, PlusCircle, ClipboardList, Building, Stethoscope, Check, ArrowRight, Ban, Pill, FileQuestion } from "lucide-react";

import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

import SurgicalReportService from "../../service/surgical-report-service";
import { SurgicalReportDetailResponse } from "../../types/surgical-report-response";
import { updateSurgicalReportSchema, UpdateSurgicalReportRequest } from "../../types/surgical-report-request";
import { SurgicalReportStatus, SurgicalReportStatusLabels } from "../../enums/surgical-report-status";
import { AnestheticPhase, AnestheticPhaseLabels } from "../../enums/anesthetic-phase";
import { ProductUnitTypeLabels } from "@/app/dashboard/inventory/products/enums/product-unit-type";
import { AdministrationRouteLabels } from "@/app/dashboard/inventory/products/enums/administration-route";
import { FrequencyUnitLabels } from "../../enums/frequency-unit";

import { AddAnestheticDrugModal } from "../../components/operating-room/add-anesthetic-drug-modal";
import { AddMaterialModal } from "../../components/operating-room/add-material-modal";
import { AddPostOpIndicationModal } from "../../components/operating-room/add-post-op-indication-modal";

// ⬇️ Usa el componente con fecha+hora
import { FloatingLabelDateInput } from "@/components/floating-label-date-input";
import { FloatingLabelSelect } from "@/components/floating-label-select";

export type Option = { value: string; label: string };

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
    className?: string;
}

type FormShape = UpdateSurgicalReportRequest;

// Normaliza a 'YYYY-MM-DDTHH:mm:ss' (si viene solo fecha o sin segundos)
const normalizeNaiveIso = (v?: string | null) => {
    if (!v) return null;
    const s = v.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s}T00:00:00`;
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) return `${s}:00`;
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(s)) return s;
    // fallback: recorta a 19 chars si trae zona
    return s.replace(/([+-]\d{2}:?\d{2}|Z)$/i, "").slice(0, 19);
};

// Orden canónico de avance (excluye CANCELLED)
const STATUS_FLOW: SurgicalReportStatus[] = [
    SurgicalReportStatus.DRAFT,
    SurgicalReportStatus.IN_PROGRESS,
    SurgicalReportStatus.READY_TO_BILL,
    SurgicalReportStatus.COMPLETED,
];

const getNextStatus = (current?: SurgicalReportStatus | null): SurgicalReportStatus | null => {
    if (!current) return SurgicalReportStatus.IN_PROGRESS;
    if (current === SurgicalReportStatus.CANCELLED) return null;
    const idx = STATUS_FLOW.indexOf(current);
    if (idx === -1) return null;
    return STATUS_FLOW[idx + 1] ?? null;
};

const SurgicalReportForm = forwardRef<SurgicalReportFormHandle, Props>(
    (
        {
            reportId,
            detail,
            setDetail,
            optionsLoading,
            surgeonOptions,
            anesthetistOptions,
            assistantOptions,
            operatingRoomOptions,
            className
        },
        ref
    ) => {
        const { toast } = useToast();

        const [openAnestheticDrug, setOpenAnestheticDrug] = useState(false);
        const [openMaterial, setOpenMaterial] = useState(false);
        const [openPostOpIndication, setOpenPostOpIndication] = useState(false);

        const form = useForm<FormShape>({
            resolver: zodResolver(updateSurgicalReportSchema),
            defaultValues: {
                version: detail.version,
                status: detail.status,
                surgeryStartAt: normalizeNaiveIso(detail.surgeryStartAt),
                surgeryEndAt: normalizeNaiveIso(detail.surgeryEndAt),
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
                surgeryStartAt: normalizeNaiveIso(detail.surgeryStartAt),
                surgeryEndAt: normalizeNaiveIso(detail.surgeryEndAt),
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
                return res;
            },
            [form, reportId]
        );

        const debouncers = useRef<Record<string, NodeJS.Timeout>>({});
        const autosave = useCallback(
            (field: keyof Omit<FormShape, "version">, value: unknown) => {
                const key = String(field);
                if (debouncers.current[key]) clearTimeout(debouncers.current[key]);
                debouncers.current[key] = setTimeout(() => {
                    patchField(field, value).catch(() => {
                        toast({ variant: "destructive", description: "Conflicto de edición. Se revirtió el campo." });
                    });
                }, 600);
            },
            [patchField, toast]
        );

        const saveAll = useCallback(
            async (values: FormShape) => {
                // Validación usando timestamps locales
                if (values.surgeryStartAt && values.surgeryEndAt) {
                    const start = new Date(values.surgeryStartAt).getTime();
                    const end = new Date(values.surgeryEndAt).getTime();
                    if (!Number.isNaN(start) && !Number.isNaN(end) && end < start) {
                        toast({ variant: "destructive", description: "La fecha/hora de fin no puede ser anterior al inicio." });
                        return;
                    }
                }
                const payload: UpdateSurgicalReportRequest = {
                    version: versionRef.current,
                    status: values.status ?? null,
                    surgeryStartAt: normalizeNaiveIso(values.surgeryStartAt) as string | null,
                    surgeryEndAt: normalizeNaiveIso(values.surgeryEndAt) as string | null,
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
            },
            [form, reportId, toast]
        );

        useImperativeHandle(
            ref,
            () => ({
                triggerSaveAll: () => form.handleSubmit(saveAll)(),
            }),
            [form, saveAll]
        );

        // ⬇️ Acciones de estado (avanzar y cancelar)
        const advanceStatus = useCallback(async () => {
            const current = form.getValues("status") as SurgicalReportStatus | null | undefined;
            const next = getNextStatus(current ?? null);
            if (!next) return;
            try {
                const res = await patchField("status", next);
                form.setValue("status", next, { shouldDirty: false });
                toast({ description: `Estado actualizado a "${SurgicalReportStatusLabels[next]}".` });
            } catch {
                toast({ variant: "destructive", description: "No se pudo actualizar el estado." });
            }
        }, [form, patchField, toast]);

        const cancelReport = useCallback(async () => {
            const confirmed = window.confirm("¿Seguro que deseas marcar este reporte como Cancelado?");
            if (!confirmed) return;
            try {
                const res = await patchField("status", SurgicalReportStatus.CANCELLED);
                form.setValue("status", SurgicalReportStatus.CANCELLED, { shouldDirty: false });
                toast({ description: `Estado actualizado a "${SurgicalReportStatusLabels[SurgicalReportStatus.CANCELLED]}".` });
            } catch {
                toast({ variant: "destructive", description: "No se pudo cancelar el reporte." });
            }
        }, [form, patchField, toast]);

        const currentStatus = (form.watch("status") ??
            detail.status ??
            SurgicalReportStatus.DRAFT) as SurgicalReportStatus;
        const nextStatus = getNextStatus(currentStatus);
        const isTerminal = currentStatus === SurgicalReportStatus.COMPLETED || currentStatus === SurgicalReportStatus.CANCELLED;

        const anesthesiaEmpty = detail?.anestheticProtocol.length === 0;
        const materialsEmpty = detail?.materialsUsed.length === 0;
        const postOpEmpty = detail?.postOperativeIndications.length === 0;

        return (
            <div className={className}>
                <Form {...form}>
                    <form className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Detalles de la cirugía</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {/* ⬇️ INICIO (fecha y hora) */}
                                <FormField
                                    control={form.control}
                                    name="surgeryStartAt"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <FloatingLabelDateInput
                                                    id="surgeryStartAt"
                                                    label="Inicio (fecha y hora)"
                                                    value={field.value ?? ""}
                                                    onChange={(iso) => {
                                                        const normalized = normalizeNaiveIso(iso);
                                                        field.onChange(normalized);
                                                        autosave("surgeryStartAt", normalized);
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* ⬇️ FIN (fecha y hora) */}
                                <FormField
                                    control={form.control}
                                    name="surgeryEndAt"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <FloatingLabelDateInput
                                                    id="surgeryEndAt"
                                                    label="Fin (fecha y hora)"
                                                    value={field.value ?? ""}
                                                    onChange={(iso) => {
                                                        const normalized = normalizeNaiveIso(iso);
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
                                    name="assistantId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                {/* @ts-ignore */}
                                                <FloatingLabelSelect
                                                    id="assistantId"
                                                    label="Asistente"
                                                    options={assistantOptions}
                                                    value={field.value ? String(field.value) : ""}
                                                    onValueChange={(value: string) => {
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
                                <FormField
                                    control={form.control}
                                    name="operatingRoomId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <div className="w-full">
                                                    <FloatingLabelSelect
                                                        id="operatingRoomId"
                                                        label="Quirófano"
                                                        options={operatingRoomOptions}
                                                        value={field.value ? String(field.value) : ""}
                                                        onValueChange={(value: string) => {
                                                            const v = value ? Number(value) : null;
                                                            field.onChange(v);
                                                            autosave("operatingRoomId", v);
                                                        }}
                                                        disabled={optionsLoading}
                                                    />
                                                </div>
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
                                                {/* @ts-ignore */}
                                                <FloatingLabelSelect
                                                    id="surgeonId"
                                                    label="Cirujano"
                                                    options={surgeonOptions}
                                                    value={field.value ? String(field.value) : ""}
                                                    onValueChange={(value: string) => {
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
                                                {/* @ts-ignore */}
                                                <FloatingLabelSelect
                                                    id="anesthesiologistId"
                                                    label="Anestesista"
                                                    options={anesthetistOptions}
                                                    value={field.value ? String(field.value) : ""}
                                                    onValueChange={(value: string) => {
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

                                {/* ⬇️ Estado (badge + acciones) */}
                                <div className="flex flex-col gap-2">
                                    <span className="text-sm text-primary">Estado del reporte</span>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={currentStatus === SurgicalReportStatus.CANCELLED ? "destructive" : "secondary"}>
                                            {SurgicalReportStatusLabels[currentStatus]}
                                        </Badge>

                                        {/* Avanzar al siguiente */}
                                        {nextStatus && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={advanceStatus}
                                                disabled={currentStatus === SurgicalReportStatus.CANCELLED}
                                                className="flex items-center gap-1"
                                            >
                                                <ArrowRight className="h-4 w-4" />
                                                Avanzar a {SurgicalReportStatusLabels[nextStatus]}
                                            </Button>
                                        )}

                                        {/* Cancelar */}
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={cancelReport}
                                            disabled={currentStatus === SurgicalReportStatus.CANCELLED}
                                            className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Ban className="h-4 w-4" />
                                            Cancelar
                                        </Button>
                                    </div>
                                    {/* Hint para flujo desde borrador */}
                                    {currentStatus === SurgicalReportStatus.DRAFT && (
                                        <p className="text-xs text-muted-foreground">
                                            Desde <strong>Borrador</strong> puedes avanzar a <em>En progreso</em> o cancelar.
                                        </p>
                                    )}
                                </div>


                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div className="flex items-center gap-2">
                                    <Syringe className="h-5 w-5 text-blue-600" aria-hidden="true" />
                                    <CardTitle>Protocolo anestésico</CardTitle>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setOpenAnestheticDrug(true)}
                                    aria-label="Agregar fármaco anestésico"
                                >
                                    <PlusCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                                    Agregar fármaco
                                </Button>
                            </CardHeader>

                            <CardContent>
                                {(!detail.anestheticProtocol || detail.anestheticProtocol.length === 0) ? (
                                    <p className="text-sm text-muted-foreground">
                                        No se registraron fármacos anestésicos. Usa “Agregar fármaco”.
                                    </p>
                                ) : (
                                    <div className="grid gap-6 md:grid-cols-3">
                                        {[
                                            AnestheticPhase.PREMEDICATION,
                                            AnestheticPhase.INDUCTION,
                                            AnestheticPhase.MAINTENANCE,
                                        ].map((phase) => {
                                            const list = (detail.anestheticProtocol ?? []).filter((d) => d.phase === phase);

                                            // Frase segura con type-narrowing para doseUnit (puede ser null) y route (puede ser null)
                                            const lineText = (drug: (typeof detail.anestheticProtocol)[number]) => {
                                                const name = drug.productName ?? "Producto no registrado";

                                                const hasAmount = drug.doseAmount != null;
                                                const unitKey = (drug.doseUnit ?? undefined) as keyof typeof ProductUnitTypeLabels | undefined;
                                                const dosePart =
                                                    hasAmount && unitKey
                                                        ? `${drug.doseAmount} ${ProductUnitTypeLabels[unitKey].toLowerCase()} de ${name}`
                                                        : name;

                                                const routeKey = (drug.route ?? undefined) as keyof typeof AdministrationRouteLabels | undefined;
                                                const routePart = routeKey ? `vía ${AdministrationRouteLabels[routeKey].toLowerCase()}` : undefined;

                                                return routePart ? `${dosePart}  ${routePart}` : dosePart;
                                            };

                                            return (
                                                <section
                                                    key={phase}
                                                    aria-labelledby={`phase-${phase}`}
                                                    className="rounded-xl border p-3"
                                                >
                                                    <h3
                                                        id={`phase-${phase}`}
                                                        className="mb-2 flex items-center gap-2 text-sm font-semibold"
                                                    >
                                                        <span className="inline-flex h-2 w-2 rounded-full bg-blue-600" aria-hidden="true" />
                                                        {AnestheticPhaseLabels[phase]}
                                                    </h3>

                                                    {list.length === 0 ? (
                                                        <p className="text-xs text-muted-foreground">Sin registros.</p>
                                                    ) : (
                                                        <ul className="list-disc space-y-1 pl-5">
                                                            {list.map((drug) => (
                                                                <li key={drug.id} className="text-sm text-slate-700">
                                                                    {lineText(drug)}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </section>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div className="flex items-center gap-2">
                                    <Package className="h-5 w-5 text-blue-600" aria-hidden="true" />
                                    <CardTitle id="materials-heading">Materiales utilizados</CardTitle>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setOpenMaterial(true)}
                                    aria-label="Agregar material utilizado"
                                >
                                    <PlusCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                                    Agregar material
                                </Button>
                            </CardHeader>

                            <CardContent>
                                {materialsEmpty ? (
                                    <p className="text-sm text-muted-foreground">
                                        Aún no registras materiales utilizados durante el procedimiento.
                                    </p>
                                ) : (
                                    <section className="rounded-xl border p-3" aria-labelledby="materials-heading">
                                        {/* lista sin bullets para usar iconos personalizados */}
                                        <ul role="list" className="space-y-2">
                                            {detail.materialsUsed.map((material) => {
                                                const name =
                                                    material.productName ??
                                                    material.unregisteredProductName ??
                                                    "Material sin nombre";

                                                const unitKey = (material.unitType ?? undefined) as
                                                    | keyof typeof ProductUnitTypeLabels
                                                    | undefined;

                                                const line = unitKey
                                                    ? `${material.quantity} ${ProductUnitTypeLabels[unitKey].toLowerCase()} de ${name}`
                                                    : `x${material.quantity} ${name}`;

                                                const isCatalog = Boolean(material.productName);

                                                return (
                                                    <li key={material.id} className="text-sm">
                                                        <div className="flex items-start gap-3">
                                                            {/* icono sutil según sea de catálogo o no */}
                                                            <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center" aria-hidden="true">
                                                                {isCatalog ? (
                                                                    <Package className="h-4 w-4 text-emerald-600" />
                                                                ) : (
                                                                    <FileQuestion className="h-4 w-4 text-slate-500" />
                                                                )}
                                                            </span>

                                                            <div className="min-w-0">
                                                                <span className="font-medium text-slate-700">{line}</span>
                                                                {material.productName && material.unregisteredProductName && (
                                                                    <span className="ml-2 text-xs text-">
                                                                        (alias: {material.unregisteredProductName})
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </section>
                                )}
                            </CardContent>
                        </Card>


                        <Card>
                            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div className="flex items-center gap-2">
                                    <Stethoscope className="h-5 w-5 text-blue-600" aria-hidden="true" />
                                    <CardTitle id="postop-heading">Indicaciones post operatorias</CardTitle>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setOpenPostOpIndication(true)}
                                    aria-label="Agregar indicación post operatoria"
                                >
                                    <PlusCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                                    Agregar indicación
                                </Button>
                            </CardHeader>

                            <CardContent>
                                {postOpEmpty ? (
                                    <p className="text-sm text-muted-foreground">
                                        Todavía no hay indicaciones registradas para el post operatorio.
                                    </p>
                                ) : (
                                    <section className="rounded-xl border p-3" aria-labelledby="postop-heading">
                                        <ul role="list" className="space-y-2">
                                            {detail.postOperativeIndications.map((indication) => {
                                                const isMed = Boolean(indication.productName);

                                                // Normalizar claves opcionales (pueden venir null)
                                                const unitKey = (indication.doseUnit ?? undefined) as keyof typeof ProductUnitTypeLabels | undefined;
                                                const routeKey = (indication.route ?? undefined) as keyof typeof AdministrationRouteLabels | undefined;
                                                const freqKey = (indication.frequencyUnit ?? undefined) as keyof typeof FrequencyUnitLabels | undefined;

                                                // Construir línea principal
                                                let mainLine: string;
                                                if (isMed) {
                                                    const name = indication.productName!;
                                                    const hasAmount = indication.doseAmount != null;
                                                    const dosePart =
                                                        hasAmount && unitKey
                                                            ? `${indication.doseAmount} ${ProductUnitTypeLabels[unitKey].toLowerCase()} de ${name}`
                                                            : name;

                                                    const routePart = routeKey ? `vía ${AdministrationRouteLabels[routeKey].toLowerCase()}` : undefined;
                                                    const freqPart =
                                                        indication.frequencyValue != null && freqKey
                                                            ? `cada ${indication.frequencyValue} ${FrequencyUnitLabels[freqKey].toLowerCase()}`
                                                            : undefined;

                                                    const parts = [dosePart, routePart, freqPart].filter(Boolean);
                                                    mainLine = parts.join(" ");
                                                } else {
                                                    mainLine = indication.nonDrugInstruction ?? "Indicación sin título";
                                                }

                                                return (
                                                    <li key={indication.id} className="text-sm">
                                                        <div className="flex items-start gap-3">
                                                            {/* Ícono sutil según tipo */}
                                                            <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center" aria-hidden="true">
                                                                {isMed ? (
                                                                    <Pill className="h-4 w-4 text-emerald-600" />
                                                                ) : (
                                                                    <ClipboardList className="h-4 w-4 text-slate-500" />
                                                                )}
                                                            </span>

                                                            {/* Contenido */}
                                                            <div className="min-w-0">
                                                                <p className="font-medium text-slate-700">{mainLine}</p>

                                                                {/* Si es medicación y hay además una instrucción/nota, muéstrala debajo */}
                                                                {isMed && indication.nonDrugInstruction && (
                                                                    <p className="text-xs text-muted-foreground">{indication.nonDrugInstruction}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </section>
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

                    {openAnestheticDrug && (
                        <AddAnestheticDrugModal
                            reportId={reportId}
                            open={openAnestheticDrug}
                            onClose={() => setOpenAnestheticDrug(false)}
                            onAdded={(updated) => {
                                setDetail(updated);
                                form.setValue("version", updated.version, { shouldDirty: false });
                                versionRef.current = updated.version;
                            }}
                        />
                    )}
                    {openMaterial && (
                        <AddMaterialModal
                            reportId={reportId}
                            open={openMaterial}
                            onClose={() => setOpenMaterial(false)}
                            onAdded={(updated) => {
                                setDetail(updated);
                                form.setValue("version", updated.version, { shouldDirty: false });
                                versionRef.current = updated.version;
                            }}
                        />
                    )}
                    {openPostOpIndication && (
                        <AddPostOpIndicationModal
                            reportId={reportId}
                            open={openPostOpIndication}
                            onClose={() => setOpenPostOpIndication(false)}
                            onAdded={(updated) => {
                                setDetail(updated);
                                form.setValue("version", updated.version, { shouldDirty: false });
                                versionRef.current = updated.version;
                            }}
                        />
                    )}
                </Form>
            </div>
        );
    }
);

SurgicalReportForm.displayName = "SurgicalReportForm";
export default SurgicalReportForm;
