"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { FieldVisitReportResponse } from "../../types/visit-response";
import VisitService from "../../services/visit-service";
import { UpdateFieldVisitReportRequest } from "../../types/visit-request";
import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";
import { cn } from "@/lib/utils";

type FieldKey = "findings" | "diagnoses" | "recommendations";

const FIELD_LABELS: Record<FieldKey, string> = {
  findings: "Hallazgos",
  diagnoses: "Diagnóstico",
  recommendations: "Recomendaciones",
};

type Props = {
  visitId: number;
  report: FieldVisitReportResponse | null;
  onReportUpdated: (report: FieldVisitReportResponse) => void;
};

export function ReportEditor({ visitId, report, onReportUpdated }: Props) {
  const { toast } = useToast();
  const [values, setValues] = React.useState<Record<FieldKey, string>>({
    findings: "",
    diagnoses: "",
    recommendations: "",
  });
  const [status, setStatus] = React.useState<Record<FieldKey, "idle" | "saving" | "saved" | "error">>({
    findings: "idle",
    diagnoses: "idle",
    recommendations: "idle",
  });
  const debouncers = React.useRef<Record<FieldKey, number>>({
    findings: 0,
    diagnoses: 0,
    recommendations: 0,
  });
  const versionRef = React.useRef<number>(report?.version ?? 0);

  React.useEffect(() => {
    setValues({
      findings: report?.findings ?? "",
      diagnoses: report?.diagnoses ?? "",
      recommendations: report?.recommendations ?? "",
    });
    versionRef.current = report?.version ?? 0;
    setStatus({
      findings: "idle",
      diagnoses: "idle",
      recommendations: "idle",
    });
  }, [report?.id, report?.version]);

  React.useEffect(
    () => () => {
      (Object.keys(debouncers.current) as FieldKey[]).forEach((key) => {
        if (debouncers.current[key]) {
          window.clearTimeout(debouncers.current[key]);
        }
      });
    },
    []
  );

  const triggerSave = React.useCallback(
    (field: FieldKey, nextValue: string) => {
      if (debouncers.current[field]) {
        window.clearTimeout(debouncers.current[field]);
      }

      setStatus((prev) => ({ ...prev, [field]: "saving" }));

      debouncers.current[field] = window.setTimeout(async () => {
        const payload: UpdateFieldVisitReportRequest = {
          version: versionRef.current,
          findings: field === "findings" ? (nextValue === "" ? null : nextValue) : undefined,
          diagnoses: field === "diagnoses" ? (nextValue === "" ? null : nextValue) : undefined,
          recommendations: field === "recommendations" ? (nextValue === "" ? null : nextValue) : undefined,
        };

        try {
          const updated = await VisitService.updateReport(visitId, payload);
          versionRef.current = updated.version;
          setStatus((prev) => ({ ...prev, [field]: "saved" }));
          onReportUpdated(updated);
        } catch (error) {
          setStatus((prev) => ({ ...prev, [field]: "error" }));
          toast({
            variant: "destructive",
            title: "No se pudo guardar",
            description: getAaxiosErrorMessage(error) ?? "Intenta nuevamente.",
          });
        }
      }, 800);
    },
    [toast, visitId, onReportUpdated]
  );

  const handleChange = React.useCallback(
    (field: FieldKey, value: string) => {
      setValues((prev) => ({ ...prev, [field]: value }));
      triggerSave(field, value);
    },
    [triggerSave]
  );

  const renderStatus = (field: FieldKey) => {
    switch (status[field]) {
      case "saving":
        return "Guardando…";
      case "saved":
        return "Guardado.";
      case "error":
        return "Error al guardar.";
      default:
        return "Autoguardado habilitado.";
    }
  };

  return (
    <div className="space-y-4">
      {(Object.keys(FIELD_LABELS) as FieldKey[]).map((field) => (
        <div key={field} className="space-y-2">
          <label htmlFor={`report-${field}`} className="text-sm font-medium text-muted-foreground">
            {FIELD_LABELS[field]}
          </label>
          <Textarea
            id={`report-${field}`}
            value={values[field]}
            onChange={(event) => handleChange(field, event.target.value)}
            rows={field === "recommendations" ? 4 : 6}
            placeholder={`Escribe ${FIELD_LABELS[field].toLowerCase()}...`}
          />
          <p
            className={cn(
              "text-xs",
              status[field] === "error"
                ? "text-destructive"
                : status[field] === "saved"
                ? "text-success-strong"
                : "text-muted-foreground"
            )}
          >
            {renderStatus(field)}
          </p>
        </div>
      ))}
    </div>
  );
}
