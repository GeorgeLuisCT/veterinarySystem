"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldVisitResponse } from "../../types/visit-response";

export default function ServicesCard({ visit, loading }: { visit: FieldVisitResponse | null; loading: boolean; }) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader><CardTitle>Servicios</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-2">
          {visit?.serviceItems?.map((si) => (
            <div key={si.id} className="flex justify-between rounded-md border p-2">
              <div>
                <div className="font-medium">{si.clinicalServiceName}</div>
                <div className="text-sm text-muted-foreground">x{si.quantity} • S/ {Number(si.unitPrice).toFixed(2)}</div>
              </div>
              <div className="text-sm text-muted-foreground">{si.performedByName ?? "—"}</div>
            </div>
          ))}
          {!loading && (visit?.serviceItems?.length ?? 0) === 0 && (
            <div className="text-sm text-muted-foreground">Sin servicios aún.</div>
          )}
          {loading && <div className="text-sm text-muted-foreground">Cargando…</div>}
        </div>
      </CardContent>
    </Card>
  );
}