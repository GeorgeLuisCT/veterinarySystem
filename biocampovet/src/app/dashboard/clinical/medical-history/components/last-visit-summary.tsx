"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

export default function LastVisitSummary({ consultation }: { consultation: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Resumen de la Última Visita ({consultation.date})</CardTitle>
        <CardDescription>Atendido por: {consultation.vet}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-start gap-3">
          <Info className="mt-1 h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <div>
            <p className="font-medium">Motivo de la consulta:</p>
            <p className="text-muted-foreground">{consultation.reasonForVisit}</p>
          </div>
        </div>
        <div>
          <p className="font-medium">Diagnóstico:</p>
          <p className="text-muted-foreground">{consultation.diagnosis}</p>
        </div>
        <div>
          <p className="font-medium">Tratamiento Aplicado:</p>
          <p className="text-muted-foreground">{consultation.treatment}</p>
        </div>
      </CardContent>
    </Card>
  );
}