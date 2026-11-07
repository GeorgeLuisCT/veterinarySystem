"use client";

import * as React from "react";
import TeamStatusService from "../../services/team-status-service";
import type { TeamStatusResponse } from "../../types/team-status-response";
import { PageSection } from "@/components/page/page-section";

export default function TeamStatusGrid() {
  const [team, setTeam] = React.useState<TeamStatusResponse[]>([]);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await TeamStatusService.list();
      setTeam(res);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <PageSection
      title="Equipo de campo"
      description="Estado, ubicación y visita actual."
      className="h-full"
      actions={
        <button onClick={load} className="text-sm text-muted-foreground hover:text-foreground">
          Actualizar
        </button>
      }
    >
      <div className="divide-y">
        {team.map((t) => (
          <article key={t.employeeId} className="py-3 first:pt-0">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h4 className="font-medium leading-tight">{t.employeeName}</h4>
                <p className="text-xs text-muted-foreground">Ubicación: {t.locationText ?? "—"}</p>
              </div>
              <span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                {t.status}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Visita: {t.currentVisitFarmName ?? t.currentVisitZoneName ?? "—"}
            </p>
          </article>
        ))}
        {!loading && team.length === 0 && (
          <div className="text-sm text-muted-foreground">Sin datos de equipo.</div>
        )}
        {loading && <div className="text-sm text-muted-foreground">Cargando…</div>}
      </div>
    </PageSection>
  );
}
