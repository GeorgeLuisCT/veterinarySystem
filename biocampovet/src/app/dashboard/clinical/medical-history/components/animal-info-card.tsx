"use client";

import { ReactNode, useMemo } from "react";
import { AlertTriangle, CalendarClock, PawPrint } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ClinicalHistoryPatientInfo } from "../../types/medical-history-response";
import { AnimalSpeciesLabels } from "@/app/dashboard/crm/patients/enums/animal-species";
import { AnimalSexLabels } from "@/app/dashboard/crm/patients/enums/animal-sex";

interface Props {
  patient: ClinicalHistoryPatientInfo;
  children?: ReactNode;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function AnimalInfoCard({ patient, children }: Props) {
  const alertGroups = useMemo(() => {
    const allergies = patient.allergies?.filter(Boolean) ?? [];
    const chronic = patient.chronicConditions?.filter(Boolean) ?? [];
    return { allergies, chronic };
  }, [patient.allergies, patient.chronicConditions]);

  const ownerLine = patient.owner
    ? `${patient.owner.name}${patient.owner.documentNumber ? ` • ${patient.owner.documentNumber}` : ""}`
    : "Propietario no registrado";

  const speciesLabel = patient.speciesLabel ?? (patient.species ? AnimalSpeciesLabels[patient.species] : "—");
  const sexLabel = patient.sexLabel ?? (patient.sex ? AnimalSexLabels[patient.sex] : "—");

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <PawPrint className="h-5 w-5 text-primary" />
              <CardTitle className="text-2xl">{patient.name}</CardTitle>
            </div>
            <CardDescription className="flex flex-wrap items-center gap-2 text-sm">
              <span>{ownerLine}</span>
              {patient.lastVisitDate && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <CalendarClock className="h-3.5 w-3.5" />
                    Última visita: {formatDate(patient.lastVisitDate)}
                  </span>
                </>
              )}
            </CardDescription>
          </div>
          {children}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 rounded-lg border bg-background p-4">
          <h3 className="font-semibold text-foreground">Ficha Clínica del Paciente</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm md:grid-cols-4">
            <div>
              <span className="text-muted-foreground">Especie: </span>
              <span className="font-medium">{speciesLabel}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Raza: </span>
              <span className="font-medium">{patient.breed ?? "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Sexo: </span>
              <span className="font-medium">{sexLabel}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Edad: </span>
              <span className="font-medium">{patient.age ?? "—"}</span>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Microchip: </span>
              <span className="font-medium">{patient.microchip ?? "—"}</span>
            </div>
          </div>

          {(alertGroups.allergies.length > 0 || alertGroups.chronic.length > 0) && (
            <div className="space-y-3 rounded-md border border-destructive/50 bg-destructive/5 p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <h4 className="font-semibold text-destructive">Alertas médicas importantes</h4>
              </div>
              {alertGroups.allergies.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium text-foreground">Alergias:</span>
                  {alertGroups.allergies.map((allergy) => (
                    <Badge key={allergy} variant="destructive">
                      {allergy}
                    </Badge>
                  ))}
                </div>
              )}
              {alertGroups.chronic.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium text-foreground">Condiciones crónicas:</span>
                  {alertGroups.chronic.map((condition) => (
                    <Badge key={condition} variant="secondary" className="border border-amber-500/50">
                      {condition}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
