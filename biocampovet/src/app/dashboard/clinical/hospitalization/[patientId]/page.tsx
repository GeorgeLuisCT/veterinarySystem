"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getAaxiosErrorMessage } from '@/helpers/error';
import { HospitalizationResponse, EvolutionNoteResponse, TreatmentScheduleResponse } from '../../types/hospitalization-response';
import { User, ClipboardList, Stethoscope, Clock, Pill, Thermometer, Droplets, MessageSquare, Save, LogOut, ClipboardPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import HospitalizationService from '../../service/hospitalization-service';

export default function HospitalizationChartPage() {
    const params = useParams();
    const { toast } = useToast();
    const [hospitalization, setHospitalization] = useState<HospitalizationResponse | null>(null);
    const [loading, setLoading] = useState(true);

    const hospitalizationId = Number(params.patientId);

    const fetchHospitalization = useCallback(async () => {
        if (!hospitalizationId) return;
        setLoading(true);
        try {
            const data = await HospitalizationService.getById(hospitalizationId);
            setHospitalization(data);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: getAaxiosErrorMessage(error) ?? "No se pudo cargar la ficha de hospitalización.",
            });
        } finally {
            setLoading(false);
        }
    }, [hospitalizationId, toast]);

    useEffect(() => {
        fetchHospitalization();
    }, [fetchHospitalization]);

    if (loading) {
        return <div>Cargando...</div>;
    }

    if (!hospitalization) {
        return <div>No se encontró la hospitalización.</div>;
    }

    const { animalName, reasonForAdmission, admissionDate, treatmentSchedules, evolutionNotes } = hospitalization;

    const timeSlots = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '00:00', '02:00', '04:00', '06:00'];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="p-4 bg-white border-b sticky top-0 z-10">
                <div className="flex justify-between items-center max-w-screen-xl mx-auto">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Ficha de Hospitalización</h1>
                        <p className="text-sm text-gray-600">Paciente: <span className="font-semibold text-blue-600">{animalName}</span></p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="text-orange-600 border-orange-300 hover:bg-orange-50">
                            <ClipboardPlus className="h-4 w-4 mr-2" /> Iniciar Reporte Quirúrgico
                        </Button>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                            <LogOut className="h-4 w-4 mr-2" /> Dar de Alta
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-screen-xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Column */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Hoja de Tratamiento - Hoy</CardTitle></CardHeader>
                        <div className="p-4 overflow-x-auto">
                            <table className="w-full border-collapse text-sm text-center">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border p-2 font-semibold text-left">Tratamiento</th>
                                        {timeSlots.map(time => <th key={time} className="border p-2 font-semibold">{time}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {treatmentSchedules.map(treat => (
                                        <tr key={treat.id}>
                                            <td className="border p-2 text-left font-medium">{treat.treatmentName}</td>
                                            {timeSlots.map(time => {
                                                // This logic is simplified and needs to be improved
                                                const isCompleted = treat.isCompleted && new Date(treat.completedAt!).getHours() === parseInt(time);
                                                return (
                                                    <td key={time} className="border p-2">
                                                        {isCompleted ? (
                                                            <span className="font-bold text-green-600" title={`Realizado por ${treat.completedByEmployeeFullName}`}>✓</span>
                                                        ) : (
                                                            <button className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 text-xs">A</button>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Bitácora de Evolución</CardTitle></CardHeader>
                        <CardContent>
                            <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                                {evolutionNotes.map((note) => (
                                    <div key={note.id} className="text-sm border-b pb-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-semibold">{note.authorFullName}</span>
                                            <span className="text-xs text-gray-500">{new Date(note.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <p className="text-gray-700">{note.note}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 border-t pt-4">
                                <Textarea placeholder="Añadir nueva nota de evolución..." className="mb-2" />
                                <Button size="sm">Guardar Nota</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Side Column */}
                <aside className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Resumen del Paciente</CardTitle></CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <p><strong>Motivo de Admisión:</strong> {reasonForAdmission}</p>
                            <p><strong>Fecha de Ingreso:</strong> {new Date(admissionDate).toLocaleString('es-ES')}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Constantes Vitales (Último Registro)</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <div className="text-center"><Thermometer className="mx-auto h-6 w-6 text-red-500" /><p className="font-bold text-lg">38.7°C</p></div>
                            <div className="text-center"><Droplets className="mx-auto h-6 w-6 text-blue-500" /><p className="font-bold text-lg">50 ml/hr</p></div>
                        </CardContent>
                    </Card>
                </aside>
            </div>
        </div>
    );
}

