"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Activity, Download, LineChart } from "lucide-react";

const EmptyState = ({ icon: Icon, message }: { icon: any; message: string }) => (
  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
    <Icon className="mx-auto h-12 w-12 text-muted-foreground" />
    <p className="mt-4 text-sm font-medium text-muted-foreground">{message}</p>
  </div>
);

function LabsTab({ labResults }: { labResults: any[] }) {
  return (
    <div className="space-y-3">
      {labResults?.length > 0 ? (
        labResults.map((lab, index) => (
          <Card key={index} className="flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center">
            <div>
              <p className="font-semibold text-foreground">{lab.test}</p>
              <p className="text-sm text-muted-foreground">
                Fecha: {lab.date} • Resultado: <span className="font-medium text-foreground">{lab.result}</span>
              </p>
            </div>
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" /> {lab.file}
            </Button>
          </Card>
        ))
      ) : (
        <EmptyState icon={Activity} message="No hay resultados de laboratorio." />
      )}
    </div>
  );
}

function WeightHistoryTab({ weightHistory }: { weightHistory: any[] }) {
  return (
    <div>
      {weightHistory?.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <LineChart className="h-5 w-5" /> Evolución del Peso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {weightHistory
                .slice()
                .reverse()
                .map((entry: any, index: number) => (
                  <li key={index} className="flex items-center justify-between py-3">
                    <p className="text-sm text-muted-foreground">{entry.date}</p>
                    <p className="font-semibold text-foreground">{entry.weightKg} kg</p>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <EmptyState icon={LineChart} message="No hay historial de peso registrado." />
      )}
    </div>
  );
}

export default function DiagnosticsAndFollowUpTabs({
  labResults,
  weightHistory,
}: {
  labResults: any[];
  weightHistory: any[];
}) {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="text-lg">Diagnóstico y Seguimiento</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="labs">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="labs">Laboratorio</TabsTrigger>
            <TabsTrigger value="weight">Evolución de Peso</TabsTrigger>
          </TabsList>
          <TabsContent value="labs" className="mt-4 space-y-4">
            <LabsTab labResults={labResults} />
          </TabsContent>
          <TabsContent value="weight" className="mt-4">
            <WeightHistoryTab weightHistory={weightHistory} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
