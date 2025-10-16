"use client";

import React, { useState } from 'react';
import { ClipboardList, User, MapPin, Syringe, Beaker, PlusCircle, Trash2, Save, Send, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type VisitData = { id: number; clientName: string; farmName: string; objective: string; };
type MobileInventoryItem = { productId: string; name: string; available: number; };
type ConsumedItem = { productId: string; name: string; quantity: number; };
type Activity = { description: string; animals: string; };

// --- DATOS SIMULADOS ---
const currentVisit: VisitData = { id: 101, clientName: 'Hacienda San José', farmName: 'Finca Principal', objective: 'Programa de vacunación anual del rebaño' };
const mobileInventory: MobileInventoryItem[] = [
    { productId: 'VAC-05', name: 'Vacuna Clostridial x100 dosis', available: 2 },
    { productId: 'ANT-02', name: 'Antibiótico L.A. x500ml', available: 5 },
    { productId: 'VIT-01', name: 'Complejo Vitamínico x250ml', available: 3 },
];

// --- COMPONENTE PRINCIPAL ---
export default function FieldVisitPage() {
    const [activities, setActivities] = useState<Activity[]>([{ description: 'Vacunación contra clostridios', animals: '150 ovejas adultas' }]);
    const [consumed, setConsumed] = useState<ConsumedItem[]>([{ productId: 'VAC-05', name: 'Vacuna Clostridial x100 dosis', quantity: 2 }]);
    const [findings, setFindings] = useState('El rebaño se encuentra en buena condición corporal general. No se observan signos clínicos de enfermedad activa.');
    const [recommendations, setRecommendations] = useState('Mantener el calendario de desparasitación. Próximo refuerzo de vacuna en 6 meses. Notificar cualquier animal con decaimiento.');

    const addConsumedItem = () => {
        const newItem = mobileInventory[1]; // Simulación
        setConsumed([...consumed, { productId: newItem.productId, name: newItem.name, quantity: 1 }]);
    };

    const handleFinalize = () => {
        alert(`VISITA FINALIZADA\n\nCliente: ${currentVisit.clientName}\n\nReporte generado con:\n- ${activities.length} actividades\n- ${consumed.length} tipos de insumos consumidos\n\nLos cargos serán enviados a facturación y el inventario será actualizado.`);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="p-4 bg-white border-b sticky top-0 z-10">
                <div className="flex justify-between items-center max-w-screen-xl mx-auto">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Reporte de Visita de Campo</h1>
                        <p className="text-sm text-gray-600">
                            <User className="inline h-4 w-4 mr-1" />{currentVisit.clientName} | <MapPin className="inline h-4 w-4 mr-1" />{currentVisit.farmName}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline"><Save className="h-4 w-4 mr-2" /> Guardar Borrador</Button>
                        <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleFinalize}><Send className="h-4 w-4 mr-2" /> Finalizar y Generar Reporte</Button>
                    </div>
                </div>
            </div>

            <div className="max-w-screen-xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* --- Columna Principal de Registro --- */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Actividades y Procedimientos</CardTitle></CardHeader>
                        <CardContent>
                            {activities.map((act, index) => (
                                <div key={index} className="grid grid-cols-2 gap-4 mb-2">
                                    <Input placeholder="Descripción (Ej: Vacunación)" defaultValue={act.description} />
                                    <Input placeholder="Animales tratados (Ej: 150 ovejas)" defaultValue={act.animals} />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Hallazgos y Diagnósticos</CardTitle></CardHeader>
                        <CardContent><textarea rows={4} placeholder="Notas sobre la salud del rebaño, problemas encontrados..." defaultValue={findings} /></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Recomendaciones</CardTitle></CardHeader>
                        <CardContent><textarea rows={4} placeholder="Indicaciones para el personal de la granja..." defaultValue={recommendations} /></CardContent>
                    </Card>
                </div>

                {/* --- Columna de Insumos --- */}
                <aside className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Consumo de Insumos</CardTitle>
                                <Button size="sm" variant="ghost" onClick={addConsumedItem}><PlusCircle className="h-4 w-4 mr-2" />Añadir</Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {consumed.map((item, index) => {
                                    const stock = mobileInventory.find(i => i.productId === item.productId);
                                    return (
                                        <div key={index} className="p-2 border rounded-md grid grid-cols-3 gap-2 items-center">
                                            <div className="col-span-2">
                                                <p className="text-sm font-medium truncate">{item.name}</p>
                                                <p className="text-xs text-gray-500">Disponible: {stock?.available || 0}</p>
                                            </div>
                                            <Input type="number" placeholder="Cant." defaultValue={item.quantity} className="text-center" />
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Resumen de Bioseguridad</CardTitle></CardHeader>
                        <CardContent>
                            <div className="flex items-center text-sm p-3 bg-blue-50 text-blue-800 rounded-lg">
                                <ShieldCheck className="h-6 w-6 mr-3" />
                                <div>Se siguieron los protocolos de limpieza de vehículo y equipo antes y después de la visita.</div>
                            </div>
                        </CardContent>
                    </Card>
                </aside>
            </div>
        </div>
    );
}
