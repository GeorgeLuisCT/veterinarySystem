"use client";

import * as React from "react";
import VisitService from "../../services/visit-service";
import type { FieldVisitSummaryResponse } from "../../types/visit-response";
import { FieldVisitStatus } from "../../enums/field-visit-status";
import { PageSection } from "@/components/page/page-section";

export default function RecentReportsCard() {
  const [reports, setReports] = React.useState<FieldVisitSummaryResponse[]>([]);

  React.useEffect(() => {
    VisitService.list({ status: FieldVisitStatus.COMPLETED, size: 5 })
      .then((res) => setReports(res.content ?? []))
      .catch(() => {});
  }, []);

  return (
    <PageSection title="Reportes recientes" className="h-full">
      <div className="divide-y">
        {reports.map((r) => (
          <div key={r.id} className="flex justify-between py-2 text-sm">
            <div>
              <div className="font-medium">{r.farmName ?? r.zoneName ?? "—"}</div>
              <div className="text-muted-foreground">{r.fieldVetName ?? "—"}</div>
            </div>
            <div className="text-muted-foreground">
              {new Date(r.scheduledDateTime).toLocaleDateString()}
            </div>
          </div>
        ))}
        {reports.length === 0 && (
          <div className="text-sm text-muted-foreground">Sin reportes recientes.</div>
        )}
      </div>
    </PageSection>
  );
}
