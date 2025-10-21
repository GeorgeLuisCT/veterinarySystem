"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, RotateCcw, FileText, Save, ArrowRight, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LaboratoryRequestService } from "../../service/laboratory-request-service";
import LaboratoryRequestForm, { LaboratoryRequestFormHandle } from "../../components/laboratory/laboratory-request-form";
import { LaboratoryRequestDetailResponse } from "../../types/laboratory-request-response";
import PatientDetails from "../../components/consultory/patient-details";
import { LabRequestStatus, LabRequestStatusLabels } from "../../enums/lab-request-status";

export default function LaboratoryRequestDetailPage() {
    const params = useParams();
    const requestIdParam = params?.id;
    const { toast } = useToast();
    const [detail, setDetail] = useState<LaboratoryRequestDetailResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [savingAll, setSavingAll] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [canceling, setCanceling] = useState(false);
    const formRef = useRef<LaboratoryRequestFormHandle>(null);

    const fetchDetail = useCallback(
        async (idValue: number) => {
            setLoading(true);
            try {
                const res = await LaboratoryRequestService.getDetail(idValue);
                setDetail(res);
            } catch {
                toast({
                    variant: "destructive",
                    title: "No se pudo cargar la solicitud",
                    description: "Ocurrió un problema al obtener los datos.",
                });
            } finally {
                setLoading(false);
            }
        },
        [toast]
    );

    useEffect(() => {
        if (!requestIdParam) {
            setLoading(false);
            toast({
                variant: "destructive",
                title: "ID faltante",
                description: "No se proporcionó un identificador de solicitud.",
            });
            return;
        }
        const numericId = Number(Array.isArray(requestIdParam) ? requestIdParam[0] : requestIdParam);
        if (Number.isNaN(numericId)) {
            setLoading(false);
            toast({
                variant: "destructive",
                title: "Identificador inválido",
                description: "El identificador no es un número válido.",
            });
            return;
        }
        void fetchDetail(numericId);
    }, [requestIdParam, fetchDetail, toast]);

    const handleRefresh = async () => {
        if (!detail?.id) return;
        setRefreshing(true);
        try {
            await fetchDetail(detail.id);
            toast({ title: "Actualizado", description: "Se actualizaron los datos de la solicitud." });
        } finally {
            setRefreshing(false);
        }
    };

    const handleSaveAll = async () => {
        if (!formRef.current || !detail?.id) return;
        setSavingAll(true);
        try {
            await formRef.current.triggerSaveAll();
            toast({ title: "Cambios guardados", description: "Se guardaron todos los resultados y comentarios." });
            await fetchDetail(detail.id);
        } catch {
            toast({ variant: "destructive", title: "Error", description: "No se pudieron guardar todos los cambios." });
        } finally {
            setSavingAll(false);
        }
    };

    const getNextStatus = (status?: LabRequestStatus | string): LabRequestStatus | null => {
        switch (status) {
            case LabRequestStatus.REQUESTED:
                return LabRequestStatus.IN_PROGRESS;
            case LabRequestStatus.IN_PROGRESS:
                return LabRequestStatus.COMPLETED;
            default:
                return null;
        }
    };

    const nextStatus = getNextStatus(detail?.status as LabRequestStatus);
    const nextStatusLabel = nextStatus ? LabRequestStatusLabels[nextStatus] : null;

    const handleMarkNextStatus = async () => {
        if (!detail?.id || !nextStatus) return;
        setUpdatingStatus(true);
        try {
            const updated = await LaboratoryRequestService.updateStatus(detail.id, nextStatus);
            setDetail(updated);
            toast({
                title: "Estado actualizado",
                description: `La solicitud ahora está "${LabRequestStatusLabels[updated.status as LabRequestStatus]}".`,
            });
        } catch {
            toast({
                variant: "destructive",
                title: "No se pudo actualizar el estado",
                description: "Inténtalo nuevamente.",
            });
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleCancel = async () => {
        if (!detail?.id) return;
        const ok = confirm("¿Confirmas cancelar esta solicitud?");
        if (!ok) return;
        setCanceling(true);
        try {
            const updated = await LaboratoryRequestService.updateStatus(detail.id, LabRequestStatus.CANCELED);
            setDetail(updated);
            toast({ title: "Solicitud cancelada", description: "El estado se actualizó a 'Cancelado'." });
        } catch {
            toast({ variant: "destructive", title: "No se pudo cancelar", description: "Inténtalo nuevamente." });
        } finally {
            setCanceling(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Cargando solicitud de laboratorio...
            </div>
        );
    }

    if (!detail) {
        return <div className="flex h-screen items-center justify-center text-muted-foreground">No se encontró la solicitud indicada.</div>;
    }

    const createdAtStr = detail.createdAt ? new Date(detail.createdAt).toLocaleString() : "—";
    const animalId = (detail as any).animalId ?? (detail as any)?.summary?.animalId ?? null;
    const testsCount = detail.items?.length ?? 0;
    const testsLabel = `${testsCount} ${testsCount === 1 ? "prueba" : "pruebas"} solicitadas`;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                <div className="mx-auto px-4 py-3 md:py-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="truncate text-lg font-bold leading-tight text-slate-900 md:text-xl">{testsLabel}</h1>
                                <Badge variant="secondary" className="text-xs tracking-wide">
                                    {LabRequestStatusLabels[detail.status as LabRequestStatus] ?? detail.status}
                                </Badge>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <span className="inline-flex max-w-[20rem] items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-blue-700 ring-1 ring-blue-200">
                                    <span className="truncate font-normal">Paciente: {detail.animalName}</span>
                                </span>
                                <span className="hidden md:inline select-none">·</span>
                                <span className="rounded-full bg-slate-50 px-2 py-0.5 ring-1 ring-slate-200">Solicitud de laboratorio</span>
                                <span className="hidden md:inline select-none">·</span>
                                <span className="rounded-full bg-slate-50 px-2 py-0.5 ring-1 ring-slate-200">{createdAtStr}</span>
                            </div>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                            <Button variant="outline" onClick={handleRefresh} disabled={refreshing} aria-label="Actualizar datos">
                                {refreshing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Actualizando...
                                    </>
                                ) : (
                                    <>
                                        <RotateCcw className="mr-2 h-4 w-4" /> Actualizar
                                    </>
                                )}
                            </Button>
                            <Button className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={handleSaveAll} disabled={savingAll} aria-label="Guardar todo">
                                {savingAll ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" /> Guardar todo
                                    </>
                                )}
                            </Button>
                            {nextStatus && (
                                <Button
                                    variant="secondary"
                                    onClick={handleMarkNextStatus}
                                    disabled={updatingStatus}
                                    aria-label={`Cambiar estado a ${nextStatusLabel}`}
                                    title={nextStatusLabel ?? ""}
                                >
                                    {updatingStatus ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Actualizando estado...
                                        </>
                                    ) : (
                                        <>
                                            <ArrowRight className="mr-2 h-4 w-4" />
                                            {`Marcar como "${nextStatusLabel}"`}
                                        </>
                                    )}
                                </Button>
                            )}
                            <Button
                                variant="destructive"
                                onClick={handleCancel}
                                disabled={canceling || detail.status === LabRequestStatus.CANCELED}
                                aria-label="Cancelar solicitud"
                            >
                                {canceling ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cancelando...
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="mr-2 h-4 w-4" /> Cancelar
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="w-full pt-4 mx-2 flex flex-col gap-4 sm:flex-row">
                <PatientDetails animalId={animalId} className="sm:basis-[21%] sm:shrink-0 w-full" />
                <div className="sm:basis-[79%] sm:min-w-0 w-full flex flex-col gap-4">
                    {detail.clinicalNotes ? (
                        <div className="rounded-xl border bg-white p-4 md:p-5">
                            <div className="mb-2 flex items-center gap-2">
                                <FileText className="h-4 w-4" aria-hidden="true" />
                                <h2 className="text-sm font-semibold">Notas clínicas</h2>
                            </div>
                            <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{detail.clinicalNotes}</div>
                        </div>
                    ) : null}
                    <div className="rounded-xl border bg-white p-4 md:p-5">
                        <LaboratoryRequestForm ref={formRef} detail={detail} />
                    </div>
                </div>
            </div>
        </div>
    );
}
