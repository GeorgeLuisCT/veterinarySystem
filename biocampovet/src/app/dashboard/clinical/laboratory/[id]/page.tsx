"use client";

import React, { useState } from 'react';
import { FileText, User, Dog, Stethoscope, Droplets, Microscope, Save, Printer } from 'lucide-react';

// --- Tipos de Datos (TypeScript) ---
type LabResult = { parameter: string; value: string; unit: string; range: string; };
type TestData = { name: string; results: LabResult[]; };

// --- Componentes de UI Nativos ---
const Button = ({ children, onClick, variant = 'default', size = 'md', className = '' }: { children: React.ReactNode, onClick?: () => void, variant?: string, size?: string, className?: string }) => <button className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors disabled:opacity-50 ${className}`} onClick={onClick}>{children}</button>;
const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => <div className={`rounded-xl border bg-white text-slate-900 shadow-sm ${className}`}>{children}</div>;
const CardHeader = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>;
const CardTitle = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>{children}</h3>;
const CardContent = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => <div className={`p-6 pt-0 ${className}`}>{children}</div>;
const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} className={`flex h-9 w-full rounded-md border border-slate-300 bg-transparent px-3 py-1 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${props.className || ''}`} />;
const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} className={`flex min-h-[80px] w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${props.className || ''}`} />;

// --- DATOS SIMULADOS ---
const requestData = {
    id: 'LAB-001', patientName: 'Max', ownerName: 'C. Rodríguez', requestingVet: 'Dra. González', date: '2025-10-10'
};
const testsToFill: TestData[] = [
    {
        name: 'Hemograma Completo',
        results: [
            { parameter: 'Hematocrito', value: '45', unit: '%', range: '37-55' },
            { parameter: 'Hemoglobina', value: '15', unit: 'g/dL', range: '12-18' },
            { parameter: 'Leucocitos', value: '8.5', unit: 'x10³/μL', range: '6.0-17.0' },
            { parameter: 'Plaquetas', value: '250', unit: 'x10³/μL', range: '200-500' },
        ]
    },
    {
        name: 'Perfil Bioquímico',
        results: [
            { parameter: 'Glucosa', value: '95', unit: 'mg/dL', range: '70-125' },
            { parameter: 'Urea (BUN)', value: '18', unit: 'mg/dL', range: '7-27' },
            { parameter: 'Creatinina', value: '1.1', unit: 'mg/dL', range: '0.5-1.5' },
            { parameter: 'ALT', value: '35', unit: 'U/L', range: '10-100' },
        ]
    }
];

// --- COMPONENTE PRINCIPAL ---
export default function FillLabResultsPage() {
    
    const handleFinalize = () => {
        alert(`RESULTADOS GUARDADOS\n\nSolicitud: ${requestData.id}\nSe ha guardado el resultado para ${testsToFill.length} pruebas.\nEl estado de la solicitud cambiará a "Completado" y se notificará a ${requestData.requestingVet}.`);
    };

    const TestResultCard = ({ test }: { test: TestData }) => (
        <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Droplets className="h-5 w-5 text-blue-600"/>{test.name}</CardTitle></CardHeader>
            <CardContent>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b text-left text-gray-500">
                            <th className="p-2 font-medium">Parámetro</th>
                            <th className="p-2 font-medium">Resultado</th>
                            <th className="p-2 font-medium">Unidades</th>
                            <th className="p-2 font-medium">Rango de Referencia</th>
                        </tr>
                    </thead>
                    <tbody>
                        {test.results.map(res => (
                            <tr key={res.parameter} className="border-b">
                                <td className="p-2 font-semibold">{res.parameter}</td>
                                <td className="p-2"><Input defaultValue={res.value} className="w-24"/></td>
                                <td className="p-2 text-gray-600">{res.unit}</td>
                                <td className="p-2 text-gray-600">{res.range}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </CardContent>
        </Card>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="p-4 bg-white border-b sticky top-0 z-10">
                <div className="flex justify-between items-center max-w-5xl mx-auto">
                     <div>
                        <h1 className="text-xl font-bold text-slate-900">Registro de Resultados de Laboratorio</h1>
                        <p className="text-sm text-gray-600">Solicitud: <span className="font-semibold text-blue-600">{requestData.id}</span></p>
                    </div>
                     <div className="flex gap-2">
                        <Button variant="outline"><Printer className="h-4 w-4 mr-2"/> Imprimir Hoja de Trabajo</Button>
                        <Button onClick={handleFinalize} className="bg-green-600 hover:bg-green-700 text-white shadow-sm">
                            <Save className="h-4 w-4 mr-2"/> Finalizar y Guardar Resultados
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
                <Card>
                    <CardContent className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2"><Dog className="h-4 w-4 text-gray-500"/><strong>Paciente:</strong><span>{requestData.patientName}</span></div>
                        <div className="flex items-center gap-2"><User className="h-4 w-4 text-gray-500"/><strong>Propietario:</strong><span>{requestData.ownerName}</span></div>
                        <div className="flex items-center gap-2"><Stethoscope className="h-4 w-4 text-gray-500"/><strong>Solicita:</strong><span>{requestData.requestingVet}</span></div>
                        <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-gray-500"/><strong>Fecha:</strong><span>{new Date(requestData.date).toLocaleDateString()}</span></div>
                    </CardContent>
                </Card>

                {testsToFill.map(test => <TestResultCard key={test.name} test={test}/>)}
                
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Microscope className="h-5 w-5 text-blue-600"/>Interpretación y Observaciones</CardTitle></CardHeader>
                    <CardContent>
                        <Textarea rows={4} placeholder="Añadir observaciones generales, interpretación de los resultados o notas para el veterinario solicitante..."/>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
