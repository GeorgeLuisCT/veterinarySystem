"use client";

import * as React from "react";
import { Home, MapPin, CalendarClock, User2, Truck, BadgeCheck, PlayCircle, CheckCircle2, Eye, Dot } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FieldVisitSummaryResponse } from "@/app/dashboard/fieldwork/types/visit-response";
import {
  FieldVisitStatus,
  FieldVisitStatusLabels,
  getFieldVisitStatusStyles,
} from "@/app/dashboard/fieldwork/enums/field-visit-status";

interface VisitCardProps {
  visit: FieldVisitSummaryResponse;
  onView: (visit: FieldVisitSummaryResponse) => void;
  onStart: (visit: FieldVisitSummaryResponse) => void | Promise<void>;
  onComplete: (visit: FieldVisitSummaryResponse) => void | Promise<void>;
}

export default function VisitCard({ visit, onView, onStart, onComplete }: VisitCardProps) {
  const dt = new Date(visit.scheduledDateTime);
  const statusInfo = getFieldVisitStatusStyles(visit.status);

  return (
    <Card className={`relative overflow-hidden rounded-xl border-2 border-l-8 bg-white ${statusInfo.borderClass}`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex items-center gap-3">
            <div className="flex min-w-0 items-center gap-2 text-sm text-gray-800">
              {visit.farmName ? <Home className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
              <span className="font-semibold truncate">{visit.farmName ?? visit.zoneName ?? "—"}</span>
            </div>

            <Dot className="hidden h-4 w-4 text-muted-foreground sm:block" />

            <div className="hidden shrink-0 items-center gap-2 text-sm text-gray-700 sm:inline-flex">
              <CalendarClock className="h-4 w-4" />
              <span className="font-medium">
                {dt.toLocaleDateString()} {dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>

            <Badge className={`hidden sm:inline-flex text-xs ${statusInfo.badgeClass}`}>
              {FieldVisitStatusLabels[visit.status]}
            </Badge>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {visit.status === FieldVisitStatus.PLANNED && (
              <Button size="sm" onClick={() => onStart(visit)} className="gap-1.5">
                <PlayCircle className="h-4 w-4" />
                Iniciar
              </Button>
            )}
            {visit.status === FieldVisitStatus.IN_PROGRESS && (
              <Button size="sm" onClick={() => onComplete(visit)} className="gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                Finalizar
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => onView(visit)} className="gap-1.5">
              <Eye className="h-4 w-4" />
              Ver
            </Button>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-gray-600">
          <Badge className={`sm:hidden text-[10px] ${statusInfo.badgeClass}`}>
            {FieldVisitStatusLabels[visit.status]}
          </Badge>

          <div className="flex items-center gap-1.5">
            <User2 className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="truncate">{visit.fieldVetName ?? "—"}</span>
          </div>

          <Dot className="h-4 w-4 text-muted-foreground" />

          <div className="flex items-center gap-1.5">
            <Truck className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="truncate">{visit.vehicleName ?? "—"}</span>
          </div>

          {visit.objective && (
            <>
              <Dot className="h-4 w-4 text-muted-foreground" />
              <span className="line-clamp-1 truncate text-muted-foreground">
                <span className="font-medium text-gray-700">Objetivo: </span>
                {visit.objective}
              </span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
