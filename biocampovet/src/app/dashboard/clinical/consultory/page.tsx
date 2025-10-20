"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Users, Clock, Stethoscope, Beaker, FileCheck2, MoveRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AttentionResponse } from '../../schedule/types/attention-response';
import { ClinicalAttentionSummaryResponse } from '../types/clinical-attention-response';
import AttentionService from '../../schedule/service/attention-service';
import { AttentionStatus } from '../../schedule/enums/attention-status';
import { AttentionType } from '../../schedule/enums/attention-type';
import ClinicalAttentionService from '../service/clinical-attention-service';
import { ClinicalAttentionStatus } from '../enums/clinical-attention-status';
import { useRouter } from "next/navigation";



type KanbanColumnKey = 'Sala de Espera' | 'En Consulta' | 'Esperando Exámenes' | 'Listo para Facturar';

type KanbanCardData = {
    id: number;
    patientName: string;
    ownerName?: string; 
    reason: string;
    vetName: string | null;
    startTime: string;
    attentionId: number; 
};

const statusConfig: Record<KanbanColumnKey, { icon: React.ReactNode; title: string; color: string }> = {
    'Sala de Espera': { icon: <Users className="h-5 w-5"/>, title: "Sala de Espera", color: "border-t-gray-400" },
    'En Consulta': { icon: <Stethoscope className="h-5 w-5"/>, title: "En Consulta", color: "border-t-blue-500" },
    'Esperando Exámenes': { icon: <Beaker className="h-5 w-5"/>, title: "Esperando Exámenes", color: "border-t-amber-500" },
    'Listo para Facturar': { icon: <FileCheck2 className="h-5 w-5"/>, title: "Listo para Facturar", color: "border-t-green-500" },
};

const calculateTimeInStatus = (startTime: string, now: Date) => {
    const diff = now.getTime() - new Date(startTime).getTime();
    if (diff < 0) return '0 min';
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes} min`;
};

const ConsultationCard = ({ data }: { data: KanbanCardData }) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    const router = useRouter();
    
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 15000);
        return () => clearInterval(timer);
    }, []);

    const timeInStatus = calculateTimeInStatus(data.startTime, currentTime);
    
    const handleContinue = () => {
      const url = `/dashboard/clinical/consultory/${data.attentionId}`;
      router.push(url);
    };
    
    return (
        <Card className="mb-3 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-3">
                <div className="flex justify-between items-start">
                    <p className="font-bold text-slate-800">{data.patientName}</p>
                    <span className="text-xs text-gray-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1"/>{timeInStatus}
                    </span>
                </div>
                {data.ownerName && <p className="text-xs text-gray-500 mb-2">{data.ownerName}</p>}
                <p className="text-sm my-2 p-2 bg-gray-50 rounded-md truncate" title={data.reason}>{data.reason}</p>
                <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-600 flex items-center">
                        <Stethoscope className="h-3 w-3 mr-1"/>{data.vetName || 'No asignado'}
                    </span>
                    <Button variant="outline" size="sm" className="h-8" onClick={handleContinue}>
                        Ver/Continuar <MoveRight className="h-3 w-3 ml-1"/>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

const KanbanColumn = ({ title, items }: { title: KanbanColumnKey; items: KanbanCardData[] }) => {
    const config = statusConfig[title];
    return (
        <div className={`bg-gray-100 rounded-lg p-3 border-t-4 ${config.color}`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    {config.icon}
                    <h3 className="font-semibold text-gray-800">{config.title}</h3>
                </div>
                <span className="text-sm font-bold bg-gray-200 text-gray-700 rounded-full h-6 w-6 flex items-center justify-center">
                    {items.length}
                </span>
            </div>
            <div className="space-y-3 h-[calc(100vh-200px)] overflow-y-auto pr-1">
                {items.map(item => <ConsultationCard key={`${item.attentionId}-${item.id}`} data={item} />)}
            </div>
        </div>
    );
};

export default function ConsultoryPage() {
    const [waitingRoom, setWaitingRoom] = useState<AttentionResponse[]>([]);
    const [clinicalAttentions, setClinicalAttentions] = useState<ClinicalAttentionSummaryResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [waitingRoomResponse, clinicalAttentionsResponse] = await Promise.all([
                AttentionService.list({ 
                    status: AttentionStatus.WAITING, 
                    type: AttentionType.CLINIC, 
                    size: 100
                }),
                ClinicalAttentionService.list({
                    statuses: [
                        ClinicalAttentionStatus.OPEN,
                        ClinicalAttentionStatus.IN_PROGRESS,
                        ClinicalAttentionStatus.WAITING_LAB,
                        ClinicalAttentionStatus.READY_TO_BILL,
                    ],
                    size: 100
                })
            ]);
            setWaitingRoom(waitingRoomResponse.content);
            setClinicalAttentions(clinicalAttentionsResponse.content);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("No se pudo cargar la información de las consultas. Intente de nuevo más tarde.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const waitingRoomItems: KanbanCardData[] = waitingRoom.map(att => ({
        id: att.id,
        patientName: att.animalBasicResponse.animalName,
        ownerName: 'Dueño no disponible',
        reason: att.clinicalServiceName,
        vetName: att.attendingEmployeeFullName,
        startTime: att.checkInTime,
        attentionId: att.id
    }));

    const inConsultationItems: KanbanCardData[] = clinicalAttentions
        .filter(ca => ca.status === ClinicalAttentionStatus.OPEN || ca.status === ClinicalAttentionStatus.IN_PROGRESS)
        .map(ca => ({
            id: ca.id,
            patientName: ca.animalName,
            reason: 'Consulta Clínica',
            vetName: ca.attendingEmployeeFullName,
            startTime: ca.visitDate,
            attentionId: ca.attentionId
        }));
    
    const waitingExamsItems: KanbanCardData[] = clinicalAttentions
        .filter(ca => ca.status === ClinicalAttentionStatus.WAITING_LAB)
        .map(ca => ({
            id: ca.id,
            patientName: ca.animalName,
            reason: 'Esperando Laboratorio',
            vetName: ca.attendingEmployeeFullName,
            startTime: ca.visitDate,
            attentionId: ca.attentionId
        }));
        
    const readyToBillItems: KanbanCardData[] = clinicalAttentions
        .filter(ca => ca.status === ClinicalAttentionStatus.READY_TO_BILL)
        .map(ca => ({
            id: ca.id,
            patientName: ca.animalName,
            reason: 'Listo para Facturación',
            vetName: ca.attendingEmployeeFullName,
            startTime: ca.visitDate,
            attentionId: ca.attentionId
        }));

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Cargando consultas...</div>;
    }

    if (error) {
        return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
    }

    return (
        <div className="h-full bg-gray-50 p-4 sm:p-6">
            <div className="max-w-screen-2xl mx-auto">
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Consultas del Día</h1>
                        <p className="text-gray-600 mt-1">Flujo en tiempo real de los pacientes en el área clínica.</p>
                    </div>
                    <Button onClick={fetchData} disabled={loading}>
                        {loading ? 'Actualizando...' : 'Actualizar'}
                    </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    <KanbanColumn title="Sala de Espera" items={waitingRoomItems} />
                    <KanbanColumn title="En Consulta" items={inConsultationItems} />
                    <KanbanColumn title="Esperando Exámenes" items={waitingExamsItems} />
                    <KanbanColumn title="Listo para Facturar" items={readyToBillItems} />
                </div>
            </div>
        </div>
    );
}