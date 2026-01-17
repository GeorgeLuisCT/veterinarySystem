"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import VisitService from "../../services/visit-service";
import { FieldVisitStatus } from "../../enums/field-visit-status";
import { cn } from "@/lib/utils";

function toLocalDateTimeStringSeconds(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getFullYear() +
    "-" +
    pad(d.getMonth() + 1) +
    "-" +
    pad(d.getDate()) +
    "T" +
    pad(d.getHours()) +
    ":" +
    pad(d.getMinutes()) +
    ":" +
    pad(d.getSeconds())
  );
}

export default function KpiGrid() {
  const [{ planned, inProgress, completed }, setKpis] = React.useState({ planned: 0, inProgress: 0, completed: 0 });

  React.useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    VisitService.list({ from: toLocalDateTimeStringSeconds(start), to: toLocalDateTimeStringSeconds(end), size: 200 })
      .then((res) => {
        const visits = res.content ?? [];
        setKpis({
          planned: visits.filter((v) => v.status === FieldVisitStatus.PLANNED).length,
          inProgress: visits.filter((v) => v.status === FieldVisitStatus.IN_PROGRESS).length,
          completed: visits.filter((v) => v.status === FieldVisitStatus.COMPLETED).length,
        });
      })
      .catch(() => {});
  }, []);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <KpiCard title="Planificadas hoy" value={String(planned)} accent="from-blue-500/15 to-blue-500/5" dot="bg-blue-500" />
      <KpiCard title="En progreso" value={String(inProgress)} accent="from-amber-500/15 to-amber-500/5" dot="bg-amber-500" />
      <KpiCard title="Completadas" value={String(completed)} accent="from-emerald-500/15 to-emerald-500/5" dot="bg-emerald-500" />
    </div>
  );
}

function KpiCard({ title, value, accent, dot }: { title: string; value: string; accent: string; dot: string }) {
  return (
    <Card className={cn("overflow-hidden border-none shadow-sm", "bg-gradient-to-b", accent)}>
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <span className={cn("size-2 rounded-full", dot)} /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="text-3xl font-semibold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
}