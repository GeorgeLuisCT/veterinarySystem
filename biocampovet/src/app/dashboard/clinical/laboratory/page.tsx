"use client";

import React, { useState } from 'react';
import { Beaker, Clock, CheckCircle, Search, SlidersHorizontal, FileText, User, Dog, Stethoscope } from 'lucide-react';

// --- Tipos de Datos (TypeScript) ---
type LabRequestStatus = 'Pendiente' | 'En Proceso' | 'Completado';
type LabRequest = {
    id: string;
    patientName: string;
    ownerName: string;
    requestingVet: string;
    date: string;
    status: LabRequestStatus;
    tests: string[];
};

// --- Componentes de UI Nativos ---
const Button = ({ children, onClick, variant = 'default', size = 'md', className = '' }: { children: React.ReactNode, onClick?: () => void, variant?: string, size?: string, className?: string }) => <button className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors disabled:opacity-50 ${className}`} onClick={onClick}>{children}</button>;
const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => <div className={`rounded-xl border bg-white text-slate-900 shadow-sm ${className}`}>{children}</div>;
const CardHeader = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>;
const CardTitle = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>{children}</h3>;
const CardContent = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => <div className={`p-6 pt-0 ${className}`}>{children}</div>;
const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => <div className="relative"><Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400"/><input {...props} className={`flex h-10 w-full rounded-md border border-slate-300 bg-transparent pl-9 pr-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${props.className || ''}`} /></div>;


// --- DATOS SIMULADOS ---
const initialRequests: LabRequest[] = [
    { id: 'LAB-001', patientName: 'Max', ownerName: 'C. Rodríguez', requestingVet: 'Dra. González', date: '2025-10-10', status: 'En Proceso', tests: ['Hemograma Completo', 'Perfil Bioquímico'] },
    { id: 'LAB-002', patientName: 'Luna', ownerName: 'A. Martínez', requestingVet: 'Dr. Martínez', date: '2025-10-10', status: 'Pendiente', tests: ['Urianálisis'] },
    { id: 'LAB-003', patientName: 'Rocky', ownerName: 'L. Fernández', requestingVet: 'Dra. González', date: '2025-10-09', status: 'Completado', tests: ['Raspado Cutáneo', 'Cultivo Fúngico'] },
];

const statusConfig = {
    'Pendiente': { icon: <Clock className="h-4 w-4"/>, color: 'bg-amber-100 text-amber-800' },
    'En Proceso': { icon: <Beaker className="h-4 w-4"/>, color: 'bg-blue-100 text-blue-800' },
    'Completado': { icon: <CheckCircle className="h-4 w-4"/>, color: 'bg-green-100 text-green-800' },
};

// --- COMPONENTE PRINCIPAL ---
export default function LabRequestsPage() {
    
    const KpiCard = ({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) => (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{value}</div></CardContent>
        </Card>
    );

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-slate-900">Solicitudes de Laboratorio</h1>
                    <p className="text-gray-600 mt-1">Cola de trabajo para el procesamiento de muestras.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-3 mb-6">
                    <KpiCard title="Muestras Pendientes" value={initialRequests.filter(r => r.status === 'Pendiente').length.toString()} icon={<Clock className="h-4 w-4 text-gray-400"/>}/>
                    <KpiCard title="Resultados Completados (Hoy)" value="1" icon={<CheckCircle className="h-4 w-4 text-gray-400"/>}/>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Lista de Solicitudes</CardTitle>
                             <div className="flex gap-2">
                                <Input placeholder="Buscar por paciente..." className="w-64"/>
                                <Button variant="outline"><SlidersHorizontal className="h-4 w-4 mr-2"/>Filtros</Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr className="text-left text-gray-600">
                                        <th className="p-3">Solicitud</th>
                                        <th className="p-3">Paciente</th>
                                        <th className="p-3">Pruebas Solicitadas</th>
                                        <th className="p-3">Estado</th>
                                        <th className="p-3 text-center">Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {initialRequests.map(req => {
                                        const status = statusConfig[req.status];
                                        return (
                                            <tr key={req.id} className="border-b bg-white">
                                                <td className="p-3 font-medium">{req.id}<p className="text-xs text-gray-500 font-normal">{new Date(req.date).toLocaleDateString()}</p></td>
                                                <td className="p-3"><p className="font-semibold">{req.patientName}</p><p className="text-xs text-gray-500">{req.ownerName}</p></td>
                                                <td className="p-3"><div className="flex flex-wrap gap-1">{req.tests.map(test => <span key={test} className="text-xs bg-gray-100 px-2 py-1 rounded-md">{test}</span>)}</div></td>
                                                <td className="p-3"><span className={`inline-flex items-center gap-2 px-2 py-1 rounded-full font-semibold ${status.color}`}>{status.icon} {req.status}</span></td>
                                                <td className="p-3 text-center">
                                                    {/* En una app real, este botón sería un <Link> */}
                                                    <Button variant="outline" size="sm">
                                                        {req.status === 'Completado' ? 'Ver Resultados' : 'Procesar Muestra'}
                                                    </Button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
