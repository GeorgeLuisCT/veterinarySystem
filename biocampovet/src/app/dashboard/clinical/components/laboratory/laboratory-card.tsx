"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Stethoscope, MoveRight, Tags, PawPrint, MapPin, ClipboardList } from "lucide-react";
import { AnimalSpeciesDetails } from "@/app/dashboard/crm/patients/enums/animal-species";
import { LabRequestStatus } from "../../enums/lab-request-status";

export type LaboratoryCardData = {
    id: number;
    animalName: string;
    species?: keyof typeof AnimalSpeciesDetails | string | null | undefined;
    breed?: string | null | undefined;
    requestingEmployeeFullName: string | null;
    clinicalNotes?: string | null | undefined;
    createdAt: string;
    badgeLabel: string;
    status: LabRequestStatus;
    laboratoryName?: string;
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

export default function LaboratoryCard({ data }: { data: LaboratoryCardData }) {
    const router = useRouter();
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 15000);
        return () => clearInterval(t);
    }, []);

    const timeInStatus = calculateTimeInStatus(data.createdAt, now);

    const speciesDetails = useMemo(() => {
        if (!data.species) return undefined;
        return (AnimalSpeciesDetails as any)[data.species];
    }, [data.species]);

    const SpeciesIcon = speciesDetails?.icon;
    const speciesColor = speciesDetails?.colorClass;
    const borderIconClass = speciesColor ? speciesColor.replace("bg-", "border-") : "border-gray-200";
    const iconSpeciesClass = speciesColor ? speciesColor.replace("bg-", "text-") : "text-gray-400";

    const borderCardClass =
        data.status === LabRequestStatus.REQUESTED
            ? "border-amber-500"
            : data.status === LabRequestStatus.IN_PROGRESS
                ? "border-blue-600"
                : data.status === LabRequestStatus.COMPLETED
                    ? "border-emerald-700"
                    : "border-slate-300";

    const badgeColor =
        data.status === LabRequestStatus.REQUESTED
            ? "bg-amber-500"
            : data.status === LabRequestStatus.IN_PROGRESS
                ? "bg-blue-600"
                : data.status === LabRequestStatus.COMPLETED
                    ? "bg-emerald-700"
                    : "bg-slate-500";

    const handleOpen = useCallback(() => {
        router.push(`/dashboard/clinical/laboratory/${data.id}`);
    }, [router, data.id]);

    return (
        <Card className={`relative flex flex-col overflow-hidden shadow-md bg-white rounded-lg pt-0 border-2 border-l-8 ${borderCardClass}`}>
            <div className="absolute right-3 top-3 z-10">
                <Badge className={`gap-1 text-xs text-white shadow-sm ${badgeColor}`}>
                    <Tags className="h-3.5 w-3.5" />
                    {data.badgeLabel}
                </Badge>
            </div>

            <CardContent className="p-4 flex flex-col gap-4 pb-0">
                <div className="flex items-start gap-4">
                    <div className={`w-16 h-16 rounded-full border-2 bg-white flex items-center justify-center ${borderIconClass}`}>
                        {SpeciesIcon ? (
                            <SpeciesIcon className={`h-8 w-8 ${iconSpeciesClass}`} />
                        ) : (
                            <PawPrint className={`h-8 w-8 ${iconSpeciesClass}`} />
                        )}
                    </div>

                    <div className="flex-grow min-w-0">
                        <h4 className="text-xl font-bold text-gray-800 truncate">{data.animalName}</h4>

                        <div className="flex items-center gap-2 text-gray-600 mt-1 text-sm">
                            {SpeciesIcon && <SpeciesIcon className="h-5 w-5 text-gray-500 shrink-0" />}
                            <span className="truncate">
                                {(speciesDetails ? speciesDetails.label : (data.species ?? "—"))} — {data.breed || "Mestizo"}
                            </span>
                        </div>

                        {data.laboratoryName ? (
                            <div className="flex items-center gap-2 text-gray-600 mt-1 text-sm">
                                <MapPin className="h-5 w-5 text-gray-500" />
                                <span className="truncate">Lab: {data.laboratoryName}</span>
                            </div>
                        ) : (
                            <div className="mt-1 h-5" />
                        )}
                    </div>
                </div>

                <div className="space-y-2 ml-2">
                    <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-gray-500" />
                        <p className="text-sm font-semibold text-gray-600">
                            Creado hace:
                            <span className="text-sm font-normal text-gray-500"> {timeInStatus}</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Stethoscope className="h-5 w-5 text-gray-500" />
                        <p className="text-sm font-semibold text-gray-600">
                            Solicitante:
                            <span className="text-sm font-normal text-gray-500"> {data.requestingEmployeeFullName || "No asignado"}</span>
                        </p>
                    </div>
                </div>

                <div className="text-sm my-2 p-2 bg-gray-50 rounded-md truncate flex items-center gap-2" title={data.clinicalNotes ?? ""}>
                    <ClipboardList className={`h-5 w-5 text-primary`} />
                    {data.clinicalNotes ?? "Sin notas clínicas"}
                </div>

                <div className="mt-auto pt-4 border-t border-gray-100">
                    <Button variant="outline" size="sm" className="w-full text-gray-700 font-semibold h-9" onClick={handleOpen}>
                        Ver solicitud
                        <MoveRight className="h-3.5 w-3.5 ml-2" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
