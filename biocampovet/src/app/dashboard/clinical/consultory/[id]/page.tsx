"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Save, Send, Loader2, Hospital } from "lucide-react";
import PatientDetails from "../../components/consultory/patient-details";
import QuickHistory from "../../components/consultory/quick-history";
import ConsultationForm, { ConsultationFormHandle } from "../../components/consultory/consultation-form";
import { Button } from "@/components/ui/button";
import ClinicalAttentionService from "../../service/clinical-attention-service";
import { ClinicalAttentionDetailResponse } from "../../types/clinical-attention-response";
import { useToast } from "@/hooks/use-toast";
import DeriveHospitalizationModal from "../../components/hospitalization/derive-hospitalization-modal";

export default function ConsultationPage() {
    const params = useParams();
    const { id: attentionIdParam } = params;

    const [clinicalAttention, setClinicalAttention] = useState<ClinicalAttentionDetailResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [deriveOpen, setDeriveOpen] = useState<boolean>(false);
    const effectRan = useRef(false);
    const formRef = useRef<ConsultationFormHandle>(null);

    const { toast } = useToast();

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

    if (loading) {
        return <div className="p-4">Cargando datos de la atención...</div>;
    }

    if (!clinicalAttention) {
        return <div className="p-4">No se pudo cargar la atención clínica. Verifique la URL o intente de nuevo.</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="p-4 bg-white border-b sticky top-0 z-10 shadow-sm">
                <div className="flex justify-between items-center max-w-screen-2xl mx-auto">
                    <div>
                        <h1 className="text-xl font-bold">Pantalla de Atención</h1>
                        <p className="text-sm text-gray-600">
                            Atendiendo a: <span className="font-semibold text-blue-600">{clinicalAttention.summary.animalName}</span>
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
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => alert("Función de finalizar")}
                            disabled={saving}
                        >
                            <Send className="h-4 w-4 mr-2" /> Finalizar y Enviar a Caja
                        </Button>
                    </div>
                </div>
            </div>

            <div className="w-full flex flex-col gap-4 sm:flex-row pt-4 mx-2">
                <PatientDetails
                    animalId={clinicalAttention.summary.animalId}
                    className="sm:basis-[18%] sm:shrink-0 w-full"
                />
                <ConsultationForm
                    ref={formRef}
                    detail={clinicalAttention}
                    setDetail={setClinicalAttention}
                    className="sm:basis-[72%] sm:min-w-0 w-full flex flex-col gap-4"
                />
                <QuickHistory
                    animalId={clinicalAttention.summary.animalId}
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
