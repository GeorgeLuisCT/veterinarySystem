"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";
import VisitService from "../../services/visit-service";
import type { FieldVisitResponse } from "../../types/visit-response";
import ObjectiveEditor from "../../components/visits/objective-editor";
import ServiceItemDialog from "../../components/visits/service-item-dialog";
import ProductUsageDialog from "../../components/visits/product-usage-dialog";
import AttachmentDialog from "../../components/visits/attachment-dialog";
import BiosecurityDialog from "../../components/visits/biosecurity-dialog";
import ServicesCard from "../../components/visits/services-card";
import UsagesCard from "../../components/visits/usages-card";
import AttachmentsCard from "../../components/visits/attachments-card";

export default function FieldVisitPage() {
  const params = useParams();
  const visitIdRaw = (params?.visitId as string) ?? "";
  const id = Number(visitIdRaw);
  const { toast } = useToast();

  const [data, setData] = React.useState<FieldVisitResponse | null>(null);
  const [loading, setLoading] = React.useState(false);

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
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-xl font-bold">Visita #{id}</h1>
          <p className="text-sm text-muted-foreground">
            {(data?.farmName ?? data?.zoneName ?? "Sin destino")} – {data && new Date(data.scheduledDateTime).toLocaleString()}
          </p>
          {!!(data?.companions?.length) && (
            <p className="mt-1 text-xs text-muted-foreground">Acompañantes: {data!.companions!.map((c) => c.employeeName).join(", ")}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setModal("service")}>Añadir Servicio</Button>
          <Button variant="outline" onClick={() => setModal("usage")}>Añadir Insumo</Button>
          <Button variant="outline" onClick={() => setModal("attachment")}>Adjuntar archivo</Button>
          <Button variant="outline" onClick={() => setModal("bio")}>Bioseguridad</Button>
        </div>
      </header>

      <ObjectiveEditor
        visit={data}
        onSaved={(objective) => setData((prev) => (prev ? { ...prev, objective } : prev))}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ServicesCard visit={data} loading={loading} />
        <UsagesCard visit={data} loading={loading} />
      </div>

      <AttachmentsCard visit={data} loading={loading} />

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