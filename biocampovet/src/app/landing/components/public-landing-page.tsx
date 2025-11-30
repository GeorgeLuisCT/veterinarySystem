"use client";

import { useCallback, useEffect, useState } from "react";

import DocumentTypeService from "@/app/dashboard/crm/customers/service/DocumentTypeService";
import type { DocumentTypeResponse } from "@/app/dashboard/crm/customers/types/document-type-response";
import type { BranchResponse } from "@/app/dashboard/branche/types/branch-response";
import PublicPortalService from "@/app/landing/service/public-portal-service";
import type { PublicAnimalSummary } from "@/app/landing/types/public-portal.types";
import { parseErrorMessage } from "@/app/landing/utils/helpers";
import { LandingHeader } from "@/app/landing/components/landing-header";
import { ServicesSection } from "@/app/landing/components/services-section";
import { ClinicalHistorySection } from "@/app/landing/components/clinical-history-section";
import { AppointmentRequestSection } from "@/app/landing/components/appointment-request-section";
import { LocationsSection } from "@/app/landing/components/locations-section";
import { LandingFooter } from "@/app/landing/components/landing-footer";

export type LookupContext = {
  documentTypeId: number;
  documentNumber: string;
};

export interface FeedbackMessage {
  tone: "success" | "error";
  text: string;
}

export function PublicLandingPage() {
  const [documentTypes, setDocumentTypes] = useState<DocumentTypeResponse[]>([]);
  const [branches, setBranches] = useState<BranchResponse[]>([]);
  const [animals, setAnimals] = useState<PublicAnimalSummary[]>([]);
  const [lookupContext, setLookupContext] = useState<LookupContext | null>(null);
  const [animalsLoading, setAnimalsLoading] = useState(false);
  const [lookupFeedback, setLookupFeedback] = useState<FeedbackMessage | null>(null);

  useEffect(() => {
    DocumentTypeService.getDocumentTypes()
      .then(setDocumentTypes)
      .catch(() => setDocumentTypes([]));
    PublicPortalService.listBranches()
      .then(setBranches)
      .catch(() => setBranches([]));
  }, []);

  const handleLookupAnimals = useCallback(async (payload: LookupContext) => {
    setAnimalsLoading(true);
    setLookupFeedback(null);
    try {
      const list = await PublicPortalService.findAnimals(
        payload.documentTypeId,
        payload.documentNumber,
      );
      setAnimals(list);
      setLookupContext(payload);
      if (list.length === 0) {
        setLookupFeedback({
          tone: "error",
          text: "No encontramos mascotas activas asociadas a este documento.",
        });
      } else {
        setLookupFeedback({
          tone: "success",
          text: "Mascotas encontradas. Elige cuál deseas consultar.",
        });
      }
    } catch (error) {
      setLookupFeedback({
        tone: "error",
        text: parseErrorMessage(error),
      });
      setAnimals([]);
      setLookupContext(null);
    } finally {
      setAnimalsLoading(false);
    }
  }, []);

  return (
    // FONDO PASTEL: fuera el azul oscuro
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-white text-slate-700">
      {/* Header con variante pastel (opcional) */}
      <LandingHeader />

      <main className="mx-auto flex max-w-7xl flex-col gap-24 px-6 py-16 md:px-10 lg:px-16">
        {/* Sección servicios en tonos claros */}
        <ServicesSection />

        {/* Historial clínico: tarjetas claras y textos gris neutro */}
        <ClinicalHistorySection
          documentTypes={documentTypes}
          animals={animals}
          animalsLoading={animalsLoading}
          lookupFeedback={lookupFeedback}
          lookupContext={lookupContext}
          onLookupAnimals={handleLookupAnimals}
        />

        {/* Solicitud de cita en pastel */}
        <AppointmentRequestSection
          documentTypes={documentTypes}
          branches={branches}
          animals={animals}
          animalsLoading={animalsLoading}
          onLookupAnimals={handleLookupAnimals}
        />

        {/* Sedes en tarjetas claras */}
        <LocationsSection branches={branches} />
      </main>

      <LandingFooter />
    </div>
  );
}

export default PublicLandingPage;
