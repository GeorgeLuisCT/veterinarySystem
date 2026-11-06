"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Save, Send, Loader2, Hospital } from "lucide-react";
import PatientDetails from "../../components/consultory/patient-details";
import QuickHistory from "../../components/consultory/quick-history";
import ConsultationForm, { ConsultationFormHandle } from "../../components/consultory/consultation-form";
import { Button } from "@/components/ui/button";
import ClinicalAttentionService from "../../service/clinical-attention-service";
import { ClinicalAttentionDetailResponse } from "../../types/clinical-attention-response";
import { useToast } from "@/hooks/use-toast";
import DeriveHospitalizationModal from "../../components/hospitalization/derive-hospitalization-modal";
import { useUser } from "@/context/user-context";
import SalesService from "@/app/dashboard/pos/_service/sales.service";
import { BillableServiceType, SaleItemKind } from "@/app/dashboard/pos/_types/sale-enums";
import { CreateSaleRequest, SaleItemRequest } from "@/app/dashboard/pos/_types/sale-request";
import { getAaxiosErrorMessage } from "@/helpers/error";

export default function ConsultationPage() {
    const params = useParams();
    const router = useRouter();
    const { id: attentionIdParam } = params;

    const [clinicalAttention, setClinicalAttention] = useState<ClinicalAttentionDetailResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [sendingToCash, setSendingToCash] = useState<boolean>(false);
    const [deriveOpen, setDeriveOpen] = useState<boolean>(false);
    const effectRan = useRef(false);
    const formRef = useRef<ConsultationFormHandle>(null);

    const { toast } = useToast();
    const { userInfo } = useUser();

    useEffect(() => {
        if (effectRan.current === true) {
            return;
        }

        if (!attentionIdParam) {
            setLoading(false);
            toast({
                title: "Error de navegación",
                description: "No se proporcionó un ID de atención en la URL.",
                variant: "destructive",
            });
            return;
        }

        const getOrCreateClinicalAttention = async () => {
            const numericAttentionId = parseInt(attentionIdParam as string, 10);

            if (isNaN(numericAttentionId)) {
                setLoading(false);
                toast({
                    title: "ID inválido",
                    description: "El ID de atención en la URL no es un número válido.",
                    variant: "destructive",
                });
                return;
            }

            setLoading(true);
            try {
                const response = await ClinicalAttentionService.getOrCreateByAttentionId(numericAttentionId);
                setClinicalAttention(response);
                toast({
                    title: "Atención clínica cargada",
                    description: "Se ha cargado la atención clínica correctamente.",
                });
            } catch (error) {
                toast({
                    title: "Error al cargar la atención",
                    description: "No se pudo cargar la atención clínica.",
                    variant: "destructive",
                });
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        getOrCreateClinicalAttention();

        return () => {
            effectRan.current = true;
        };
    }, [attentionIdParam, toast]);

    const handleSaveDraft = async () => {
        if (!formRef.current) return;

        setSaving(true);
        try {
            await formRef.current.triggerSaveAll();
            toast({
                title: "Borrador guardado",
                description: "La atención clínica se ha guardado correctamente.",
            });
        } catch (error) {
            toast({
                title: "Error al guardar",
                description: "No se pudo guardar el borrador. Revisa los campos del formulario.",
                variant: "destructive",
            });
            console.error("Error al guardar borrador desde el padre:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleFinalizeAndSendToCash = async () => {
        if (!clinicalAttention) return;
        const serviceItems = clinicalAttention.serviceItems ?? [];
        if (serviceItems.length === 0) {
            toast({
                title: "No hay servicios para facturar",
                description: "Agrega al menos un servicio antes de enviar a caja.",
                variant: "destructive",
            });
            return;
        }

        const branchId = clinicalAttention.attention?.branchId ?? userInfo?.selectedBranch?.id;
        const sellerId = userInfo?.userId ?? clinicalAttention.attention?.attendingEmployeeId;

        if (!branchId || !sellerId) {
            toast({
                title: "No se pudo determinar la sucursal o el vendedor",
                description: "Verifica que tengas una sucursal seleccionada y que la atención tenga un responsable.",
                variant: "destructive",
            });
            return;
        }

        const saleItems: SaleItemRequest[] = serviceItems.map((item) => {
            const metadata: Record<string, unknown> = {
                clinicalAttentionId: clinicalAttention.id,
                attentionId: clinicalAttention.attention?.id ?? clinicalAttention.attentionId,
                clinicalServiceId: item.clinicalServiceId,
                clinicalServiceCategory: item.clinicalServiceCategory,
            };
            if (item.notes) metadata.notes = item.notes;

            return {
                kind: SaleItemKind.SERVICE,
                serviceType: BillableServiceType.CLINICAL_SERVICE_ITEM,
                serviceItemId: item.id,
                unitPrice: item.unitPrice ?? 0,
                quantity: item.quantity ?? 1,
                descriptionOverride: item.clinicalServiceName ?? undefined,
                metadataJson: JSON.stringify(metadata),
            };
        });

        const notes = clinicalAttention.attention?.id
            ? `Generado automáticamente desde la atención clínica #${clinicalAttention.attention.id}`
            : undefined;

        const payload: CreateSaleRequest = {
            finalizeSale: false,
            branchId,
            sellerId,
            customerId: undefined,
            documentType: undefined,
            documentNumber: undefined,
            notes,
            items: saleItems,
            payments: [],
        };

        setSendingToCash(true);
        try {
            const sale = await SalesService.saveSale(payload);
            toast({
                title: "Venta enviada a Caja",
                description: `Se generó el borrador #${sale.id} con los servicios agregados.`,
            });
            router.push(`/dashboard/pos/sales/new?saleId=${sale.id}`);
        } catch (error) {
            toast({
                title: "Error al enviar a Caja",
                description: getAaxiosErrorMessage(error),
                variant: "destructive",
            });
        } finally {
            setSendingToCash(false);
        }
    };

    if (loading) {
        return <div className="p-4">Cargando datos de la atención...</div>;
    }

    if (!clinicalAttention) {
        return <div className="p-4">No se pudo cargar la atención clínica. Verifique la URL o intente de nuevo.</div>;
    }

    return (
        <div className="h-full overflow-y-auto">
            <div className="sticky top-0 z-10 border-b bg-card px-4 py-3 sm:px-6">
                <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Pantalla de Atención</h1>
                        <p className="text-sm text-muted-foreground">
                            Atendiendo a: <span className="font-semibold text-info-strong">{clinicalAttention.attention.animalName}</span>
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleSaveDraft} disabled={saving}>
                            {saving ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Guardando...</>
                            ) : (
                                <><Save className="h-4 w-4 mr-2" /> Guardar Borrador</>
                            )}
                        </Button>
                        <Button variant="outline" onClick={() => setDeriveOpen(true)}>
                            <Hospital className="h-4 w-4 mr-2" />
                            Derivar a hospitalización
                        </Button>
                        <Button
                           
                            onClick={handleFinalizeAndSendToCash}
                            disabled={saving || sendingToCash}
                        >
                            {sendingToCash ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4 mr-2" /> Finalizar y Enviar a Caja
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="w-full flex flex-col gap-4 sm:flex-row pt-4 mx-2">
                <PatientDetails
                    animalId={clinicalAttention.attention.animalId}
                    className="sm:basis-[18%] sm:shrink-0 w-full"
                />
                <ConsultationForm
                    ref={formRef}
                    detail={clinicalAttention}
                    setDetail={setClinicalAttention}
                    className="sm:basis-[72%] sm:min-w-0 w-full flex flex-col gap-4"
                />
                <QuickHistory
                    animalId={clinicalAttention?.attention.animalId}
                    className="sm:basis-[10%] sm:shrink-0 w-full"
                />
            </div>


            <DeriveHospitalizationModal
                open={deriveOpen}
                onOpenChange={setDeriveOpen}
                detail={clinicalAttention}
            />
        </div>
    );
}
