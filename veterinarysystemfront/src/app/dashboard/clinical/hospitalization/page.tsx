"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  PlusCircle, FileText, MoreHorizontal, Edit, Trash2, HeartPulse,
  Pill, ClipboardEdit, PawPrint,
  DoorOpen,
  BriefcaseMedical
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@/context/user-context";
import { CageResponse } from "@/app/dashboard/clinical/types/cage-response";
import { HospitalizationCauseDetails } from "@/app/dashboard/clinical/enums/hospitalization-cause";
import CageService from "@/app/dashboard/clinical/service/cage-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";
import { NewHospitalizationModal } from "../components/hospitalization/new-hospitalization-modal";
import DashboardLayoutSection from "../../dashboard-layout-section";
import { NewCageModal } from "../components/hospitalization/add-cage-modal";
import { EditCageModal } from "../components/hospitalization/edit-cage-modal";
import { DeleteCageModal } from "../components/hospitalization/delete-cage-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AnimalSpeciesDetails } from "../../crm/patients/enums/animal-species";
import { CageSizeLabels } from "../enums/cage-size";
import { formatAdmissionTime } from "@/utils/farmated-dates";

const truncateText = (value: string, maxLength = 40) => {
  if (!value) return "";
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
};

const formatDateTime = (value?: string, options?: Intl.DateTimeFormatOptions) => {
  if (!value) return "";
  return new Date(value).toLocaleString("es-ES", options ?? {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatMeasurement = (value?: number, unit = "", decimals = 0) => {
  if (value == null) return "N/A";
  const fixed = decimals > 0 ? value.toFixed(decimals) : value.toString();
  return `${fixed}${unit}`;
};

export default function HospitalizationBoardPage() {
  const { userInfo } = useUser();
  const { toast } = useToast();
  const [cages, setCages] = useState<CageResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAdmitModalOpen, setAdmitModalOpen] = useState(false);
  const [isAddCageModalOpen, setAddCageModalOpen] = useState(false);
  const [isEditCageModalOpen, setEditCageModalOpen] = useState(false);
  const [isDeleteCageModalOpen, setDeleteCageModalOpen] = useState(false);

  const [selectedCage, setSelectedCage] = useState<CageResponse | null>(null);
  const [cageToEdit, setCageToEdit] = useState<CageResponse | null>(null);
  const [cageToDelete, setCageToDelete] = useState<CageResponse | null>(null);

  const fetchBoardData = useCallback(async () => {
    if (!userInfo?.selectedBranch?.id) return;
    setLoading(true);
    try {
      const cageRes = await CageService.list({ branchId: userInfo.selectedBranch.id, pageSize: 100 });
      setCages(cageRes.content.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: getAaxiosErrorMessage(error) ?? "No se pudo cargar el tablero.",
      });
    } finally {
      setLoading(false);
    }
  }, [userInfo?.selectedBranch?.id, toast]);

  useEffect(() => {
    fetchBoardData();
  }, [fetchBoardData]);

  const handleOpenAdmitModal = (cage: CageResponse) => { setSelectedCage(cage); setAdmitModalOpen(true); };
  const handleOpenEditModal = (cage: CageResponse) => { setCageToEdit(cage); setEditCageModalOpen(true); };
  const handleOpenDeleteModal = (cage: CageResponse) => { setCageToDelete(cage); setDeleteCageModalOpen(true); };
  const handleCageCreated = (newCage: CageResponse) => { setCages((prev) => [newCage, ...prev].sort((a, b) => a.name.localeCompare(b.name))); };
  const handleCageUpdated = (updatedCage: CageResponse) => { setCages((prev) => prev.map((c) => (c.id === updatedCage.id ? updatedCage : c))); };
  const handleCageDeleted = (deletedCageId: number) => { setCages((prev) => prev.filter((c) => c.id !== deletedCageId)); };
  const handleHospitalizationCreated = (updatedCage: CageResponse) => { handleCageUpdated(updatedCage); setSelectedCage(null); setAdmitModalOpen(false); };


  const CageActions = ({ cage, isHeaderDark }: { cage: CageResponse; isHeaderDark: boolean }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={`h-8 w-8 p-0 absolute top-2 right-2 focus-visible:ring-offset-0 focus-visible:ring-2 focus-visible:ring-white/70 ${isHeaderDark ? 'text-white hover:bg-white/20' : 'text-muted-foreground hover:bg-gray-200'}`}>
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleOpenEditModal(cage)}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleOpenDeleteModal(cage)} disabled={cage.occupied} className="text-destructive focus:text-destructive focus:bg-red-50"><Trash2 className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const OccupiedCageCard = ({ cage }: { cage: CageResponse }) => {
    const hosp = cage.currentHospitalization!;
    if (!hosp || !hosp.cause) return null;

    const causeDetails = HospitalizationCauseDetails[hosp.cause];
    const speciesDetails = AnimalSpeciesDetails[hosp.animalBasicResponse.animalSpecies];
    const CauseIcon = causeDetails.icon;
    const SpeciesIcon = speciesDetails?.icon;

    const speciesColor = speciesDetails?.colorClass;
    const borderClass = speciesColor ? speciesColor.replace("bg-", "border-") : "border-border";
    const iconClass = speciesColor ? speciesColor.replace("bg-", "text-") : "text-muted-foreground";

    const latestVitalSign = hosp.latestVitalSign;
    const nextTreatment = hosp.nextTreatmentSchedule;
    const latestNote = hosp.latestEvolutionNote;

    const vitalParts = [
      latestVitalSign?.temperatureCelsius != null ? formatMeasurement(latestVitalSign.temperatureCelsius, "°C", 1) : null,
      latestVitalSign?.weightKg != null ? formatMeasurement(latestVitalSign.weightKg, " kg", 1) : null,
    ].filter(Boolean);
    const vitalSummary = vitalParts.length ? vitalParts.join(" · ") : "Sin registros";
    const vitalTooltip = latestVitalSign
      ? [
          latestVitalSign.temperatureCelsius != null ? `Temperatura: ${formatMeasurement(latestVitalSign.temperatureCelsius, "°C", 1)}` : null,
          latestVitalSign.weightKg != null ? `Peso: ${formatMeasurement(latestVitalSign.weightKg, " kg", 1)}` : null,
          latestVitalSign.heartRate != null ? `Frecuencia cardiaca: ${formatMeasurement(latestVitalSign.heartRate, " lpm")}` : null,
          latestVitalSign.respiratoryRate != null ? `Frecuencia respiratoria: ${formatMeasurement(latestVitalSign.respiratoryRate, " rpm")}` : null,
          latestVitalSign.recordedAt ? `Registrado: ${formatDateTime(latestVitalSign.recordedAt, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}` : null,
        ]
          .filter(Boolean)
          .join("\n")
      : "Aún no se registran signos vitales.";

    const nextTreatmentTimeShort = nextTreatment ? formatDateTime(nextTreatment.scheduledTime, { weekday: "short", hour: "2-digit", minute: "2-digit" }) : "";
    const nextTreatmentSummary = nextTreatment
      ? `${nextTreatmentTimeShort ? `${nextTreatmentTimeShort} · ` : ""}${truncateText(nextTreatment.treatmentName, 20)}`
      : "Sin pendientes";
    const nextTreatmentTooltip = nextTreatment
      ? `${nextTreatment.treatmentName}${
          nextTreatment.scheduledTime
            ? `\nProgramado para ${formatDateTime(nextTreatment.scheduledTime, {
                weekday: "long",
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}`
            : ""
        }`
      : "No hay tratamientos pendientes.";

    const latestNoteSummary = latestNote?.note ? truncateText(latestNote.note, 30) : "Sin notas";
    const latestNoteTooltip = latestNote
      ? `${latestNote.note}\n— ${latestNote.authorFullName}${
          latestNote.timestamp
            ? ` · ${formatDateTime(latestNote.timestamp, {
                weekday: "long",
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}`
            : ""
        }`
      : "No hay notas registradas.";

    const renderSummaryButton = (params: {
      icon: React.ReactNode;
      title: string;
      summary: string;
      tooltip: string;
    }) => (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            type="button"
            className="flex h-auto flex-col items-center gap-1 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {params.icon}
            <p className="text-xs font-semibold">{params.title}</p>
            <span className="text-[11px] leading-tight text-muted-foreground text-center">{params.summary}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs whitespace-pre-wrap text-sm">
          <p>{params.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    );

    return (
      <Card className="flex flex-col overflow-hidden shadow-sm bg-card rounded-lg pt-0 border-2">
        <div className={`relative flex items-center justify-between p-3 text-white ${causeDetails.colorClass}`}>
          <h3 className="font-bold text-lg">{cage.name}</h3>
          <CageActions cage={cage} isHeaderDark={true} />
        </div>

        <CardContent className="p-4 flex flex-col flex-grow">
          <div className="flex items-start gap-4 mb-4">
            {hosp.animalBasicResponse.animalPhotoUrl ? (
              <img
                src={hosp.animalBasicResponse.animalPhotoUrl}
                alt={hosp.animalBasicResponse.animalName}
                className="w-16 h-16 rounded-full object-cover border-2 border-border"
                loading="lazy"
              />
            ) : (
              <div
                className={`w-16 h-16 rounded-full border-2 bg-card flex items-center justify-center ${borderClass}`}
              >
                {SpeciesIcon ? (
                  <SpeciesIcon className={`h-8 w-8 ${iconClass}`} />
                ) : (
                  <PawPrint className={`h-8 w-8 ${iconClass}`} />
                )}
              </div>
            )}

            <div className="flex-grow">
              <h4 className="text-xl font-bold text-foreground">{hosp.animalBasicResponse.animalName}</h4>

              <div className="flex items-center gap-2 text-muted-foreground mt-1 text-sm">
                {SpeciesIcon && <SpeciesIcon className="h-5 w-5 text-muted-foreground" />}
                <span>
                  {speciesDetails ? speciesDetails.label : hosp.animalBasicResponse.animalSpecies} - {hosp.animalBasicResponse.animalBreed || "Mestizo"}
                </span>
              </div>

              {hosp.clinicalServiceName ? (
                <div className="flex items-center gap-2 text-muted-foreground mt-1 text-sm h-5">
                  <BriefcaseMedical className="h-5 w-5 text-muted-foreground" />
                  <span className="truncate">{hosp.clinicalServiceName}</span>
                </div>
              ) : (
                <div className="mt-1 h-5" />
              )}

            </div>
          </div>

          <div className="space-y-2 mb-4 ml-12">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${causeDetails.colorClass} text-white`}>
              <CauseIcon className="mr-2" />
              {causeDetails.label}
            </div>
            <p className="text-sm text-muted-foreground">{formatAdmissionTime(hosp.admissionDate)}</p>
          </div>

          <TooltipProvider delayDuration={150}>
            <div className="grid grid-cols-3 gap-2 my-4">
              {renderSummaryButton({
                icon: <HeartPulse className="h-5 w-5" />,
                title: "Signos Vitales",
                summary: vitalSummary,
                tooltip: vitalTooltip,
              })}
              {renderSummaryButton({
                icon: <Pill className="h-5 w-5" />,
                title: "Medicar",
                summary: nextTreatmentSummary,
                tooltip: nextTreatmentTooltip,
              })}
              {renderSummaryButton({
                icon: <ClipboardEdit className="h-5 w-5" />,
                title: "Nota",
                summary: latestNoteSummary,
                tooltip: latestNoteTooltip,
              })}
            </div>
          </TooltipProvider>

          <div className="mt-auto pt-4 border-t border-border">
            <Link href={`/dashboard/clinical/hospitalization/${hosp.id}`} className="w-full">
              <Button variant="outline" className="w-full text-muted-foreground font-semibold">
                <FileText className="mr-2 h-4 w-4" /> Ver Ficha Completa
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  };


  const EmptyCageCard = ({ cage }: { cage: CageResponse }) => (
    <Card
      className="group flex cursor-pointer flex-col overflow-hidden rounded-lg border-2 border-dashed border-border bg-card transition-colors duration-300 hover:border-emerald-400 pt-0"
      onClick={() => handleOpenAdmitModal(cage)}
    >
      <div className={`relative flex items-center justify-between p-3 text-white`}>
        <h3 className="font-semibold text-lg">{cage.name}</h3>
        <CageActions cage={cage} isHeaderDark={true} />
      </div>

      <CardContent className="flex flex-grow flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-border transition-colors duration-300 group-hover:border-emerald-400">
          <DoorOpen className="h-12 w-12 text-muted-foreground transition-colors duration-300 group-hover:text-emerald-500" />
        </div>

        <p className="text-xl font-medium text-muted-foreground">
          Disponible
        </p>
        <p className="text-sm text-muted-foreground">{CageSizeLabels[cage.size]}</p>
      </CardContent>
    </Card>
  );

  if (loading) return <div>Cargando tablero de hospitalización...</div>;

  return (
    <DashboardLayoutSection>
      <div className="h-full overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-4">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Tablero de Hospitalización</h1>
              <p className="text-sm text-muted-foreground">Estado en tiempo real de las jaulas y pacientes internados.</p>
            </div>
            <Button onClick={() => setAddCageModalOpen(true)} >
              <PlusCircle className="mr-2 h-4 w-4" /> Agregar Jaula
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
            {cages.map((cage) => (cage.occupied ? <OccupiedCageCard key={cage.id} cage={cage} /> : <EmptyCageCard key={cage.id} cage={cage} />))}
          </div>
        </div>

        {isAdmitModalOpen && selectedCage && <NewHospitalizationModal open={isAdmitModalOpen} onOpenChange={setAdmitModalOpen} cage={selectedCage} onSuccess={handleHospitalizationCreated} />}
        <NewCageModal open={isAddCageModalOpen} onOpenChange={setAddCageModalOpen} onSuccess={handleCageCreated} />
        <EditCageModal open={isEditCageModalOpen} onOpenChange={setEditCageModalOpen} onSuccess={handleCageUpdated} cageToEdit={cageToEdit} />
        <DeleteCageModal open={isDeleteCageModalOpen} onOpenChange={setDeleteCageModalOpen} onSuccess={handleCageDeleted} cageToDelete={cageToDelete} />
      </div>
    </DashboardLayoutSection>
  );
}
