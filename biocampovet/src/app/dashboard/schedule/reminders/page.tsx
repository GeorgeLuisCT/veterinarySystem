"use client";

import React, { useState } from 'react';
import { Bell, Syringe, Bug, Stethoscope, Send, Check, Clock, Mail, MessageSquare } from 'lucide-react';

// --- Tipos de Datos (TypeScript) ---
type ReminderType = 'Vacuna' | 'Desparasitación' | 'Consulta de Control';
type ReminderStatus = 'Pendiente' | 'Enviado';
type Reminder = {
    id: number;
    patientName: string;
    ownerName: string;
    type: ReminderType;
    itemName: string; // Ej: "Vacuna Antirrábica"
    dueDate: string;
    contact: string;
    status: ReminderStatus;
};

// --- Componentes de UI Nativos ---
const Button = ({ children, onClick, variant = 'default', size = 'md', className = '' }: { children: React.ReactNode, onClick?: () => void, variant?: string, size?: string, className?: string }) => <button className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors disabled:opacity-50 ${className}`} onClick={onClick}>{children}</button>;
const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => <div className={`rounded-xl border bg-white text-slate-900 shadow-sm ${className}`}>{children}</div>;
const CardHeader = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>;
const CardTitle = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>{children}</h3>;
const CardContent = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => <div className={`p-6 pt-0 ${className}`}>{children}</div>;
const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => <select {...props} className={`flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${props.className || ''}`}>{props.children}</select>

// --- DATOS SIMULADOS ---
const initialReminders: Reminder[] = [
    { id: 1, patientName: 'Max', ownerName: 'Carlos R.', type: 'Vacuna', itemName: 'Antirrábica Anual', dueDate: '2025-10-15', contact: '555-1234', status: 'Pendiente' },
    { id: 2, patientName: 'Luna', ownerName: 'Ana M.', type: 'Vacuna', itemName: 'Triple Felina', dueDate: '2025-10-22', contact: '555-5678', status: 'Pendiente' },
    { id: 3, patientName: 'Rocky', ownerName: 'Luis F.', type: 'Desparasitación', itemName: 'Interna y Externa', dueDate: '2025-11-01', contact: '555-8765', status: 'Pendiente' },
    { id: 4, patientName: 'Kiara', ownerName: 'Sofía G.', type: 'Consulta de Control', itemName: 'Control Dermatológico', dueDate: '2025-10-18', contact: '555-4321', status: 'Pendiente' },
    { id: 5, patientName: 'Thor', ownerName: 'Miguel T.', type: 'Vacuna', itemName: 'Leucemia Felina', dueDate: '2025-09-30', contact: '555-1122', status: 'Enviado' },
];

const typeConfig = {
    'Vacuna': { icon: <Syringe className="h-4 w-4 text-purple-600" />, color: 'bg-purple-100 text-purple-800' },
    'Desparasitación': { icon: <Bug className="h-4 w-4 text-red-600" />, color: 'bg-red-100 text-red-800' },
    'Consulta de Control': { icon: <Stethoscope className="h-4 w-4 text-blue-600" />, color: 'bg-blue-100 text-blue-800' },
};
const statusConfig = {
    'Pendiente': { color: 'text-amber-600' },
    'Enviado': { color: 'text-green-600' },
};

// --- COMPONENTE PRINCIPAL ---
export default function RemindersPage() {
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const handleSendSelected = () => {
        if (selectedIds.length === 0) {
            alert("Por favor, selecciona al menos un recordatorio para enviar.");
            return;
        }
        alert(`Se enviarán ${selectedIds.length} recordatorios a los clientes seleccionados.`);
    };

    return (
        <div className="h-full bg-gray-50 p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-slate-900">Centro de Recordatorios</h1>
                    <p className="text-gray-600 mt-1">Gestiona las comunicaciones preventivas con los clientes.</p>
                </div>

                {/* --- KPIs / Métricas --- */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                    <Card>
                        <CardHeader className="flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Pendientes (Próximos 7 Días)</CardTitle>
                            <Bell className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent><div className="text-2xl font-bold">4</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Vacunas Próximas (Mes)</CardTitle>
                            <Syringe className="h-4 w-4 text-gray-400" />
                        </CardHeader>
                        <CardContent><div className="text-2xl font-bold">12</div></CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                            <CardTitle>Lista de Recordatorios</CardTitle>
                            <div className="flex gap-2">
                                <Select className="w-40"><option>Próximos 7 días</option><option>Próximos 30 días</option></Select>
                                <Select className="w-40"><option>Todos los Tipos</option><option>Vacunas</option><option>Desparasitación</option></Select>
                                <Select className="w-40"><option>Estado: Pendiente</option><option>Estado: Enviado</option></Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4 flex justify-between items-center">
                            <p className="text-sm text-gray-600">{selectedIds.length} seleccionados</p>
                            <Button onClick={handleSendSelected} disabled={selectedIds.length === 0}><Send className="mr-2 h-4 w-4" /> Enviar a Seleccionados</Button>
                        </div>
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr className="text-left text-gray-600">
                                        <th className="p-3 w-12 text-center"><input type="checkbox" /></th>
                                        <th className="p-3">Paciente / Propietario</th>
                                        <th className="p-3">Tipo de Recordatorio</th>
                                        <th className="p-3">Fecha Vencimiento</th>
                                        <th className="p-3">Estado</th>
                                        <th className="p-3 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {initialReminders.map(reminder => {
                                        const type = typeConfig[reminder.type];
                                        const status = statusConfig[reminder.status];
                                        return (
                                            <tr key={reminder.id} className="border-b">
                                                <td className="p-3 text-center"><input type="checkbox" checked={selectedIds.includes(reminder.id)} onChange={() => setSelectedIds(prev => prev.includes(reminder.id) ? prev.filter(id => id !== reminder.id) : [...prev, reminder.id])} /></td>
                                                <td className="p-3"><p className="font-medium">{reminder.patientName}</p><p className="text-xs text-gray-500">{reminder.ownerName}</p></td>
                                                <td className="p-3">
                                                    <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-semibold ${type.color}`}>
                                                        {type.icon} {reminder.itemName}
                                                    </span>
                                                </td>
                                                <td className="p-3 font-medium">{new Date(reminder.dueDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                                                <td className={`p-3 font-semibold ${status.color}`}>{reminder.status}</td>
                                                <td className="p-3">
                                                    <div className="flex justify-center gap-1">
                                                        <Button variant="ghost" size="sm" title="Enviar WhatsApp"><MessageSquare className="h-4 w-4" /></Button>
                                                        <Button variant="ghost" size="sm" title="Enviar Email"><Mail className="h-4 w-4" /></Button>
                                                        <Button variant="ghost" size="sm" title="Marcar como Enviado"><Check className="h-4 w-4" /></Button>
                                                        <Button variant="ghost" size="sm" title="Posponer"><Clock className="h-4 w-4" /></Button>
                                                    </div>
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
