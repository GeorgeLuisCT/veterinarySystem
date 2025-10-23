"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TeamStatusService from "../../services/team-status-service";
import type { TeamStatusResponse } from "../../types/team-status-response";

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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Equipo de campo</CardTitle>
          <p className="text-sm text-muted-foreground">Estado, ubicación y visita actual.</p>
        </div>
        <button onClick={load} className="text-sm text-muted-foreground hover:text-foreground">Actualizar</button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {team.map((t) => (
            <article key={t.employeeId} className="rounded-xl border bg-card p-4 shadow-sm transition hover:shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium leading-tight">{t.employeeName}</h4>
                  <p className="text-xs text-muted-foreground">Ubicación: {t.locationText ?? "—"}</p>
                </div>
                <span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">{t.status}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Visita: {t.currentVisitFarmName ?? t.currentVisitZoneName ?? "—"}</p>
            </article>
          ))}
          {!loading && team.length === 0 && (
            <div className="text-sm text-muted-foreground">Sin datos de equipo.</div>
          )}
          {loading && <div className="text-sm text-muted-foreground">Cargando…</div>}
        </div>
      </CardContent>
    </Card>
  );
}