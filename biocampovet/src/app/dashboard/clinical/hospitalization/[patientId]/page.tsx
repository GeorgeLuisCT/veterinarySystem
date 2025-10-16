"use client";

import React, { useState } from 'react';
import { User, ClipboardList, Stethoscope, Clock, Pill, Thermometer, Droplets, MessageSquare, Save, LogOut, ClipboardPlus } from 'lucide-react';

// --- Tipos de Datos (TypeScript) ---
type PatientData = { id: number; name: string; ownerName: string; reason: string; admissionDate: string; };
type Treatment = { id: string; name: string; frequency: number; }; // frequency in hours
type ProgressNote = { timestamp: string; note: string; author: string; };
type AdministeredLog = { treatmentId: string; time: string; author: string; };

// --- Componentes de UI Nativos ---
const Button = ({ children, onClick, variant = 'default', size = 'md', className = '' }: { children: React.ReactNode, onClick?: () => void, variant?: string, size?: string, className?: string }) => <button className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors disabled:opacity-50 ${className}`} onClick={onClick}>{children}</button>;
const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => <div className={`rounded-xl border bg-white text-slate-900 shadow-sm ${className}`}>{children}</div>;
const CardHeader = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>;
const CardTitle = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>{children}</h3>;
const CardContent = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => <div className={`p-6 pt-0 ${className}`}>{children}</div>;
const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} className={`flex min-h-[80px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${props.className || ''}`} />;


// --- DATOS SIMULADOS ---
const patientData: PatientData = { id: 3, name: 'Rocky', ownerName: 'Luis Fernández', reason: 'Cirugía Programada: Esterilización', admissionDate: '2025-10-09T08:30:00' };
const treatments: Treatment[] = [
    { id: 't01', name: 'Antibiótico IV', frequency: 8 },
    { id: 't02', name: 'Analgésico IM', frequency: 12 },
    { id: 't03', name: 'Medir Temperatura', frequency: 4 },
    { id: 't04', name: 'Fluidoterapia', frequency: 1 }, // Continuo
    { id: 't05', name: 'Limpieza de Herida', frequency: 24 },
];
const initialLog: AdministeredLog[] = [
    { treatmentId: 't01', time: '08:00', author: 'Dr. P' }, { treatmentId: 't02', time: '08:00', author: 'Dr. P' },
    { treatmentId: 't03', time: '08:00', author: 'Dr. P' }, { treatmentId: 't04', time: '08:00', author: 'Dr. P' },
    { treatmentId: 't03', time: '12:00', author: 'Asis. L' }, { treatmentId: 't04', time: '09:00', author: 'Dr. P' },
];
const initialNotes: ProgressNote[] = [
    { timestamp: '2025-10-09T12:05:00', note: 'Paciente se muestra tranquilo, sin vocalizaciones de dolor. Lamiendo la zona de la herida, se coloca collar isabelino.', author: 'Asis. L' },
    { timestamp: '2025-10-09T08:35:00', note: 'Paciente ingresa a hospitalización, se coloca catéter y se inicia fluidoterapia. Se administran primeras dosis de medicación post-quirúrgica.', author: 'Dr. P' },
];

// --- COMPONENTE PRINCIPAL ---
export default function HospitalizationChartPage() {
    const [administeredLog, setAdministeredLog] = useState(initialLog);
    const [progressNotes, setProgressNotes] = useState(initialNotes);
    const [isSurgicalReportModalOpen, setSurgicalReportModalOpen] = useState(false);
    const timeSlots = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '00:00', '02:00', '04:00', '06:00'];

    const handleAdminister = (treatmentId: string, time: string) => {
        if (administeredLog.some(log => log.treatmentId === treatmentId && log.time === time)) return; // Ya administrado
        setAdministeredLog([...administeredLog, { treatmentId, time, author: 'Vet. A' }]);
    };

    const handleDischarge = () => {
        alert(`PACIENTE DADO DE ALTA\n\nNombre: ${patientData.name}\nSe han finalizado los registros y todos los cargos por hospitalización (días, medicamentos, procedimientos) se han enviado a facturación.`);
    };

    const SurgicalReportModal = () => (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setSurgicalReportModalOpen(false)}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl" onClick={e => e.stopPropagation()}>
                <CardHeader>
                    <CardTitle>Reporte Quirúrgico</CardTitle>
                    <p className="text-sm text-gray-500">Paciente: {patientData.name}</p>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-gray-600 p-12">
                        [Aquí iría el formulario detallado del reporte quirúrgico: <br />
                        - Protocolo de Anestesia <br />
                        - Hallazgos y Descripción del Procedimiento <br />
                        - Materiales Utilizados <br />
                        - Indicaciones Post-Operatorias]

                        Una vez finalizado, las indicaciones post-operatorias (medicamentos) se añaden automáticamente a la "Hoja de Tratamiento" del paciente hospitalizado.
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="ghost" onClick={() => setSurgicalReportModalOpen(false)}>Cancelar</Button>
                        <Button>Finalizar y Guardar Reporte</Button>
                    </div>
                </CardContent>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* --- Encabezado Fijo --- */}
            <div className="p-4 bg-white border-b sticky top-0 z-10">
                <div className="flex justify-between items-center max-w-screen-xl mx-auto">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Ficha de Hospitalización</h1>
                        <p className="text-sm text-gray-600">Paciente: <span className="font-semibold text-blue-600">{patientData.name}</span></p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="text-orange-600 border-orange-300 hover:bg-orange-50" onClick={() => setSurgicalReportModalOpen(true)}>
                            <ClipboardPlus className="h-4 w-4 mr-2" /> Iniciar Reporte Quirúrgico
                        </Button>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleDischarge}>
                            <LogOut className="h-4 w-4 mr-2" /> Dar de Alta
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-screen-xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* --- Columna Principal: Hoja de Tratamiento y Bitácora --- */}
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
                                    {treatments.map(treat => (
                                        <tr key={treat.id}>
                                            <td className="border p-2 text-left font-medium">{treat.name}</td>
                                            {timeSlots.map(time => {
                                                const log = administeredLog.find(l => l.treatmentId === treat.id && l.time === time);
                                                const isDue = parseInt(time) % treat.frequency === 0 || treat.frequency === 1; // Simplificación
                                                return (
                                                    <td key={time} className={`border p-2 ${!isDue && 'bg-gray-50'}`}>
                                                        {log ? (
                                                            <span className="font-bold text-green-600" title={`Realizado por ${log.author}`}>✓</span>
                                                        ) : isDue ? (
                                                            <button onClick={() => handleAdminister(treat.id, time)} className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 text-xs">A</button>
                                                        ) : null}
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
                                {progressNotes.map((note, i) => (
                                    <div key={i} className="text-sm border-b pb-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-semibold">{note.author}</span>
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

                {/* --- Columna Lateral: Resumen --- */}
                <aside className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Resumen del Paciente</CardTitle></CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <p><strong>Propietario:</strong> {patientData.ownerName}</p>
                            <p><strong>Motivo de Admisión:</strong> {patientData.reason}</p>
                            <p><strong>Fecha de Ingreso:</strong> {new Date(patientData.admissionDate).toLocaleString('es-ES')}</p>
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
            {isSurgicalReportModalOpen && <SurgicalReportModal />}
        </div>
    );
}
