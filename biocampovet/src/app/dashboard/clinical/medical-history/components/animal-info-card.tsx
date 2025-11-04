"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

interface Props {
  patient: any; // TIP: replace with a typed interface
  children?: ReactNode; // for actions (e.g., Export PDF)
}

export default function AnimalInfoCard({ patient, children }: Props) {
  const showAllergy = patient.allergies?.length > 0 && patient.allergies[0] !== "Ninguna conocida";
  const showChronic = patient.chronicConditions?.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
          <div>
            <CardTitle className="text-2xl">{patient.patientName}</CardTitle>
            <CardDescription>
              Propietario: {patient.owner} • Última visita: {patient.lastVisit}
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
              <span className="font-medium">{patient.species}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Raza: </span>
              <span className="font-medium">{patient.breed}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Sexo: </span>
              <span className="font-medium">{patient.sex}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Edad: </span>
              <span className="font-medium">{patient.age}</span>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Microchip: </span>
              <span className="font-medium">{patient.microchip}</span>
            </div>
          </div>

          {(showAllergy || showChronic) && (
            <div className="space-y-3 rounded-md border border-destructive/50 bg-destructive/5 p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <h4 className="font-semibold text-destructive">Alertas Médicas Importantes</h4>
              </div>
              {showAllergy && (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium text-foreground">Alergias:</span>
                  {patient.allergies.map((a: string) => (
                    <Badge key={a} variant="destructive">
                      {a}
                    </Badge>
                  ))}
                </div>
              )}
              {showChronic && (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium text-foreground">Condiciones Crónicas:</span>
                  {patient.chronicConditions.map((c: string) => (
                    <Badge key={c} variant="secondary" className="border border-amber-500/50">
                      {c}
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
