"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import VisitService from "../../services/visit-service";
import type { FieldVisitSummaryResponse } from "../../types/visit-response";
import { FieldVisitStatus } from "../../enums/field-visit-status";

export default function RecentReportsCard() {
  const [reports, setReports] = React.useState<FieldVisitSummaryResponse[]>([]);

  React.useEffect(() => {
    VisitService.list({ status: FieldVisitStatus.COMPLETED, size: 5 })
      .then((res) => setReports(res.content ?? []))
      .catch(() => {});
  }, []);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Reportes recientes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {reports.map((r) => (
            <div key={r.id} className="flex justify-between rounded-md border p-2 text-sm">
              <div>
                <div className="font-medium">{r.farmName ?? r.zoneName ?? "—"}</div>
                <div className="text-muted-foreground">{r.fieldVetName ?? "—"}</div>
              </div>
              <div className="text-muted-foreground">{new Date(r.scheduledDateTime).toLocaleDateString()}</div>
            </div>
          ))}
          {reports.length === 0 && <div className="text-sm text-muted-foreground">Sin reportes recientes.</div>}
        </div>
      </CardContent>
    </Card>
  );
}