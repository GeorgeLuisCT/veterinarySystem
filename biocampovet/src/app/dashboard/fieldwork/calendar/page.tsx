"use client";

import React, { useState } from 'react';
import { Truck, Syringe, Plus, ChevronLeft, ChevronRight, MapPin, ClipboardList, PackagePlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';



// --- Tipos de Datos (TypeScript) ---
type FarmVisit = {
    id: number;
    clientId: number;
    clientName: string;
    farmName: string;
    date: string;
    objective: string;
    status: 'Planificada' | 'En Progreso' | 'Completada';
};
type MobileInventoryItem = {
    productId: string;
    name: string;
    assigned: number;
};


// --- DATOS SIMULADOS ---
const farmVisits: FarmVisit[] = [
    { id: 101, clientId: 20, clientName: 'Hacienda San José', farmName: 'Finca Principal', date: '2025-10-13', objective: 'Programa de vacunación anual del rebaño', status: 'Planificada' },
    { id: 102, clientId: 21, clientName: 'Ganadería El Roble', farmName: 'Establo 3', date: '2025-10-13', objective: 'Diagnóstico reproductivo lote 3', status: 'Planificada' },
    { id: 103, clientId: 20, clientName: 'Hacienda San José', farmName: 'Finca Anexa', date: '2025-10-15', objective: 'Revisión post-tratamiento', status: 'Planificada' },
];
const mobileInventory: MobileInventoryItem[] = [
    { productId: 'VAC-05', name: 'Vacuna Clostridial x100 dosis', assigned: 2 },
    { productId: 'ANT-02', name: 'Antibiótico L.A. x500ml', assigned: 5 },
    { productId: 'VIT-01', name: 'Complejo Vitamínico x250ml', assigned: 3 },
];

// --- COMPONENTE PRINCIPAL ---
export default function FieldCalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date('2025-10-13T00:00:00'));
    const [selectedVisit, setSelectedVisit] = useState<FarmVisit | null>(null);

    const renderMonthView = () => {
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const startDay = startOfMonth.getDay();
        const daysInMonth = endOfMonth.getDate();
        const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        const emptyDays = Array.from({ length: startDay });

        return (
            <div className="grid grid-cols-7 gap-1">
                {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map(day => <div key={day} className="text-center font-semibold text-xs text-gray-500 p-2">{day}</div>)}
                {emptyDays.map((_, i) => <div key={`empty-${i}`} className="border rounded-lg"></div>)}
                {daysArray.map(day => {
                    const dateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                    const visitsOnDay = farmVisits.filter(v => v.date === dateStr);
                    return (
                        <div key={day} className="border rounded-lg min-h-[120px] p-2 flex flex-col">
                            <span className="font-semibold text-sm">{day}</span>
                            <div className="flex-grow space-y-1 mt-1">
                                {visitsOnDay.map(visit => (
                                    <div key={visit.id} onClick={() => setSelectedVisit(visit)} className="bg-teal-100 text-teal-800 text-xs p-1 rounded-md cursor-pointer hover:bg-teal-200 truncate">
                                        <MapPin className="inline h-3 w-3 mr-1" />{visit.clientName}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const VisitDetailModal = ({ visit, onClose }: { visit: FarmVisit | null, onClose: () => void }) => {
        if (!visit) return null;
        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={onClose}>
                <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                    <CardHeader>
                        <CardTitle>Visita Planificada</CardTitle>
                        <p className="text-sm text-gray-500">{visit.clientName} - {visit.farmName}</p>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div><strong className="text-gray-600">Fecha:</strong> {new Date(visit.date).toLocaleDateString('es-ES', { dateStyle: 'long' })}</div>
                            <div><strong className="text-gray-600">Objetivo de la Visita:</strong><p className="mt-1 p-2 bg-gray-50 rounded-md text-gray-800">{visit.objective}</p></div>
                        </div>
                    </CardContent>
                    <div className="bg-gray-50 px-6 py-4 flex justify-between items-center rounded-b-lg">
                        <Button variant="outline" onClick={onClose}>Cerrar</Button>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                            <ClipboardList className="mr-2 h-4 w-4" /> Iniciar Visita
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen bg-gray-50">
            <aside className="w-80 p-4 border-r bg-white">
                <Card>
                    <CardHeader className="flex flex-row items-center gap-2">
                        <Truck className="h-6 w-6 text-blue-600" />
                        <CardTitle>Inventario Móvil</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-600 mb-4">Insumos cargados para la ruta de hoy.</p>
                        <div className="space-y-3">
                            {mobileInventory.map(item => (
                                <div key={item.productId} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-md">
                                    <span className="font-medium text-gray-800">{item.name}</span>
                                    <span className="font-bold text-blue-600">{item.assigned}</span>
                                </div>
                            ))}
                        </div>
                        <Button variant="outline" className="w-full mt-4"><PackagePlus className="mr-2 h-4 w-4" />Cargar/Gestionar Insumos</Button>
                    </CardContent>
                </Card>
            </aside>
            <main className="flex-1 p-6">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon"><ChevronLeft className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon"><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">{currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</h1>
                    </div>
                    <Button><Plus className="mr-2 h-4 w-4" /> Planificar Nueva Visita</Button>
                </div>
                <Card>
                    <CardContent className="p-2">{renderMonthView()}</CardContent>
                </Card>
            </main>
            <VisitDetailModal visit={selectedVisit} onClose={() => setSelectedVisit(null)} />
        </div>
    );
}
