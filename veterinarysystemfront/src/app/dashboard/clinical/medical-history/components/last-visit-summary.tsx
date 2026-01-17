"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";
import type { ClinicalHistoryConsultation } from "../../types/medical-history-response";
import { ClinicalServiceCategoryLabels } from "../../enums/clinical-service-category";

function formatDateTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

interface Props {
  consultation: ClinicalHistoryConsultation;
}

export default function LastVisitSummary({ consultation }: Props) {
  const categoryLabel =
    consultation.serviceCategory && ClinicalServiceCategoryLabels[consultation.serviceCategory];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Resumen de la última visita ({formatDateTime(consultation.visitDate)})
        </CardTitle>
        <CardDescription className="flex flex-wrap gap-x-2">
          <span>Atendido por: {consultation.veterinarian ?? "—"}</span>
          {categoryLabel && <span>• {categoryLabel}</span>}
          {consultation.branchName && <span>• {consultation.branchName}</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {consultation.reasonForVisit && (
          <div className="flex items-start gap-3">
            <Info className="mt-1 h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <div>
              <p className="font-medium">Motivo de la consulta:</p>
              <p className="text-muted-foreground">{consultation.reasonForVisit}</p>
            </div>
          </div>
        )}
        {consultation.diagnosis && (
          <div>
            <p className="font-medium">Diagnóstico:</p>
            <p className="text-muted-foreground">{consultation.diagnosis}</p>
          </div>
        )}
        {consultation.treatment && (
          <div>
            <p className="font-medium">Plan terapéutico:</p>
            <p className="text-muted-foreground">{consultation.treatment}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
