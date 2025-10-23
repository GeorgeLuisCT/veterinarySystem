"use client";

import * as React from "react";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { cn } from "@/lib/utils";
import { FieldVisitResponse } from "../../types/visit-response";
import VisitService from "../../services/visit-service";

export default function ObjectiveEditor({ visit, onSaved }: { visit: FieldVisitResponse | null; onSaved: (objective: string) => void; }) {
  const [text, setText] = React.useState<string>(visit?.objective ?? "");
  const [state, setState] = React.useState<"idle" | "saving" | "saved" | "error">("idle");
  const timer = React.useRef<number | null>(null);

  React.useEffect(() => {
    setText(visit?.objective ?? "");
    setState("idle");
  }, [visit?.id]);

  React.useEffect(() => {
    if (!visit) return;
    if (text === (visit.objective ?? "")) return;

    setState("saving");
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      try {
        await VisitService.update(visit.id, {
          farmId: visit.farmId ?? undefined,
          zoneId: visit.zoneId ?? undefined,
          fieldVetId: visit.fieldVetId ?? 0,
          vehicleId: visit.vehicleId ?? undefined,
          companionIds: visit.companions?.map((c) => c.employeeId) ?? [],
          scheduledDateTime: visit.scheduledDateTime,
          objective: text,
          status: visit.status,
          routeOrder: undefined,
        });
        onSaved(text);
        setState("saved");
      } catch {
        setState("error");
      }
    }, 800);

    return () => { if (timer.current) window.clearTimeout(timer.current); };
  }, [text, visit]);

  return (
    <div className="max-w-xl space-y-1">
      <FloatingLabelInput id="objectiveDraft" label="Objetivo de la visita" value={text} onChange={setText} />
      <p className={cn("text-xs", state === "saved" ? "text-emerald-600" : "text-muted-foreground")}> 
        {state === "saving" && "Guardando cambios…"}
        {state === "saved" && "Cambios guardados automáticamente."}
        {state === "error" && "No se pudo guardar automáticamente."}
      </p>
    </div>
  );
}