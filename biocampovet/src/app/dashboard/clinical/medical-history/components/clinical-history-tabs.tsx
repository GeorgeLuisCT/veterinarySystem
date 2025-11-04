"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Activity, FileText, HeartPulse, Info, Stethoscope, Thermometer, Weight } from "lucide-react";

const EmptyState = ({ icon: Icon, message }: { icon: any; message: string }) => (
  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
    <Icon className="mx-auto h-12 w-12 text-muted-foreground" />
    <p className="mt-4 text-sm font-medium text-muted-foreground">{message}</p>
  </div>
);

function ConsultationsTab({ consultations }: { consultations: any[] }) {
  return (
    <div className="space-y-4">
      {consultations?.length > 0 ? (
        consultations.map((consultation, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="flex flex-row items-start justify-between bg-muted/50 p-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-foreground">{consultation.date}</p>
                  <Badge variant="outline">{consultation.type}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{consultation.vet}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex items-start gap-3 rounded-md border p-3 text-sm">
                <Info className="mt-1 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Motivo de la consulta:</p>
                  <p className="text-muted-foreground">{consultation.reasonForVisit}</p>
                </div>
              </div>

              {consultation.vitals && (
                <div className="grid grid-cols-2 gap-3 rounded-md border p-3 text-sm sm:grid-cols-4">
                  <div className="flex items-center gap-2">
                    <Weight className="h-4 w-4 text-primary" /> <span>{consultation.vitals.weight}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-primary" /> <span>{consultation.vitals.temp}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HeartPulse className="h-4 w-4 text-primary" /> <span>{consultation.vitals.hr}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" /> <span>{consultation.vitals.rr}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2 text-sm">
                <div>
                  <p className="font-medium text-foreground">Diagnóstico:</p>
                  <p className="text-muted-foreground">{consultation.diagnosis}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Tratamiento:</p>
                  <p className="text-muted-foreground">{consultation.treatment}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Notas:</p>
                  <p className="text-muted-foreground">{consultation.notes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <EmptyState icon={FileText} message="No hay registros de consultas." />
      )}
    </div>
  );
}

function ProceduresTab({ procedures }: { procedures: any[] }) {
  return (
    <div className="space-y-4">
      {procedures?.length > 0 ? (
        procedures.map((item, index) => (
          <Card key={index} className="p-4">
            <div className="mb-2">
              <p className="font-semibold text-foreground">{item.procedure}</p>
              <p className="text-sm text-muted-foreground">Fecha: {item.date} • Veterinario: {item.vet}</p>
            </div>
            <div className="text-sm">
              <p className="font-medium text-foreground">Notas:</p>
              <p className="text-muted-foreground">{item.notes}</p>
            </div>
          </Card>
        ))
      ) : (
        <EmptyState icon={Stethoscope} message="No hay registros de procedimientos." />
      )}
    </div>
  );
}

export default function ClinicalHistoryTabs({
  consultations,
  procedures,
}: {
  consultations: any[];
  procedures: any[];
}) {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-lg">Historial Clínico y Tratamientos</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="consultations">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="consultations">
              <FileText className="mr-2 h-4 w-4" />Consultas
            </TabsTrigger>
            <TabsTrigger value="procedures">
              <Stethoscope className="mr-2 h-4 w-4" />Procedimientos
            </TabsTrigger>
          </TabsList>
          <TabsContent value="consultations" className="mt-4">
            <ConsultationsTab consultations={consultations} />
          </TabsContent>
          <TabsContent value="procedures" className="mt-4">
            <ProceduresTab procedures={procedures} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}