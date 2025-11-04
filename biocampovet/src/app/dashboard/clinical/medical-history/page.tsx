"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import AnimalInfoCard from "./components/animal-info-card";
import LastVisitSummary from "./components/last-visit-summary";
import ClinicalHistoryTabs from "./components/clinical-history-tabs";
import PreventiveMedicineTabs from "./components/preventive-medicine-tabs";
import DiagnosticsAndFollowUpTabs from "./components/diagnostics-and-follow-up-tabs";


// NOTE: Mock data – replace with real fetch
const medicalRecords = [
  {
    id: 1,
    patientName: "Max",
    owner: "Carlos Rodríguez",
    lastVisit: "2024-01-05",
    species: "Perro",
    breed: "Golden Retriever",
    age: "5 años",
    sex: "Macho (Castrado)",
    microchip: "985100012345678",
    allergies: ["Pollo"],
    chronicConditions: ["Artritis leve en cadera derecha"],
    behaviorNotes: "Ansioso con ruidos fuertes, amigable con el personal.",
    diet: {
      food: "Royal Canin Hypoallergenic",
      quantity: "350g al día",
      notes:
        "Dieta estricta por alergia al pollo. Evitar snacks no recetados.",
    },
    weightHistory: [
      { date: "2023-06-15", weightKg: 29.8 },
      { date: "2023-12-10", weightKg: 30.2 },
      { date: "2024-01-05", weightKg: 30.5 },
    ],
    consultations: [
      {
        date: "2024-01-05",
        type: "Consulta General",
        vet: "Dra. María González",
        reasonForVisit:
          "El propietario reporta que Max se rasca mucho la oreja derecha.",
        vitals: { weight: "30.5 kg", temp: "38.5°C", hr: "90 lpm", rr: "20 rpm" },
        diagnosis: "Otitis externa leve",
        treatment: "Limpieza de oídos y gotas antibióticas",
        notes: "Mejoría notable. Control en 7 días.",
      },
      {
        date: "2023-12-10",
        type: "Chequeo y Vacunación",
        vet: "Dr. Pedro Martínez",
        reasonForVisit: "Control anual y aplicación de vacuna antirrábica.",
        vitals: { weight: "30.2 kg", temp: "38.6°C", hr: "85 lpm", rr: "18 rpm" },
        diagnosis: "Paciente sano, chequeo preventivo",
        treatment: "Vacuna antirrábica anual",
        notes: "Sin reacciones adversas.",
      },
    ],
    vaccines: [
      { name: "Antirrábica", date: "2023-12-10", nextDue: "2024-12-10", status: "Vigente" },
      { name: "Parvovirus", date: "2023-06-15", nextDue: "2024-06-15", status: "Próxima" },
      { name: "Moquillo", date: "2023-06-15", nextDue: "2024-06-15", status: "Próxima" },
    ],
    deworming: [
      { date: "2023-12-10", product: "Milbemax", type: "Interna", nextDue: "2024-03-10" },
      { date: "2023-12-28", product: "Bravecto", type: "Externa", nextDue: "2024-03-28" },
    ],
    procedures: [
      {
        date: "2021-03-15",
        procedure: "Castración",
        vet: "Dr. Alan Morales",
        notes: "Recuperación sin complicaciones.",
      },
    ],
    prescriptions: [
      {
        date: "2024-01-05",
        medication: "Otomax (Gotas óticas)",
        dosage: "3 gotas cada 12 horas",
        duration: "7 días",
      },
    ],
    labResults: [
      {
        date: "2023-11-20",
        test: "Hemograma completo",
        result: "Normal",
        file: "hemograma_max_112023.pdf",
      },
    ],
    imagingStudies: [
      {
        date: "2023-05-10",
        type: "Radiografía de Cadera",
        summary:
          "Leves signos de displasia en cadera derecha, compatibles con artritis.",
        file: "rx_cadera_max_052023.dcm",
      },
    ],
    groomingHistory: [
      {
        date: "2022-09-01",
        procedure: "Profilaxis Dental",
        vet: "Dr. Alan Morales",
        notes: "Eliminación de sarro moderado. Sin extracciones.",
      },
    ],
  },
];

export default function MedicalHistoryPage() {
  const [selectedPatient] = useState(medicalRecords[0]);
  if (!selectedPatient) return <div>Cargando paciente...</div>;

  const lastConsultation = selectedPatient.consultations?.[0];

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <main className="flex-1 p-4 sm:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* 1) Información del animal */}
          <AnimalInfoCard patient={selectedPatient}>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" /> Exportar PDF
            </Button>
          </AnimalInfoCard>

          {/* 2) Resumen de la última visita */}
          {lastConsultation && (
            <LastVisitSummary consultation={lastConsultation} />
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* 3) Historial Clínico y Tratamientos (SIN Recetas) */}
            <ClinicalHistoryTabs
              consultations={selectedPatient.consultations}
              procedures={selectedPatient.procedures}
            />

            {/* 4) Medicina Preventiva */}
            <PreventiveMedicineTabs
              vaccines={selectedPatient.vaccines}
              deworming={selectedPatient.deworming}
              groomingHistory={selectedPatient.groomingHistory}
            />
          </div>

          {/* 5) Diagnóstico y Seguimiento (solo Laboratorio y Peso) */}
          <DiagnosticsAndFollowUpTabs
            labResults={selectedPatient.labResults}
            weightHistory={selectedPatient.weightHistory}
          />
        </div>
      </main>
    </div>
  );
}
