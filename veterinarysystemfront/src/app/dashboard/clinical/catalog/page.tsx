"use client";

import { Pill, Stethoscope, FlaskConical } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ClinicalServicesMain from "../components/clinical-service-main";
import { PrescriptionTemplatesMain } from "../components/prescription-templates-main";
import { LaboratoryTestsMain } from "../components/laboratory-tests-main";

import DashboardLayoutSection from "../../dashboard-layout-section";
import { PageContainer } from "@/components/page/page-container";
import { PageHeader } from "@/components/page/page-header";

export default function ClinicalCatalogPage() {
  return (
    <DashboardLayoutSection>
      <PageContainer>
        <PageHeader
          title="Catálogo Clínico"
          description="Gestiona los servicios, plantillas y planes que ofrece la veterinaria."
        />
        <div className="flex h-full w-full flex-col">
          <Tabs defaultValue="services" className="w-full flex-1 h-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 sm:w-auto">
              <TabsTrigger value="services">
                <Stethoscope className="h-4 w-4 mr-2" />
                Servicios y Procedimientos
              </TabsTrigger>
              <TabsTrigger value="lab-tests">
                <FlaskConical className="h-4 w-4 mr-2" />
                Pruebas de Laboratorio
              </TabsTrigger>
              <TabsTrigger value="templates">
                <Pill className="h-4 w-4 mr-2" />
                Plantillas de Recetas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="services" className="mt-4">
              <ClinicalServicesMain />
            </TabsContent>
            <TabsContent value="lab-tests" className="mt-4">
              <LaboratoryTestsMain />
            </TabsContent>
            <TabsContent value="templates" className="mt-4">
              <PrescriptionTemplatesMain />
            </TabsContent>
          </Tabs>
        </div>
      </PageContainer>
    </DashboardLayoutSection>
  );
}
