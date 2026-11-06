"use client";

import { Activity, Download, LineChart, Microscope } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type {
  ClinicalHistoryLabResult,
  ClinicalHistoryWeightEntry,
} from "../../types/medical-history-response";
import { LabRequestStatusLabels } from "../../enums/lab-request-status";
import { PageSection } from "@/components/page/page-section";

const EmptyState = ({ icon: Icon, message }: { icon: React.ComponentType<{ className?: string }>; message: string }) => (
  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
    <Icon className="mx-auto h-12 w-12 text-muted-foreground" />
    <p className="mt-4 text-sm font-medium text-muted-foreground">{message}</p>
  </div>
);

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function LabsTab({ labResults }: { labResults: ClinicalHistoryLabResult[] }) {
  if (!labResults.length) {
    return <EmptyState icon={Activity} message="No hay resultados de laboratorio." />;
  }

  return (
    <div className="space-y-4">
      {labResults.map((result) => (
        <Card key={`${result.requestId}-${result.testName ?? "test"}`} className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-foreground">{result.testName ?? "Prueba de laboratorio"}</p>
                <Badge variant="outline">{LabRequestStatusLabels[result.status]}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Solicitada: {formatDateTime(result.requestedAt)} • Reportada: {formatDateTime(result.reportedAt)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Laboratorio: {result.laboratoryName ?? "No especificado"}
                {result.requestingVeterinarian ? ` • Veterinario: ${result.requestingVeterinarian}` : ""}
              </p>
              {result.clinicalNotes && (
                <p className="text-xs text-muted-foreground mt-2 whitespace-pre-line">{result.clinicalNotes}</p>
              )}
            </div>
            <Button variant="outline" size="sm" className="w-full sm:w-auto" disabled>
              <Download className="mr-2 h-4 w-4" />
              Descargar informe
            </Button>
          </div>

          {result.parameters.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Parámetro</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Valor</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Rango de referencia</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Flag</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Comentario</th>
                  </tr>
                </thead>
                <tbody>
                  {result.parameters.map((parameter, index) => (
                    <tr key={`${result.requestId}-${parameter.name ?? index}`} className="border-b last:border-b-0">
                      <td className="px-3 py-2 font-medium text-foreground">{parameter.name ?? "—"}</td>
                      <td className="px-3 py-2">
                        {parameter.value ?? "—"}
                        {parameter.unit ? ` ${parameter.unit}` : ""}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{parameter.referenceRange ?? "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{parameter.flag ?? "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground whitespace-pre-line">
                        {parameter.comment ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function WeightHistoryTab({ weightHistory }: { weightHistory: ClinicalHistoryWeightEntry[] }) {
  if (!weightHistory.length) {
    return <EmptyState icon={LineChart} message="No hay historial de peso registrado." />;
  }

  return (
    <PageSection title={<span className="inline-flex items-center gap-2"><LineChart className="h-5 w-5" /> Evolución del peso</span>}>
<div>
        <ul className="divide-y">
          {weightHistory
            .slice()
            .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
            .map((entry) => (
              <li key={`${entry.recordedAt}-${entry.sourceClinicalAttentionId}`} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm text-muted-foreground">{formatDate(entry.recordedAt)}</p>
                  <p className="text-xs text-muted-foreground">
                    Consulta #{entry.sourceClinicalAttentionId}
                  </p>
                </div>
                <p className="font-semibold text-foreground">{entry.weightKg.toFixed(2)} kg</p>
              </li>
            ))}
        </ul>
      </div>
</PageSection>
  );
}

export default function DiagnosticsAndFollowUpTabs({
  labResults,
  weightHistory,
}: {
  labResults: ClinicalHistoryLabResult[];
  weightHistory: ClinicalHistoryWeightEntry[];
}) {
  return (
    <PageSection title={<span className="inline-flex items-center gap-2"><Microscope className="h-5 w-5" /> Diagnóstico y seguimiento</span>}>
<div>
        <Tabs defaultValue="labs">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="labs">Laboratorio</TabsTrigger>
            <TabsTrigger value="weight">Evolución de peso</TabsTrigger>
          </TabsList>
          <TabsContent value="labs" className="mt-4 space-y-4">
            <LabsTab labResults={labResults} />
          </TabsContent>
          <TabsContent value="weight" className="mt-4">
            <WeightHistoryTab weightHistory={weightHistory} />
          </TabsContent>
        </Tabs>
      </div>
</PageSection>
  );
}
