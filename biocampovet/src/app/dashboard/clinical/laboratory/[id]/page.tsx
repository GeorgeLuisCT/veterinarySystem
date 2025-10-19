"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import LaboratoryRequestForm from "../../components/laboratory/laboratory-request-form";
import { Button } from "@/components/ui/button";
import { LaboratoryRequestService } from "../../service/laboratory-request-service";
import { LaboratoryRequestDetailResponse } from "../../types/laboratory-request-response";
import { useToast } from "@/hooks/use-toast";

export default function LaboratoryRequestDetailPage() {
    const params = useParams();
    const { id: requestIdParam } = params;

    const [requestDetail, setRequestDetail] = useState<LaboratoryRequestDetailResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const effectRan = useRef(false);

    const { toast } = useToast();

    useEffect(() => {
        if (effectRan.current === true) {
            return;
        }

        if (!requestIdParam) {
            setLoading(false);
            toast({ title: "Error", description: "No se proporcionó un ID de solicitud.", variant: "destructive" });
            return;
        }

        const getRequestDetail = async () => {
            const numericId = parseInt(requestIdParam as string, 10);
            if (isNaN(numericId)) {
                setLoading(false);
                toast({ title: "Error", description: "El ID de solicitud no es válido.", variant: "destructive" });
                return;
            }

            setLoading(true);
            try {
                const response = await LaboratoryRequestService.getDetail(numericId);
                setRequestDetail(response);
            } catch (error) {
                toast({ title: "Error", description: "No se pudo cargar la solicitud.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };

        getRequestDetail();

        return () => {
            effectRan.current = true;
        };
    }, [requestIdParam, toast]);

    if (loading) {
        return <div className="p-4 flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!requestDetail) {
        return <div className="p-4">No se pudo cargar la solicitud.</div>;
    }

    return (
        <div className="h-full bg-gray-50 p-4 sm:p-6">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                    <h1 className="text-2xl font-bold">Solicitud de Laboratorio #{requestDetail.id}</h1>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                        <div>
                            <p className="text-gray-500">Paciente</p>
                            <p className="font-semibold">{requestDetail.animalName}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Laboratorio</p>
                            <p className="font-semibold">{requestDetail.laboratoryName}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Fecha</p>
                            <p className="font-semibold">{new Date(requestDetail.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Estado</p>
                            <p className="font-semibold">{requestDetail.status}</p>
                        </div>
                    </div>
                </div>
                <LaboratoryRequestForm detail={requestDetail} />
            </div>
        </div>
    );
}