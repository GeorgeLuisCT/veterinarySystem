"use client";

import {
  Activity,
  FileText,
  HeartPulse,
  Info,
  Pill,
  Stethoscope,
  Thermometer,
  Weight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type {
  ClinicalHistoryConsultation,
  ClinicalHistoryProcedure,
  ClinicalHistoryMedication,
} from "../../types/medical-history-response";
import { ClinicalServiceCategoryLabels } from "../../enums/clinical-service-category";

const EMPTY_LABEL = "—";

const EmptyState = ({ icon: Icon, message }: { icon: React.ComponentType<{ className?: string }>; message: string }) => (
  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
    <Icon className="mx-auto h-12 w-12 text-muted-foreground" />
    <p className="mt-4 text-sm font-medium text-muted-foreground">{message}</p>
  </div>
);

function formatDateTime(value?: string) {
  if (!value) return EMPTY_LABEL;
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

function formatNumber(value?: number, unit?: string) {
  if (value === undefined || value === null) return EMPTY_LABEL;
  const formatted = value % 1 === 0 ? value.toFixed(0) : value.toFixed(1);
  return `${formatted}${unit ? ` ${unit}` : ""}`;
}

function renderVitals(vitals: ClinicalHistoryConsultation["vitals"]) {
  const items: Array<{ icon: React.ComponentType<{ className?: string }>; label: string }> = [
    { icon: Weight, label: formatNumber(vitals.weightKg, "kg") },
    { icon: Thermometer, label: formatNumber(vitals.temperatureCelsius, "°C") },
    { icon: HeartPulse, label: vitals.heartRate ? `${vitals.heartRate} lpm` : EMPTY_LABEL },
    { icon: Activity, label: vitals.respiratoryRate ? `${vitals.respiratoryRate} rpm` : EMPTY_LABEL },
  ];

  if (items.every((item) => item.label === EMPTY_LABEL)) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-3 rounded-md border p-3 text-sm sm:grid-cols-4">
      {items.map(({ icon: Icon, label }, index) => (
        <div key={index} className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

function MedicationList({ medications }: { medications: ClinicalHistoryMedication[] }) {
  if (medications.length === 0) return null;

  return (
    <div className="space-y-2 text-sm">
      <p className="font-medium text-foreground flex items-center gap-2">
        <Pill className="h-4 w-4 text-primary" />
        Medicación administrada
      </p>
      <div className="space-y-3">
        {medications.map((medication) => (
          <div key={medication.id} className="rounded-md border p-3">
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
              <span>{medication.productName ?? "Medicamento"}</span>
              {medication.doseAmount !== undefined && (
                <Badge variant="outline">
                  {medication.doseAmount}
                  {medication.doseUnit ? ` ${medication.doseUnit.toLowerCase()}` : ""}
                </Badge>
              )}
              {medication.route && <Badge variant="secondary">{medication.route}</Badge>}
            </div>
            <div className="mt-1 text-xs text-muted-foreground space-y-1">
              {medication.administeredAt && <div>Dosis aplicada: {formatDateTime(medication.administeredAt)}</div>}
              {medication.frequencyValue && medication.frequencyUnit && (
                <div>
                  Frecuencia: cada {medication.frequencyValue} {medication.frequencyUnit.toLowerCase()}
                </div>
              )}
              {medication.administeredBy && <div>Personal: {medication.administeredBy}</div>}
            </div>
            {medication.notes && <p className="mt-2 text-xs text-muted-foreground">{medication.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function ConsultationsTab({ consultations }: { consultations: ClinicalHistoryConsultation[] }) {
  if (!consultations.length) {
    return <EmptyState icon={FileText} message="No hay registros de consultas." />;
  }

  return (
    <div className="space-y-4">
      {consultations.map((consultation) => {
        const categoryLabel =
          consultation.serviceCategory && ClinicalServiceCategoryLabels[consultation.serviceCategory];

        return (
          <Card key={consultation.id} className="overflow-hidden">
            <CardHeader className="flex flex-row items-start justify-between bg-muted/50 p-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-foreground">{formatDateTime(consultation.visitDate)}</p>
                  {categoryLabel && <Badge variant="outline">{categoryLabel}</Badge>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {consultation.veterinarian ?? "Profesional no registrado"}
                  {consultation.branchName ? ` • ${consultation.branchName}` : ""}
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              {consultation.reasonForVisit && (
                <div className="flex items-start gap-3 rounded-md border p-3 text-sm">
                  <Info className="mt-1 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Motivo de la consulta</p>
                    <p className="text-muted-foreground">{consultation.reasonForVisit}</p>
                  </div>
                </div>
              )}

              {renderVitals(consultation.vitals)}

              <div className="space-y-3 text-sm">
                {consultation.diagnosis && (
                  <div>
                    <p className="font-medium text-foreground">Diagnóstico</p>
                    <p className="text-muted-foreground">{consultation.diagnosis}</p>
                  </div>
                )}
                {consultation.treatment && (
                  <div>
                    <p className="font-medium text-foreground">Plan terapéutico</p>
                    <p className="text-muted-foreground whitespace-pre-line">{consultation.treatment}</p>
                  </div>
                )}
                {consultation.notes && (
                  <div>
                    <p className="font-medium text-foreground">Notas</p>
                    <p className="text-muted-foreground whitespace-pre-line">{consultation.notes}</p>
                  </div>
                )}
              </div>

              <MedicationList medications={consultation.medications} />

              {consultation.additionalServices.length > 0 && (
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-foreground flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-primary" />
                    Servicios asociados
                  </p>
                  <div className="space-y-2">
                    {consultation.additionalServices.map((service) => (
                      <div key={service.id} className="rounded-md border p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-sm text-foreground">
                            {service.clinicalServiceName ?? "Servicio clínico"}
                          </span>
                          {service.category && (
                            <Badge variant="outline">
                              {ClinicalServiceCategoryLabels[service.category]}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-y-1 text-xs text-muted-foreground sm:grid-cols-3">
                          {service.quantity !== undefined && (
                            <span>Cant.: {formatNumber(service.quantity)}</span>
                          )}
                          {service.subtotal !== undefined && (
                            <span>Subtotal: S/ {service.subtotal.toFixed(2)}</span>
                          )}
                        </div>
                        {service.notes && <p className="mt-2 text-xs text-muted-foreground">{service.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function ProceduresTab({ procedures }: { procedures: ClinicalHistoryProcedure[] }) {
  if (!procedures.length) {
    return <EmptyState icon={Stethoscope} message="No hay registros de procedimientos." />;
  }

  const labels: Record<ClinicalHistoryProcedure["type"], string> = {
    SURGERY: "Procedimiento quirúrgico",
    HOSPITALIZATION: "Hospitalización",
  };

  return (
    <div className="space-y-4">
      {procedures.map((procedure) => (
        <Card key={procedure.id} className="p-4">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge>{labels[procedure.type]}</Badge>
            <p className="font-semibold text-foreground">{procedure.title}</p>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              Inicio: {formatDateTime(procedure.startedAt)} • Fin: {formatDateTime(procedure.endedAt)}
            </p>
            {procedure.professionalInCharge && <p>Responsable: {procedure.professionalInCharge}</p>}
            {procedure.status && <p>Estado: {procedure.status}</p>}
          </div>
          {procedure.notes && (
            <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line">{procedure.notes}</p>
          )}
        </Card>
      ))}
    </div>
  );
}

export default function ClinicalHistoryTabs({
  consultations,
  procedures,
}: {
  consultations: ClinicalHistoryConsultation[];
  procedures: ClinicalHistoryProcedure[];
}) {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-lg">Historial clínico y tratamientos</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="consultations">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="consultations">
              <FileText className="mr-2 h-4 w-4" />
              Consultas
            </TabsTrigger>
            <TabsTrigger value="procedures">
              <Stethoscope className="mr-2 h-4 w-4" />
              Procedimientos
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
