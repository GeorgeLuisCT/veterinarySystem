"use client";

import React, { useState } from 'react';
import { Warehouse, Truck, ArrowLeftRight, Search, PackagePlus, PackageMinus, Save } from 'lucide-react';

// --- Tipos de Datos (TypeScript) ---
type Product = {
    id: string;
    name: string;
    category: 'Vacunas' | 'Antibióticos' | 'Vitaminas' | 'Material';
    stock: number;
};
type MobileItem = {
    productId: string;
    name: string;
    quantity: number;
};
type Veterinarian = { id: number; name: string; };

// --- Componentes de UI Nativos ---
const Button = ({ children, onClick, variant = 'default', size = 'md', className = '' }: { children: React.ReactNode, onClick?: () => void, variant?: string, size?: string, className?: string }) => <button className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors disabled:opacity-50 ${className}`} onClick={onClick}>{children}</button>;
const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => <div className={`rounded-xl border bg-white text-slate-900 shadow-sm ${className}`}>{children}</div>;
const CardHeader = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>;
const CardTitle = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>{children}</h3>;
const CardContent = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => <div className={`p-6 pt-0 ${className}`}>{children}</div>;
const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => <div className="relative"><Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" /><input {...props} className={`flex h-10 w-full rounded-md border border-slate-300 bg-transparent pl-9 pr-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${props.className || ''}`} /></div>;
const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => <select {...props} className={`flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${props.className || ''}`}>{props.children}</select>

// --- DATOS SIMULADOS ---
const mainInventory: Product[] = [
    { id: 'VAC-05', name: 'Vacuna Clostridial x100 dosis', category: 'Vacunas', stock: 25 },
    { id: 'ANT-02', name: 'Antibiótico L.A. x500ml', category: 'Antibióticos', stock: 40 },
    { id: 'VIT-01', name: 'Complejo Vitamínico x250ml', category: 'Vitaminas', stock: 32 },
    { id: 'MAT-01', name: 'Jeringas Descartables x100', category: 'Material', stock: 50 },
    { id: 'MAT-02', name: 'Guantes de Palpación x100', category: 'Material', stock: 18 },
    { id: 'ANT-03', name: 'Penicilina G x100ml', category: 'Antibióticos', stock: 60 },
];
const initialMobileInventory: MobileItem[] = [
    { productId: 'VAC-05', name: 'Vacuna Clostridial x100 dosis', quantity: 2 },
    { productId: 'ANT-02', name: 'Antibiótico L.A. x500ml', quantity: 5 },
];
const veterinarians: Veterinarian[] = [
    { id: 1, name: 'Dr. Alan Morales' }, { id: 2, name: 'Dra. Sofia Castillo' },
];


// --- COMPONENTE PRINCIPAL ---
export default function FieldSuppliesPage() {
    const [mobileInventory, setMobileInventory] = useState<MobileItem[]>(initialMobileInventory);
    const [selectedVetId, setSelectedVetId] = useState<number>(1);
    const [transferQuantities, setTransferQuantities] = useState<Record<string, number>>({});

    const handleAddToVehicle = (product: Product) => {
        const quantity = transferQuantities[product.id] || 1;
        if (quantity <= 0 || quantity > product.stock) {
            alert("Cantidad inválida o excede el stock.");
            return;
        }

        setMobileInventory(prev => {
            const existingItem = prev.find(item => item.productId === product.id);
            if (existingItem) {
                return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + quantity } : item);
            }
            return [...prev, { productId: product.id, name: product.name, quantity }];
        });
    };

    const handleRemoveFromVehicle = (productId: string) => {
        setMobileInventory(prev => prev.filter(item => item.productId !== productId));
    };

    const handleConfirmTransfer = () => {
        alert(`TRANSFERENCIA GUARDADA\n\nSe ha actualizado el inventario móvil para ${veterinarians.find(v => v.id === selectedVetId)?.name}.\n\nEn un sistema real, el stock principal se reduciría y se registraría un movimiento de inventario.`);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-slate-900">Gestión de Insumos para Campo</h1>
                    <p className="text-gray-600 mt-1">Transfiere productos del almacén principal al inventario móvil del vehículo.</p>
                </div>

                <Card className="mb-6">
                    <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="w-full md:w-1/3">
                            <label className="text-sm font-medium">Veterinario de Campo</label>
                            <Select value={selectedVetId} onChange={e => setSelectedVetId(Number(e.target.value))}>
                                {veterinarians.map(vet => <option key={vet.id} value={vet.id}>{vet.name}</option>)}
                            </Select>
                        </div>
                        <Button onClick={handleConfirmTransfer} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                            <Save className="mr-2 h-4 w-4" /> Confirmar y Guardar Movimientos
                        </Button>
                    </div>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* --- Panel Izquierdo: Inventario Principal --- */}
                    <Card>
                        <CardHeader className="flex-row items-center gap-2">
                            <Warehouse className="h-6 w-6 text-gray-500" />
                            <CardTitle>Inventario Principal (Almacén)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Input placeholder="Buscar producto en almacén..." className="mb-4" />
                            <div className="max-h-[60vh] overflow-y-auto pr-2">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-white">
                                        <tr className="border-b">
                                            <th className="text-left p-2">Producto</th>
                                            <th className="text-center p-2">Stock</th>
                                            <th className="text-center p-2">Cantidad</th>
                                            <th className="text-right p-2">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {mainInventory.map(product => (
                                            <tr key={product.id} className="border-b">
                                                <td className="p-2">
                                                    <p className="font-medium">{product.name}</p>
                                                    <p className="text-xs text-gray-500">{product.category}</p>
                                                </td>
                                                <td className="p-2 text-center font-semibold">{product.stock}</td>
                                                <td className="p-2 w-20">
                                                    <Input type="number" min="1" max={product.stock} className="h-8 text-center p-1 pl-2" onChange={e => setTransferQuantities({ ...transferQuantities, [product.id]: Number(e.target.value) })} placeholder="1" />
                                                </td>
                                                <td className="p-2 text-right">
                                                    <Button size="sm" variant="ghost" className="text-blue-600" onClick={() => handleAddToVehicle(product)}><PackagePlus className="h-4 w-4" /></Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* --- Panel Derecho: Inventario Móvil --- */}
                    <Card>
                        <CardHeader className="flex-row items-center gap-2">
                            <Truck className="h-6 w-6 text-blue-600" />
                            <CardTitle>Inventario Móvil (Vehículo)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600 mb-4">Insumos cargados para {veterinarians.find(v => v.id === selectedVetId)?.name}.</p>
                            <div className="max-h-[60vh] overflow-y-auto pr-2">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-white">
                                        <tr className="border-b">
                                            <th className="text-left p-2">Producto</th>
                                            <th className="text-center p-2">Cantidad</th>
                                            <th className="text-right p-2">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {mobileInventory.length === 0 && (
                                            <tr><td colSpan={3} className="text-center p-8 text-gray-400">El inventario móvil está vacío.</td></tr>
                                        )}
                                        {mobileInventory.map(item => (
                                            <tr key={item.productId} className="border-b">
                                                <td className="p-2 font-medium">{item.name}</td>
                                                <td className="p-2 text-center font-semibold text-blue-700">{item.quantity}</td>
                                                <td className="p-2 text-right">
                                                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleRemoveFromVehicle(item.productId)}><PackageMinus className="h-4 w-4" /></Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}