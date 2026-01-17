"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ClinicalServiceService from "../service/clinical-service-service";
import { ClinicalServiceResponse } from "../types/clinical-service-response";
import { ClinicalServiceCategoryLabels } from "../enums/clinical-service-category";
import { TimeUnit } from "@/enums/time-unit";
import { getAaxiosErrorMessage } from "@/helpers/error";

interface ClinicalServiceDetailProps {
  serviceId: number;
}

const timeUnitLabel: Record<TimeUnit, string> = {
  [TimeUnit.DAYS]: "días",
  [TimeUnit.WEEKS]: "semanas",
  [TimeUnit.MONTHS]: "meses",
};

export default function ClinicalServiceDetail({ serviceId }: ClinicalServiceDetailProps) {
  const [data, setData] = React.useState<ClinicalServiceResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await ClinicalServiceService.getById(serviceId);
        if (mounted) {
          setData(response);
        }
      } catch (err) {
        if (mounted) {
          const message =
            getAaxiosErrorMessage(err) ?? "No se pudo cargar el detalle del servicio clínico.";
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
  }, [serviceId]);

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
        No se encontró información para este servicio.
      </div>
    );
  }

  const reminder =
    data.reminderPeriod && data.reminderPeriodUnit
      ? `${data.reminderPeriod} ${timeUnitLabel[data.reminderPeriodUnit]}`
      : "—";

  return (
    <div className="space-y-4 text-sm max-h-[70vh] overflow-auto pr-2">
      <div className="space-y-4 text-sm">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">{data.name}</h3>
          <div className="text-muted-foreground">
            {ClinicalServiceCategoryLabels[data.clinicalServiceCategory] ?? data.clinicalServiceCategory}
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
              Precio estándar
            </h4>
            <p className="text-sm font-medium text-foreground">
              S/ {Number(data.price ?? 0).toFixed(2)}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground">
              Recordatorio
            </h4>
            <p className="text-sm text-foreground">{reminder}</p>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground">
            Materiales requeridos
          </h4>
          {data.requiredSampleTypes?.length ? (
            <div className="flex flex-wrap gap-2">
              {data.requiredSampleTypes.map((sample) => (
                <Badge key={sample} variant="secondary">
                  {sample}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No hay materiales registrados.</p>
          )}
        </div>

        <Separator />

        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground">
            Productos del inventario
          </h4>
          {data.requiredProducts?.length ? (
            <div className="space-y-2">
              {data.requiredProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-md border border-dashed border-border px-3 py-2"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{product.name}</span>
                    <span className="text-xs text-muted-foreground">SKU: {product.sku}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No hay productos asociados a este servicio.
            </p>
          )}
        </div>

        <Separator />

        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground">Sucursales</h4>
          {data.branches?.length ? (
            <div className="space-y-2">
              {data.branches.map((branch) => (
                <div key={branch.branchId} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
                  <span className="text-sm font-medium text-foreground">{branch.branchName}</span>
                  <Badge variant={branch.active ? "secondary" : "outline"}>
                    {branch.active ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No hay sucursales asociadas.</p>
          )}
        </div>
      </div>
    </div>
  );
}
