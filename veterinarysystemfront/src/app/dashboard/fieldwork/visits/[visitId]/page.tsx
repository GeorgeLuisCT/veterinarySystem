"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";
import VisitService from "../../services/visit-service";
import type { FieldVisitResponse } from "../../types/visit-response";
import ServiceItemDialog from "../../components/visits/service-item-dialog";
import ProductUsageDialog from "../../components/visits/product-usage-dialog";
import AttachmentDialog from "../../components/visits/attachment-dialog";
import BiosecurityDialog from "../../components/visits/biosecurity-dialog";
import ServicesCard from "../../components/visits/services-card";
import UsagesCard from "../../components/visits/usages-card";
import AttachmentsCard from "../../components/visits/attachments-card";
import { ReportEditor } from "../../components/visits/report-editor";
import { FieldVisitStatus, FieldVisitStatusLabels } from "../../enums/field-visit-status";

export default function FieldVisitPage() {
  const params = useParams();
  const visitIdRaw = (params?.visitId as string) ?? "";
  const id = Number(visitIdRaw);
  const { toast } = useToast();

  const [data, setData] = React.useState<FieldVisitResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [finalizing, setFinalizing] = React.useState(false);

  const [modal, setModal] = React.useState<"service" | "usage" | "attachment" | "bio" | null>(null);

  const fetchData = React.useCallback(async () => {
    if (!Number.isFinite(id)) return;
    setLoading(true);
    try {
      const resp = await VisitService.get(id);
      setData(resp);
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: getAaxiosErrorMessage(e) });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  if (!Number.isFinite(id)) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Identificador de visita inválido.</div>
    );
  }

  return (
    <div className="space-y-5 p-4">
      <header className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div className="space-y-1">
          <h1 className="text-xl font-bold">Visita #{id}</h1>
          <p className="text-sm text-muted-foreground">
            {(data?.farmName ?? data?.zoneName ?? "Sin destino")} – {data && new Date(data.scheduledDateTime).toLocaleString()}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              {FieldVisitStatusLabels[data?.status ?? FieldVisitStatus.PLANNED]}
            </Badge>
            {!!(data?.companions?.length) && (
              <span className="hidden text-xs text-muted-foreground lg:inline">
                Acompañantes: {data!.companions!.map((c) => c.employeeName).join(", ")}
              </span>
            )}
          </div>
          {!!(data?.companions?.length) && (
            <p className="text-xs text-muted-foreground lg:hidden">
              Acompañantes: {data!.companions!.map((c) => c.employeeName).join(", ")}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setModal("service")}>Añadir Servicio</Button>
          <Button variant="outline" onClick={() => setModal("usage")}>Añadir Insumo</Button>
          <Button variant="outline" onClick={() => setModal("attachment")}>Adjuntar archivo</Button>
          <Button variant="outline" onClick={() => setModal("bio")}>Bioseguridad</Button>
          {data?.status !== FieldVisitStatus.COMPLETED && (
            <Button
              variant="secondary"
              onClick={async () => {
                setFinalizing(true);
                try {
                  const updated = await VisitService.updateStatus(id, { status: FieldVisitStatus.COMPLETED });
                  setData(updated);
                  toast({ title: "Visita finalizada", description: "El estado se actualizó a Completada." });
                } catch (error) {
                  toast({ variant: "destructive", title: "Error al finalizar", description: getAaxiosErrorMessage(error) });
                } finally {
                  setFinalizing(false);
                }
              }}
              disabled={finalizing}
            >
              {finalizing ? "Finalizando…" : "Finalizar"}
            </Button>
          )}
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[2fr,3fr] lg:items-start">
        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/10 p-4">
            <h2 className="text-sm font-semibold text-muted-foreground">Objetivo planificado</h2>
            <p className="text-sm text-foreground mt-2 whitespace-pre-wrap">
              {data?.objective?.trim() ? data.objective : "Sin objetivo registrado."}
            </p>
          </div>
          <div className="rounded-lg border p-4 space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground">Reporte de visita</h2>
            <ReportEditor
              visitId={id}
              report={data?.report ?? null}
              onReportUpdated={(report) => setData((prev) => (prev ? { ...prev, report } : prev))}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-1">
            <ServicesCard visit={data} loading={loading} />
            <UsagesCard visit={data} loading={loading} />
          </div>
          <AttachmentsCard visit={data} loading={loading} />
        </div>
      </div>

      <ServiceItemDialog
        open={modal === "service"}
        visitId={id}
        onOpenChange={(o) => !o && setModal(null)}
        onSuccess={() => { setModal(null); fetchData(); }}
      />
      <ProductUsageDialog
        open={modal === "usage"}
        visitId={id}
        onOpenChange={(o) => !o && setModal(null)}
        onSuccess={() => { setModal(null); fetchData(); }}
      />
      <AttachmentDialog
        open={modal === "attachment"}
        visitId={id}
        onOpenChange={(o) => !o && setModal(null)}
        onSuccess={() => { setModal(null); fetchData(); }}
      />
      <BiosecurityDialog
        open={modal === "bio"}
        visitId={id}
        onOpenChange={(o) => !o && setModal(null)}
        onSuccess={() => { setModal(null); fetchData(); }}
      />
    </div>
  );
}
