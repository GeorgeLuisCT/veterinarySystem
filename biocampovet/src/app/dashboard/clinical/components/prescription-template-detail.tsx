"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import PrescriptionTemplateService from "../service/prescription-template-service";
import { PrescriptionTemplateResponse } from "../types/prescription-template-response";
import { getAaxiosErrorMessage } from "@/helpers/error";
import { ProductUnitType, ProductUnitTypeLabels } from "@/app/dashboard/inventory/products/enums/product-unit-type";
import { FrequencyUnitLabels } from "../enums/frequency-unit";
import { TimeUnit } from "@/enums/time-unit";

interface PrescriptionTemplateDetailProps {
  templateId: number;
}

const timeUnitLabels: Record<TimeUnit, string> = {
  [TimeUnit.DAYS]: "días",
  [TimeUnit.WEEKS]: "semanas",
  [TimeUnit.MONTHS]: "meses",
};

const dosageUnitLabel = (unit?: ProductUnitType | null) =>
  unit ? ProductUnitTypeLabels[unit] ?? unit : "sin unidad";

export function PrescriptionTemplateDetail({ templateId }: PrescriptionTemplateDetailProps) {
  const [data, setData] = React.useState<PrescriptionTemplateResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await PrescriptionTemplateService.getById(templateId);
        if (mounted) {
          setData(response);
        }
      } catch (err) {
        if (mounted) {
          setError(
            getAaxiosErrorMessage(err) ?? "No se pudo cargar la plantilla de prescripción."
          );
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
  }, [templateId]);

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
        No se encontró información para esta plantilla.
      </div>
    );
  }

  return (
    <div className="space-y-4 text-sm max-h-[70vh] overflow-auto pr-1">
      <div>
        <h3 className="text-lg font-semibold text-foreground">{data.name}</h3>
        <p className="text-sm text-muted-foreground">{data.purpose}</p>
      </div>

      {data.notes && (
        <div>
          <h4 className="text-xs font-semibold uppercase text-muted-foreground">Notas generales</h4>
          <p className="text-sm leading-6 text-foreground">{data.notes}</p>
        </div>
      )}

      <Separator />

      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase text-muted-foreground">Medicamentos</h4>
        {data.medications.map((medication) => {
          const productLabel = medication.productName
            ? medication.productName
            : medication.customMedicationName ?? "Medicamento personalizado";
          const dosageLabel = medication.dosageUnit
            ? `${medication.dosageAmount} ${dosageUnitLabel(medication.dosageUnit)}`
            : `${medication.dosageAmount}`;
          const frequencyLabel = `${medication.frequencyValue} ${
            FrequencyUnitLabels[medication.frequencyUnit]
          }`;
          const durationLabel = `${medication.durationValue} ${
            timeUnitLabels[medication.durationUnit] ?? medication.durationUnit
          }`;

          return (
            <div
              key={medication.id}
              className="rounded-md border border-dashed border-border p-3"
            >
              <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">{productLabel}</span>
                  {medication.productId && (
                    <span className="text-xs text-muted-foreground">
                      Producto del inventario (ID: {medication.productId})
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Dosis: {dosageLabel}</Badge>
                  <Badge variant="secondary">Cada {frequencyLabel}</Badge>
                  <Badge variant="secondary">Por {durationLabel}</Badge>
                </div>
              </div>
              {medication.instructions && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Instrucciones: {medication.instructions}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PrescriptionTemplateDetail;
