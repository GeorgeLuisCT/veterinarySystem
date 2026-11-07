"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Clock, Stethoscope, MoveRight, Tags, PawPrint, Eye, ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { AnimalSpeciesDetails } from "@/app/dashboard/crm/patients/enums/animal-species";
import type { AnimalBasicResponse } from "@/app/dashboard/crm/patients/types/animal-basic-response";
import { toneBorderLeft, type StatusTone } from "@/components/page/status-tone";

export type ConsultationCardData = {
  id: number;
  source: "RECEPCION" | "CLINICA";
  animalBasicResponse: AnimalBasicResponse;
  ownerName?: string;
  reason: string;
  vetName: string | null;
  startTime: string;
  attentionId: number;
  statusLabel: string;
};

const calculateTimeInStatus = (startTime: string, now: Date) => {
  const diff = now.getTime() - new Date(startTime).getTime();
  if (diff < 0) return "0 min";
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes} min`;
};

export default function ConsultationCard({ data }: { data: ConsultationCardData }) {
  const router = useRouter();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(t);
  }, []);

  const timeInStatus = calculateTimeInStatus(data.startTime, now);

  const handleContinue = useCallback(() => {
    router.push(`/dashboard/clinical/consultory/${data.attentionId}`);
  }, [router, data.attentionId]);

  const speciesDetails = AnimalSpeciesDetails[data.animalBasicResponse.animalSpecies];
  const SpeciesIcon = speciesDetails?.icon;
  const speciesColor = speciesDetails?.colorClass;

  const borderIconClass = speciesColor ? speciesColor.replace("bg-", "border-") : "border-border";
  const iconSpeciesClass = speciesColor ? speciesColor.replace("bg-", "text-") : "text-muted-foreground";

  const tone: StatusTone = data.source === "RECEPCION" ? "warning" : "success";
  const borderCardClass = toneBorderLeft[tone];
  const badgeText = data.source === "RECEPCION" ? "Sala de Espera" : data.statusLabel;

  return (
    <Card className={`relative flex flex-col gap-0 overflow-hidden rounded-lg border border-l-4 py-0 ${borderCardClass}`}>
      <div className="absolute right-3 top-3 z-10">
        <Badge variant={tone} className="gap-1 text-xs">
          <Tags className="h-3.5 w-3.5" />
          {badgeText}
        </Badge>
      </div>

      <CardContent className="p-4 flex flex-col gap-4 pb-0">
        <div className="flex items-start gap-4">
          {data.animalBasicResponse.animalPhotoUrl ? (
            <img
              src={data.animalBasicResponse.animalPhotoUrl}
              alt={data.animalBasicResponse.animalName}
              className="w-16 h-16 rounded-full object-cover border-2 border-border"
              loading="lazy"
            />
          ) : (
            <div className={`w-16 h-16 rounded-full border-2 bg-card flex items-center justify-center ${borderIconClass}`}>
              {SpeciesIcon ? (
                <SpeciesIcon className={`h-8 w-8 ${iconSpeciesClass}`} />
              ) : (
                <PawPrint className={`h-8 w-8 ${iconSpeciesClass}`} />
              )}
            </div>
          )}

          <div className="flex-grow min-w-0">
            <h4 className="text-xl font-bold text-foreground truncate">{data.animalBasicResponse.animalName}</h4>

            <div className="flex items-center gap-2 text-muted-foreground mt-1 text-sm">
              {SpeciesIcon && <SpeciesIcon className="h-5 w-5 text-muted-foreground shrink-0" />}
              <span className="truncate">
                {(speciesDetails ? speciesDetails.label : data.animalBasicResponse.animalSpecies) ?? "—"} —{" "}
                {data.animalBasicResponse.animalBreed || "Mestizo"}
              </span>
            </div>

            {data.ownerName ? (
              <div className="text-muted-foreground mt-1 text-sm truncate">
                Propietario: <span className="text-muted-foreground">{data.ownerName}</span>
              </div>
            ) : (
              <div className="mt-1 h-5" />
            )}
          </div>
        </div>

        <div className="space-y-2 ml-2">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm font-semibold text-muted-foreground">
              En estado:
              <span className="text-sm font-normal text-muted-foreground"> {timeInStatus}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm font-semibold text-muted-foreground">
              Asignado a:
              <span className="text-sm font-normal text-muted-foreground"> {data.vetName || "No asignado"}</span>
            </p>
          </div>
        </div>

        <p className="text-sm my-2 p-2 bg-muted rounded-md truncate flex items-center gap-2" title={data.reason}>
          <ClipboardList className={`h-5 w-5 text-primary`} />
          {data.reason}
        </p>

        <div className="mt-auto pt-4 border-t border-border">
          <Button variant="outline" size="sm" className="w-full text-muted-foreground font-semibold h-9" onClick={handleContinue}>
            <Eye className="h-4 w-4 mr-2" />
            {data.source === "RECEPCION" ? "Atender" : "Continuar"}
            <MoveRight className="h-3.5 w-3.5 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
