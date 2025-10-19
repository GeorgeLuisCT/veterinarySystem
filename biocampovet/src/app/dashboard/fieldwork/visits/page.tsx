"use client";

import React, { useState } from 'react';
import { Map, MapPin, ClipboardList, Clock, Truck, PlayCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// --- Tipos de Datos (TypeScript) ---
type FarmVisitStatus = 'Planificada' | 'En Progreso' | 'Completada';
type FarmVisit = {
    id: number;
    clientId: number;
    clientName: string;
    farmName: string;
    timeSlot: 'Mañana' | 'Tarde';
    address: string;
    objective: string;
    status: FarmVisitStatus;
};


// --- DATOS SIMULADOS PARA LA RUTA DEL DÍA ---
const todaysVisits: FarmVisit[] = [
    { id: 101, clientId: 20, clientName: 'Hacienda San José', farmName: 'Finca Principal', timeSlot: 'Mañana', address: 'Carretera a Jaén Km 15', objective: 'Programa de vacunación anual del rebaño', status: 'En Progreso' },
    { id: 102, clientId: 21, clientName: 'Ganadería El Roble', farmName: 'Establo 3', timeSlot: 'Mañana', address: 'Sector El Reposo, Cajaruro', objective: 'Diagnóstico reproductivo lote 3', status: 'Planificada' },
    { id: 104, clientId: 22, clientName: 'Finca La Pradera', farmName: 'Corral de engorde', timeSlot: 'Tarde', address: 'Cruce a Bagua Grande', objective: 'Revisión de terneros y desparasitación', status: 'Planificada' },
];

const statusConfig = {
    'Planificada': { text: 'Planificada', icon: <Clock className="h-4 w-4 mr-2" />, color: 'text-blue-600' },
    'En Progreso': { text: 'En Progreso', icon: <RefreshCw className="h-4 w-4 mr-2 animate-spin" />, color: 'text-amber-600' },
    'Completada': { text: 'Completada', icon: <CheckCircle className="h-4 w-4 mr-2" />, color: 'text-green-600' },
};


// --- COMPONENTE PRINCIPAL ---
export default function FieldRoutePage() {

    const RouteMap = () => (
        <Card className="h-64 flex flex-col">
            <CardHeader className="flex-row items-center gap-2">
                <Map className="h-6 w-6 text-gray-500" />
                <CardTitle>Ruta del Día</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow bg-gray-100 rounded-b-xl flex items-center justify-center">
                <p className="text-gray-500">[ Simulación de Mapa con las ubicaciones de hoy ]</p>
            </CardContent>
        </Card>
    );

    const VisitCard = ({ visit }: { visit: FarmVisit }) => {
        const status = statusConfig[visit.status];
        return (
            <Card className="overflow-hidden">
                <div className={`p-4 border-l-8 ${visit.status === 'En Progreso' ? 'border-amber-500' : 'border-blue-500'}`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-gray-500">{visit.timeSlot}</p>
                            <h3 className="text-xl font-bold">{visit.clientName}</h3>
                            <p className="text-sm text-gray-600">{visit.farmName}</p>
                        </div>
                        <div className={`flex items-center font-semibold text-sm ${status.color}`}>
                            {status.icon} {status.text}
                        </div>
                    </div>
                    <div className="mt-4 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm font-semibold text-gray-800">Objetivo:</p>
                        <p className="text-sm text-gray-600">{visit.objective}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-500">
                            <MapPin className="h-4 w-4 mr-2" /> {visit.address}
                        </div>
                        <Button variant="ghost" className="text-blue-600 hover:text-blue-800">Ver en Mapa</Button>
                    </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 flex justify-end">
                    {visit.status === 'Planificada' && (
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                            <PlayCircle className="mr-2 h-4 w-4" /> Iniciar Visita
                        </Button>
                    )}
                    {visit.status === 'En Progreso' && (
                        <Button className="bg-amber-500 hover:bg-amber-600 text-white shadow-sm">
                            <ClipboardList className="mr-2 h-4 w-4" /> Continuar Reporte
                        </Button>
                    )}
                </div>
            </Card>
        );
    };

    return (
        <div className="h-full bg-gray-50 p-4 sm:p-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-slate-900">Hoja de Ruta del Día</h1>
                    <p className="text-gray-600 mt-1">
                        Visitas planificadas para hoy, {new Date().toLocaleDateString('es-ES', { dateStyle: 'long' })}.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <Card>
                        <CardHeader className="flex-row justify-between items-center">
                            <CardTitle>Resumen</CardTitle>
                            <Truck className="h-6 w-6 text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{todaysVisits.length}</div>
                            <p className="text-sm text-gray-500">Visitas totales planificadas.</p>
                        </CardContent>
                    </Card>
                    <RouteMap />
                </div>

                <div className="space-y-6">
                    {todaysVisits.map(visit => (
                        <VisitCard key={visit.id} visit={visit} />
                    ))}
                </div>
            </div>
        </div>
    );
}
