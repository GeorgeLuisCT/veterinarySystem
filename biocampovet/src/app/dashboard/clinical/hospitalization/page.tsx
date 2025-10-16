"use client";

import React, { useState } from 'react';
import { BedDouble, PlusCircle, User, AlertTriangle, FileText, PawPrint } from 'lucide-react';
import Link from 'next/link';

// --- Tipos de Datos (TypeScript) ---
type PatientStatus = 'Estable' | 'Observación' | 'Crítico';
type AdmittedPatient = {
    id: number;
    cageId: number;
    name: string;
    ownerName: string;
    reason: string;
    status: PatientStatus;
};
type Cage = { id: number; name: string; size: 'Pequeña' | 'Mediana' | 'Grande'; };

// --- Componentes de UI Nativos ---
const Button = ({ children, onClick, variant = 'default', size = 'md', className = '' }: { children: React.ReactNode, onClick?: () => void, variant?: string, size?: string, className?: string }) => <button className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors disabled:opacity-50 ${className}`} onClick={onClick}>{children}</button>;
const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => <div className={`rounded-xl border bg-white text-slate-900 shadow-sm ${className}`}>{children}</div>;
const CardHeader = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => <div className={`flex flex-col space-y-1.5 p-4 ${className}`}>{children}</div>;
const CardTitle = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => <h3 className={`text-base font-semibold leading-none tracking-tight ${className}`}>{children}</h3>;
const CardContent = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => <div className={`p-4 pt-0 ${className}`}>{children}</div>;

// --- DATOS SIMULADOS ---
const cages: Cage[] = [
    { id: 1, name: 'Jaula 01', size: 'Mediana' }, { id: 2, name: 'Jaula 02', size: 'Mediana' },
    { id: 3, name: 'Jaula 03', size: 'Grande' }, { id: 4, name: 'Jaula 04', size: 'Pequeña' },
    { id: 5, name: 'Jaula 05', size: 'Pequeña' }, { id: 6, name: 'Jaula 06', size: 'Grande' },
];
const initialAdmittedPatients: AdmittedPatient[] = [
    { id: 3, cageId: 1, name: 'Rocky', ownerName: 'Luis Fernández', reason: 'Post-operatorio Esterilización', status: 'Estable' },
    { id: 5, cageId: 3, name: 'Thor', ownerName: 'Miguel Torres', reason: 'Intoxicación alimentaria', status: 'Observación' },
    { id: 9, cageId: 4, name: 'Milo', ownerName: 'Laura Jimenez', reason: 'Fractura de fémur', status: 'Crítico' },
];

const statusConfig = {
    'Estable': { color: 'border-green-500', text: 'text-green-700', bg: 'bg-green-50' },
    'Observación': { color: 'border-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
    'Crítico': { color: 'border-red-500', text: 'text-red-700', bg: 'bg-red-50' },
};

// --- COMPONENTE PRINCIPAL ---
export default function HospitalizationBoardPage() {
    const [admittedPatients, setAdmittedPatients] = useState(initialAdmittedPatients);
    const [isAdmitModalOpen, setAdmitModalOpen] = useState(false);

    const OccupiedCageCard = ({ patient }: { patient: AdmittedPatient }) => {
        const status = statusConfig[patient.status];
        return (
            <Card className={`flex flex-col border-l-8 ${status.color}`}>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>{patient.name}</CardTitle>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>{patient.status}</span>
                    </div>
                    <p className="text-xs text-gray-500">{patient.ownerName}</p>
                </CardHeader>
                <CardContent className="flex-grow">
                    <p className="text-sm text-gray-700">{patient.reason}</p>
                </CardContent>
                <div className="bg-gray-50 px-4 py-3 rounded-b-xl">
                    {/* En una app real, esto sería un <Link> a la página de la ficha */}
                    <Link href={`/dashboard/clinical/hospitalization/${patient.id}`} className="w-full">
                        <FileText className="mr-2 h-4 w-4" /> Ver Ficha de Hospitalización
                    </Link>
                </div>
            </Card>
        );
    };

    const EmptyCageCard = ({ cage }: { cage: Cage }) => (
        <Card className="border-dashed border-2 flex flex-col items-center justify-center min-h-[180px]">
            <div className="text-center text-gray-400">
                <BedDouble className="mx-auto h-8 w-8 mb-2" />
                <p className="font-semibold">{cage.name}</p>
                <p className="text-sm">{cage.size}</p>
                <Button variant="ghost" className="mt-2 text-blue-600" onClick={() => setAdmitModalOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Admitir Paciente
                </Button>
            </div>
        </Card>
    );

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-slate-900">Tablero de Hospitalización</h1>
                    <p className="text-gray-600 mt-1">Estado en tiempo real de las jaulas y pacientes internados.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {cages.map(cage => {
                        const patientInCage = admittedPatients.find(p => p.cageId === cage.id);
                        return patientInCage ? <OccupiedCageCard key={cage.id} patient={patientInCage} /> : <EmptyCageCard key={cage.id} cage={cage} />;
                    })}
                </div>
            </div>
            {isAdmitModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <Card className="w-full max-w-md">
                        <CardHeader><CardTitle>Admitir Paciente</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-center text-gray-600 p-8">[Aquí iría un buscador de pacientes para seleccionar y un formulario para el motivo de admisión y tambien mandar directo del cosultorio]</p>
                            <div className="flex justify-end gap-2 mt-4">
                                <Button variant="ghost" onClick={() => setAdmitModalOpen(false)}>Cancelar</Button>
                                <Button>Confirmar Admisión</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}