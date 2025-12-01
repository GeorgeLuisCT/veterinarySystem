"use client";

import * as React from "react";
import { PawPrint, BriefcaseMedical, HelpingHand, TimerIcon, Eye } from "lucide-react";
import Image from "next/image";
import { FaUserMd } from "react-icons/fa";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimalSpeciesDetails } from "@/app/dashboard/crm/patients/enums/animal-species";
import { AttentionStatus, AttentionStatusDetails } from "@/app/dashboard/schedule/enums/attention-status";
import { AttentionType, AttentionTypeDetails, AttentionTypeLabels } from "@/app/dashboard/schedule/enums/attention-type";
import { formatCheckInTime } from "@/utils/farmated-dates";
import type { AttentionResponse } from "@/app/dashboard/schedule/types/attention-response";

interface AttentionCardProps {
  attention: AttentionResponse;
  onAttend: (attention: AttentionResponse) => void;
  highlightClassName?: string;
}

export default function AttentionCard({ attention, onAttend, highlightClassName }: AttentionCardProps) {
  const statusDetails = AttentionStatusDetails[attention.status as AttentionStatus];
  const speciesDetails = AnimalSpeciesDetails[attention.animalBasicResponse.animalSpecies];
  const StatusIcon = statusDetails.icon;
  const SpeciesIcon = speciesDetails?.icon;
  const typeDetails = AttentionTypeDetails[attention.type as AttentionType];
  const TypeIcon = typeDetails.icon;

  const statusColor = statusDetails?.colorClass;
  const speciesColor = speciesDetails?.colorClass;

  const borderCardClass = statusColor ? statusColor.replace("bg-", "border-") : "border-gray-200";
  const borderIconClass = speciesColor ? speciesColor.replace("bg-", "border-") : "border-gray-200";
  const iconSpeciesClass = speciesColor ? speciesColor.replace("bg-", "text-") : "text-gray-400";

  const isWaiting = attention.status === AttentionStatus.WAITING;

  return (
    <Card className={`relative flex flex-col overflow-hidden shadow-md bg-white rounded-lg pt-0 border-2 border-l-8 ${borderCardClass} ${highlightClassName ?? ""}`}>
      <div className="absolute right-3 top-3 z-10">
        <Badge className={`gap-1 text-xs text-white shadow-sm ${AttentionTypeDetails[attention.type as AttentionType].colorClass}`}>
          <TypeIcon className="h-3.5 w-3.5" />
          {AttentionTypeLabels[attention.type as AttentionType]}
        </Badge>
      </div>

      <CardContent className="p-4 flex flex-col gap-4 pb-0">
        <div className="flex items-start gap-4">
          {attention.animalBasicResponse.animalPhotoUrl ? (
            <Image
              src={attention.animalBasicResponse.animalPhotoUrl}
              alt={attention.animalBasicResponse.animalName}
              className="rounded-full object-cover border-2 border-gray-200"
              width={64}
              height={64}
            />
          ) : (
            <div className={`w-16 h-16 rounded-full border-2 bg-white flex items-center justify-center ${borderIconClass}`}>
              {SpeciesIcon ? (
                <SpeciesIcon className={`h-8 w-8 ${iconSpeciesClass}`} />
              ) : (
                <PawPrint className={`h-8 w-8 ${iconSpeciesClass}`} />
              )}
            </div>
          )}

          <div className="flex-grow">
            <h4 className="text-xl font-bold text-gray-800">{attention.animalBasicResponse.animalName}</h4>

            <div className="flex items-center gap-2 text-gray-600 mt-1 text-sm">
              {SpeciesIcon && <SpeciesIcon className="h-5 w-5 text-gray-500" />}
              <span>
                {speciesDetails ? speciesDetails.label : attention.animalBasicResponse.animalSpecies} — {attention.animalBasicResponse.animalBreed || "Mestizo"}
              </span>
            </div>

            {attention.clinicalServiceName ? (
              <div className="flex items-center gap-2 text-gray-600 mt-1 text-sm h-5">
                <BriefcaseMedical className="h-5 w-5 text-gray-500" />
                <span className="truncate">{attention.clinicalServiceName}</span>
              </div>
            ) : (
              <div className="mt-1 h-5" />
            )}
          </div>
        </div>

        <div className="space-y-2 ml-2">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${statusDetails.colorClass} text-white`}>
            <StatusIcon className="mr-2 h-4 w-4" />
            {statusDetails.label}
          </div>

          <div className="flex items-center gap-2">
            <TimerIcon className={`h-5 w-5 text-gray-500`} />
            <p className="text-sm font-semibold text-gray-600">
              Llegada hace:
              <span className="text-sm font-normal text-gray-500"> {formatCheckInTime(attention.checkInTime)}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <FaUserMd className={`h-5 w-5 text-gray-500`} />
            <p className="text-sm font-semibold text-gray-600">
              Asignado a:
              <span className="text-sm font-normal text-gray-500"> {attention.attendingEmployeeFullName}</span>
            </p>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-100">
          <Button
            variant={"outline"}
            onClick={() => onAttend(attention)}
            className="w-full text-gray-700 font-semibold cursor-pointer"
          >
            {isWaiting ? (
              <>
                <HelpingHand className="mr-2 h-4 w-4" />
                Atender
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Ver
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
