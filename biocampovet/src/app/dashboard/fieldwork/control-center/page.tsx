"use client";

import React, { useState } from 'react';
import { Map, Users, ClipboardCheck, AlertTriangle, Phone, FileText, PlusCircle, Send, Clock } from 'lucide-react';

// --- Tipos de Datos (TypeScript) ---
type VetStatus = 'En Ruta' | 'En Visita' | 'Finalizado';
type FieldVet = {
    id: number;
    name: string;
    avatarUrl: string;
    status: VetStatus;
    currentLocation: string;
    nextStop: string;
};
type RecentReport = {
    id: number;
    clientName: string;
    farmName: string;
    vetName: string;
    completionTime: string;
};
type UnassignedTask = {
    id: number;
    clientName: string;
    farmName: string;
    priority: 'Alta' | 'Media' | 'Baja';
    description: string;
};

// --- Componentes de UI Nativos ---
const Button = ({ children, onClick, variant = 'default', size = 'md', className = '' }: { children: React.ReactNode, onClick?: () => void, variant?: string, size?: string, className?: string }) => <button className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors disabled:opacity-50 ${className}`} onClick={onClick}>{children}</button>;
const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => <div className={`rounded-xl border bg-white text-slate-900 shadow-sm ${className}`}>{children}</div>;
const CardHeader = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>;
const CardTitle = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>{children}</h3>;
const CardContent = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => <div className={`p-6 pt-0 ${className}`}>{children}</div>;


// --- DATOS SIMULADOS ---
const fieldVets: FieldVet[] = [
    { id: 1, name: 'Dr. Alan Morales', avatarUrl: 'https://placehold.co/40x40/3B82F6/FFFFFF?text=AM', status: 'En Visita', currentLocation: 'Hacienda San José', nextStop: 'Ganadería El Roble' },
    { id: 2, name: 'Dra. Sofia Castillo', avatarUrl: 'https://placehold.co/40x40/EC4899/FFFFFF?text=SC', status: 'En Ruta', currentLocation: 'Carretera a Jaén', nextStop: 'Finca La Pradera' },
    { id: 3, name: 'Dr. Luis Vega', avatarUrl: 'https://placehold.co/40x40/10B981/FFFFFF?text=LV', status: 'Finalizado', currentLocation: 'Clínica', nextStop: '-' },
];
const recentReports: RecentReport[] = [
    { id: 201, clientName: 'Rancho Luna', farmName: 'Corral 2', vetName: 'Dr. Luis Vega', completionTime: '11:30 AM' },
    { id: 200, clientName: 'Estancia El Sol', farmName: 'Finca Principal', vetName: 'Dr. Luis Vega', completionTime: '09:45 AM' },
];
const unassignedTasks: UnassignedTask[] = [
    { id: 1, clientName: 'Finca La Esperanza', farmName: 'Corral Principal', priority: 'Alta', description: 'Reporte de posible brote infeccioso.' },
    { id: 2, clientName: 'Ganadería El Roble', farmName: 'Establo 2', priority: 'Media', description: 'Propietario solicita revisión de un animal.' },
];

const statusConfig = {
    'En Ruta': { color: 'bg-blue-100 text-blue-800' },
    'En Visita': { color: 'bg-amber-100 text-amber-800' },
    'Finalizado': { color: 'bg-green-100 text-green-800' },
};
const priorityConfig = {
    'Alta': { color: 'bg-red-100 text-red-800 border-red-300' },
    'Media': { color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    'Baja': { color: 'bg-gray-100 text-gray-800 border-gray-300' },
};


// --- COMPONENTE PRINCIPAL ---
export default function FieldworkControlCenterPage() {

    const KpiCard = ({ title, value, icon, subtext }: { title: string, value: string, icon: React.ReactNode, subtext: string }) => (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-gray-500">{subtext}</p>
            </CardContent>
        </Card>
    );

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-slate-900">Centro de Control de Campo</h1>
                    <p className="text-gray-600 mt-1">Gestión y supervisión en tiempo real de las operaciones de campo.</p>
                </div>

                {/* --- KPIs / Métricas --- */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                    <KpiCard title="Veterinarios en Ruta" value={fieldVets.filter(v => v.status !== 'Finalizado').length.toString()} icon={<Users className="h-4 w-4 text-gray-400" />} subtext="Personal activo en campo hoy." />
                    <KpiCard title="Visitas Completadas (Hoy)" value="2" icon={<ClipboardCheck className="h-4 w-4 text-gray-400" />} subtext="Reportes finalizados en la jornada." />
                    <KpiCard title="Tareas sin Asignar" value={unassignedTasks.length.toString()} icon={<AlertTriangle className="h-4 w-4 text-red-500" />} subtext="Nuevas solicitudes pendientes." />
                    <KpiCard title="Próxima Visita Programada" value="1:30 PM" icon={<Clock className="h-4 w-4 text-gray-400" />} subtext="Ganadería El Roble - Dr. Morales" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* --- Columna Principal: Mapa y Actividad --- */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle>Tareas por Asignar</CardTitle>
                                    <Button variant="outline" size="sm"><PlusCircle className="h-4 w-4 mr-2" />Crear Tarea Urgente</Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {unassignedTasks.map(task => {
                                        const priority = priorityConfig[task.priority];
                                        return (
                                            <div key={task.id} className={`p-3 border-l-4 rounded-r-md flex justify-between items-center ${priority.color.replace('bg-', 'border-')}`}>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${priority.color}`}>{task.priority}</span>
                                                        <p className="font-semibold">{task.clientName}</p>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                                                </div>
                                                <Button size="sm" className="bg-slate-700 hover:bg-slate-800 text-white"><Send className="h-4 w-4 mr-2" />Asignar</Button>
                                            </div>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Estado del Equipo en Campo</CardTitle></CardHeader>
                            <CardContent>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-gray-600">
                                            <th className="p-2">Veterinario</th><th className="p-2">Estado</th><th className="p-2">Ubicación / Tarea Actual</th><th className="p-2">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {fieldVets.map(vet => {
                                            const status = statusConfig[vet.status];
                                            return (
                                                <tr key={vet.id} className="border-b">
                                                    <td className="p-2 flex items-center gap-2">
                                                        <img src={vet.avatarUrl} alt={vet.name} className="h-8 w-8 rounded-full" />
                                                        <span className="font-medium">{vet.name}</span>
                                                    </td>
                                                    <td className="p-2"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${status.color}`}>{vet.status}</span></td>
                                                    <td className="p-2">{vet.currentLocation} <span className="text-gray-400">→ {vet.nextStop}</span></td>
                                                    <td className="p-2 flex gap-1">
                                                        <Button variant="ghost" size="sm" title="Asignar Tarea"><PlusCircle className="h-4 w-4" /></Button>
                                                        <Button variant="ghost" size="sm" title="Contactar"><Phone className="h-4 w-4" /></Button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                    </div>

                    {/* --- Columna Derecha: Reportes Recientes y Mapa --- */}
                    <aside className="space-y-6">
                        <Card>
                            <CardHeader><CardTitle>Mapa de Actividad</CardTitle></CardHeader>
                            <CardContent>
                                <div className="h-60 bg-gray-200 rounded-md flex items-center justify-center">
                                    <p className="text-gray-500">[ Simulación de Mapa ]</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Últimos Reportes Finalizados</CardTitle></CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {recentReports.map(report => (
                                        <div key={report.id} className="p-3 bg-gray-50 rounded-lg">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-semibold">{report.clientName}</p>
                                                    <p className="text-xs text-gray-500">{report.vetName} - {report.completionTime}</p>
                                                </div>
                                                <Button variant="outline" size="sm" title="Ver Reporte"><FileText className="h-4 w-4" /></Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </aside>
                </div>
            </div>
        </div>
    );
}

