"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductUnitTypeLabels } from "@/app/dashboard/inventory/products/enums/product-unit-type";
import { FieldVisitResponse } from "../../types/visit-response";

export default function UsagesCard({ visit, loading }: { visit: FieldVisitResponse | null; loading: boolean; }) {
  return (
    <Card>
      <CardHeader><CardTitle>Insumos consumidos</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-2">
          {visit?.productUsages?.map((pu) => (
            <div key={pu.id} className="flex justify-between rounded-md border p-2">
              <div>
                <div className="font-medium">{pu.productName}</div>
                <div className="text-sm text-muted-foreground">-{pu.quantityUsed} {ProductUnitTypeLabels[pu.unit] ?? pu.unit}</div>
              </div>
              <div className="text-sm text-muted-foreground">{pu.vehicleName ?? "—"}</div>
            </div>
          ))}
          {!loading && (visit?.productUsages?.length ?? 0) === 0 && (
            <div className="text-sm text-muted-foreground">Sin consumos aún.</div>
          )}
          {loading && <div className="text-sm text-muted-foreground">Cargando…</div>}
        </div>
      </CardContent>
    </Card>
  );
}