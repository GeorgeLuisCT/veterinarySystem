"use client";

import { Bug, MonitorCog, Scissors, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type {
  ClinicalHistoryGroomingEntry,
  ClinicalHistoryPreventiveCare,
  ClinicalHistoryPreventiveEvent,
} from "../../types/medical-history-response";
import { ClinicalServiceCategory, ClinicalServiceCategoryLabels } from "../../enums/clinical-service-category";

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

function PreventiveList({ items }: { items: ClinicalHistoryPreventiveEvent[] }) {
  if (!items.length) {
    return <EmptyState icon={ShieldCheck} message="No hay registros de medicina preventiva." />;
  }
  return (
    <div className="space-y-3">
      {items.map((event) => {
        const categoryLabel = ClinicalServiceCategoryLabels[event.category];
        return (
          <Card key={`${event.serviceItemId}-${event.performedAt ?? "pending"}`} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-foreground">{event.serviceName}</p>
                <Badge variant="outline">{categoryLabel}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Aplicada: {formatDate(event.performedAt)} • Próxima: {formatDate(event.nextDueDate)}
              </p>
              {event.veterinarian && (
                <p className="text-xs text-muted-foreground mt-1">Responsable: {event.veterinarian}</p>
              )}
              {event.notes && <p className="text-xs text-muted-foreground mt-1">{event.notes}</p>}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function DewormingList({ items }: { items: ClinicalHistoryPreventiveEvent[] }) {
  if (!items.length) {
    return <EmptyState icon={Bug} message="No hay registros de desparasitación." />;
  }
  return (
    <div className="space-y-3">
      {items.map((event) => (
        <Card key={`${event.serviceItemId}-${event.performedAt ?? "pending"}`} className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-foreground">{event.serviceName}</p>
            <Badge variant="outline">{ClinicalServiceCategoryLabels[event.category]}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Aplicada: {formatDate(event.performedAt)} • Próxima: {formatDate(event.nextDueDate)}
          </p>
          {event.notes && <p className="text-xs text-muted-foreground mt-1">{event.notes}</p>}
        </Card>
      ))}
    </div>
  );
}

function GroomingList({ entries }: { entries: ClinicalHistoryGroomingEntry[] }) {
  if (!entries.length) {
    return <EmptyState icon={Scissors} message="No hay historial de peluquería registrado." />;
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <Card key={entry.id} className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-foreground">{entry.serviceName}</p>
            <Badge variant="outline">{entry.status}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Inicio: {formatDate(entry.startedAt)} • Fin: {formatDate(entry.finishedAt)}
          </p>
          {entry.assignedProfessional && (
            <p className="mt-1 text-sm text-muted-foreground">Profesional: {entry.assignedProfessional}</p>
          )}
          {entry.behaviorNotes && (
            <p className="mt-2 text-xs text-muted-foreground">Comportamiento: {entry.behaviorNotes}</p>
          )}
          {entry.clinicalObservations && (
            <p className="mt-2 text-xs text-muted-foreground">Observaciones: {entry.clinicalObservations}</p>
          )}
        </Card>
      ))}
    </div>
  );
}

export default function PreventiveMedicineTabs({ preventiveCare }: { preventiveCare: ClinicalHistoryPreventiveCare }) {
  const vaccines = preventiveCare.vaccines.filter((item) => item.category === ClinicalServiceCategory.VACCINATION);
  const deworming = preventiveCare.deworming.filter((item) => item.category === ClinicalServiceCategory.DEWORMING);

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-lg">Medicina preventiva</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="vaccinesAndDeworming">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="vaccinesAndDeworming">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Vacunas y Desparasitación
            </TabsTrigger>
            <TabsTrigger value="grooming">
              <MonitorCog className="mr-2 h-4 w-4" />
              Baño y Peluquería
            </TabsTrigger>
          </TabsList>
          <TabsContent value="vaccinesAndDeworming" className="mt-4 space-y-6">
            <div>
              <h4 className="font-semibold mb-2">Vacunas</h4>
              <PreventiveList items={vaccines} />
            </div>
            <div>
              <h4 className="font-semibold mb-2">Desparasitación</h4>
              <DewormingList items={deworming} />
            </div>
          </TabsContent>
          <TabsContent value="grooming" className="mt-4">
            <GroomingList entries={preventiveCare.groomingSessions} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
