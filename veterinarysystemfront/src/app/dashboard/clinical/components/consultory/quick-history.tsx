"use client";

import React from "react";
import { Loader2, AlertCircle } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";

import MedicalRecordService from "@/app/dashboard/clinical/service/medical-record-service";
import { MedicalRecordSummaryResponse } from "@/app/dashboard/clinical/types/medical-record-response";
import { MedicalRecordCategory, MedicalRecordCategoryLabels } from "@/app/dashboard/clinical/enums/medical-record-category";

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return iso;
  }
}

export default function QuickHistory({ animalId, className }: { animalId: number, className?: string }) {
  const [items, setItems] = React.useState<MedicalRecordSummaryResponse[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await MedicalRecordService.summaryByAnimal(animalId);
        if (alive) setItems(data);
      } catch (e: unknown) {
        const msg = getAaxiosErrorMessage(e);
        if (alive) setError(msg);
        toast({ variant: "destructive", title: "Error", description: msg });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [animalId, toast]);

  return (
    <aside className={className}>
      <div className="sticky top-24">
        <h3 className="font-semibold mb-3 text-gray-700">Historial Rápido</h3>

        {loading && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando historial…
            </div>
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        )}

        {error && !loading && (
          <div className="flex items-start gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-4 border-l-2 pl-4 border-slate-200">
            {items.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin eventos aún.</p>
            )}
            {items.map((event, index) => (
              <div key={`${event.occurredAt}-${index}`} className="relative">
                <div className="absolute -left-[22.5px] top-1 h-3 w-3 rounded-full bg-blue-500 border-2 border-white" />
                <p className="text-xs text-gray-500">{formatDate(event.occurredAt)}</p>
                <p className="font-semibold text-sm">{MedicalRecordCategoryLabels[event.category as MedicalRecordCategory] ?? event.category}</p>
                <p className="text-sm text-gray-600">{event.title}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
