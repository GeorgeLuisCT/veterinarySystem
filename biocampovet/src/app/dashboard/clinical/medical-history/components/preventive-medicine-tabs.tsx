"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Bug, MonitorCog, Scissors, ShieldCheck, Syringe } from "lucide-react";

const EmptyState = ({ icon: Icon, message }: { icon: any; message: string }) => (
  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
    <Icon className="mx-auto h-12 w-12 text-muted-foreground" />
    <p className="mt-4 text-sm font-medium text-muted-foreground">{message}</p>
  </div>
);

function VaccinesTab({ vaccines }: { vaccines: any[] }) {
  return (
    <div className="space-y-3">
      {vaccines?.length > 0 ? (
        vaccines.map((vaccine, index) => (
          <Card key={index} className="flex items-center justify-between p-4">
            <div>
              <p className="font-semibold text-foreground">{vaccine.name}</p>
              <p className="text-sm text-muted-foreground">
                Aplicada: {vaccine.date} • Próxima: {vaccine.nextDue}
              </p>
            </div>
            <Badge
              variant={vaccine.status === "Vigente" ? "default" : "secondary"}
              className={vaccine.status === "Vigente" ? "bg-green-600 text-white" : ""}
            >
              {vaccine.status}
            </Badge>
          </Card>
        ))
      ) : (
        <EmptyState icon={Syringe} message="No hay registros de vacunas." />
      )}
    </div>
  );
}

function DewormingTab({ deworming }: { deworming: any[] }) {
  return (
    <div className="space-y-3">
      {deworming?.length > 0 ? (
        deworming.map((item, index) => (
          <Card key={index} className="flex items-center justify-between p-4">
            <div>
              <p className="font-semibold text-foreground">
                {item.product} <Badge variant="outline">{item.type}</Badge>
              </p>
              <p className="text-sm text-muted-foreground">
                Aplicada: {item.date} • Próxima: {item.nextDue}
              </p>
            </div>
          </Card>
        ))
      ) : (
        <EmptyState icon={Bug} message="No hay registros de desparasitación." />
      )}
    </div>
  );
}

function GroomingTab({ groomingHistory }: { groomingHistory: any[] }) {
  return (
    <div className="space-y-4">
      {groomingHistory?.length > 0 ? (
        groomingHistory.map((item, index) => (
          <Card key={index} className="p-4">
            <div className="mb-2">
              <p className="font-semibold text-foreground">{item.service || item.procedure}</p>
              <p className="text-sm text-muted-foreground">
                Fecha: {item.date} • {item.vet ? `Veterinario: ${item.vet}` : item.groomer ? `Estilista: ${item.groomer}` : null}
              </p>
            </div>
            <div className="text-sm">
              <p className="font-medium text-foreground">Notas:</p>
              <p className="text-muted-foreground">{item.notes}</p>
            </div>
          </Card>
        ))
      ) : (
        <EmptyState icon={Scissors} message="No hay historial de peluquería registrado." />
      )}
    </div>
  );
}

export default function PreventiveMedicineTabs({
  vaccines,
  deworming,
  groomingHistory,
}: {
  vaccines: any[];
  deworming: any[];
  groomingHistory: any[];
}) {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-lg">Medicina Preventiva</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="vaccinesAndDeworming">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="vaccinesAndDeworming">
              <ShieldCheck className="mr-2 h-4 w-4" />Vacunas y Desp.
            </TabsTrigger>
            <TabsTrigger value="grooming">
              <MonitorCog className="mr-2 h-4 w-4" />Baño y Peluquería
            </TabsTrigger>
          </TabsList>
          <TabsContent value="vaccinesAndDeworming" className="mt-4 space-y-4">
            <h4 className="font-semibold">Vacunas</h4>
            <VaccinesTab vaccines={vaccines} />
            <h4 className="mt-4 font-semibold">Desparasitación</h4>
            <DewormingTab deworming={deworming} />
          </TabsContent>
          <TabsContent value="grooming" className="mt-4">
            <GroomingTab groomingHistory={groomingHistory} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}