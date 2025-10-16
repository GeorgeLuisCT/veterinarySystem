"use client";

import { Pill, Package, Stethoscope } from 'lucide-react';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import ClinicalServicesMain from '../components/clinical-service-main';
import { PrescriptionTemplatesMain } from '../components/prescription-templates-main';
import { HealthPlansMain } from '../components/health-plans-main';
import { InventoryNavigation } from '../../inventory/products/components/inventory-navigation';
import DashboardLayoutSection from '../../dashboard-layout-section';

export default function ClinicalCatalogPage() {
    return (
        <DashboardLayoutSection>
            <div className="h-full">
                <div className="w-full h-full flex flex-col">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-slate-900">Catálogo Clínico</h1>
                        <p className="text-gray-600 mt-1">Gestiona los servicios, plantillas y planes que ofrece la veterinaria.</p>
                    </div>

                    <Tabs defaultValue="services" className="w-full flex-1 h-full">
                        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 sm:w-auto">
                            <TabsTrigger value="services">
                                <Stethoscope className="h-4 w-4 mr-2" />
                                Servicios y Procedimientos
                            </TabsTrigger>
                            <TabsTrigger value="templates">
                                <Pill className="h-4 w-4 mr-2" />
                                Plantillas de Recetas
                            </TabsTrigger>
                            <TabsTrigger value="plans">
                                <Package className="h-4 w-4 mr-2" />
                                Planes de Salud
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="services" className="mt-4">
                            <ClinicalServicesMain />
                        </TabsContent>
                        <TabsContent value="templates" className="mt-4">
                            <PrescriptionTemplatesMain />
                        </TabsContent>
                        <TabsContent value="plans" className="mt-4">
                            <HealthPlansMain />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </DashboardLayoutSection>
    );
}
