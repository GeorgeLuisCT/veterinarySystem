"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import LaboratoryTestService from "../service/laboratory-test-service";
import { LaboratoryTestResponse, LaboratoryTestParameterResponse } from "../types/laboratory-test-response";
import { getAaxiosErrorMessage } from "@/helpers/error";

interface LaboratoryTestDetailProps {
  labTestId: number;
}

const getReferenceRange = (param: LaboratoryTestParameterResponse): string => {
    if (param.refText) return param.refText;
    if (param.refMin != null && param.refMax != null) return `${param.refMin} - ${param.refMax}`;
    if (param.refMin != null) return `> ${param.refMin}`;
    if (param.refMax != null) return `< ${param.refMax}`;
    if (param.allowedOptions) return param.allowedOptions;
    return "N/A";
}

export default function LaboratoryTestDetail({ labTestId }: LaboratoryTestDetailProps) {
  const [data, setData] = React.useState<LaboratoryTestResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await LaboratoryTestService.getById(labTestId);
        if (mounted) {
          setData(response);
        }
      } catch (err) {
        if (mounted) {
          const message =
            getAaxiosErrorMessage(err) ?? "No se pudo cargar el detalle de la prueba.";
          setError(message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [labTestId]);

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-md border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
        No se encontró información para esta prueba.
      </div>
    );
  }

  return (
    <div className="space-y-4 text-sm max-h-[70vh] overflow-auto pr-2">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{data.name}</h3>
        <div className="text-muted-foreground">
          Código: {data.code}
        </div>
      </div>

      {data.description && (
        <div>
          <h4 className="text-xs font-semibold uppercase text-muted-foreground">Descripción</h4>
          <p className="text-sm leading-6 text-foreground">{data.description}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        <div>
          <h4 className="text-xs font-semibold uppercase text-muted-foreground">
            Precio
          </h4>
          <p className="text-sm font-medium text-foreground">
            S/ {Number(data.price ?? 0).toFixed(2)}
          </p>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase text-muted-foreground">
            Estado
          </h4>
          <Badge variant={data.active ? "secondary" : "outline"}>
            {data.active ? "Activo" : "Inactivo"}
          </Badge>
        </div>
      </div>

      <Separator />

        <div>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground">
            Laboratorios Activos
            </h4>
            <div className="flex flex-wrap gap-2 mt-2">
            {data.laboratories?.filter(l => l.active).length > 0 ? (
                data.laboratories.filter(l => l.active).map(lab => (
                <Badge key={lab.laboratoryId} variant="outline">{lab.laboratoryName}</Badge>
                ))
            ) : (
                <p className="text-sm text-muted-foreground">No está activo en ningún laboratorio.</p>
            )}
            </div>
        </div>

      <Separator />

      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase text-muted-foreground">
          Parámetros
        </h4>
        {data.parameters?.length ? (
          <div className="space-y-2">
            {data.parameters.map((param) => (
              <div
                key={param.id}
                className="flex items-center justify-between rounded-md border border-dashed border-border px-3 py-2"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">{param.name} ({param.valueType})</span>
                  <span className="text-xs text-muted-foreground">Unidad: {param.unit || "N/A"}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Ref: {getReferenceRange(param)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No hay parámetros registrados para esta prueba.
          </p>
        )}
      </div>
    </div>
  );
}
