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
        <Button variant="ghost" className={`h-8 w-8 p-0 absolute top-2 right-2 focus-visible:ring-offset-0 focus-visible:ring-2 focus-visible:ring-white/70 ${isHeaderDark ? 'text-white hover:bg-white/20' : 'text-gray-500 hover:bg-gray-200'}`}>
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleOpenEditModal(cage)}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleOpenDeleteModal(cage)} disabled={cage.occupied} className="text-red-600 focus:text-red-600 focus:bg-red-50"><Trash2 className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem>
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
    const borderClass = speciesColor ? speciesColor.replace("bg-", "border-") : "border-gray-200";
    const iconClass = speciesColor ? speciesColor.replace("bg-", "text-") : "text-gray-400";

    return (
      <Card className="flex flex-col overflow-hidden shadow-md bg-white rounded-lg pt-0 border-2">
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
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                loading="lazy"
              />
            ) : (
              <div
                className={`w-16 h-16 rounded-full border-2 bg-white flex items-center justify-center ${borderClass}`}
              >
                {SpeciesIcon ? (
                  <SpeciesIcon className={`h-8 w-8 ${iconClass}`} />
                ) : (
                  <PawPrint className={`h-8 w-8 ${iconClass}`} />
                )}
              </div>
            )}

            <div className="flex-grow">
              <h4 className="text-xl font-bold text-gray-800">{hosp.animalBasicResponse.animalName}</h4>

              <div className="flex items-center gap-2 text-gray-600 mt-1 text-sm">
                {SpeciesIcon && <SpeciesIcon className="h-5 w-5 text-gray-500" />}
                <span>
                  {speciesDetails ? speciesDetails.label : hosp.animalBasicResponse.animalSpecies} - {hosp.animalBasicResponse.animalBreed || "Mestizo"}
                </span>
              </div>

              {hosp.clinicalServiceName ? (
                <div className="flex items-center gap-2 text-gray-600 mt-1 text-sm h-5">
                  <BriefcaseMedical className="h-5 w-5 text-gray-500" />
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
            <p className="text-sm text-gray-500">{formatAdmissionTime(hosp.admissionDate)}</p>
          </div>

          <div className="grid grid-cols-3 gap-2 my-4">
            <Button variant="outline" size="sm" className="flex-col h-auto py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900">
              <HeartPulse className="h-5 w-5 mb-1" />Signos Vitales
            </Button>
            <Button variant="outline" size="sm" className="flex-col h-auto py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900">
              <Pill className="h-5 w-5 mb-1" />Medicar
            </Button>
            <Button variant="outline" size="sm" className="flex-col h-auto py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900">
              <ClipboardEdit className="h-5 w-5 mb-1" />Nota
            </Button>
          </div>

          <div className="mt-auto pt-4 border-t border-gray-100">
            <Link href={`/dashboard/clinical/hospitalization/${hosp.id}`} className="w-full">
              <Button variant="outline" className="w-full text-gray-700 font-semibold">
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
      className="group flex cursor-pointer flex-col overflow-hidden rounded-lg border-2 border-dashed border-slate-300 bg-white transition-colors duration-300 hover:border-emerald-400 pt-0"
      onClick={() => handleOpenAdmitModal(cage)}
    >
      <div className={`relative flex items-center justify-between p-3 text-white`}>
        <h3 className="font-semibold text-lg">{cage.name}</h3>
        <CageActions cage={cage} isHeaderDark={true} />
      </div>

      <CardContent className="flex flex-grow flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-slate-300 transition-colors duration-300 group-hover:border-emerald-400">
          <DoorOpen className="h-12 w-12 text-slate-400 transition-colors duration-300 group-hover:text-emerald-500" />
        </div>

        <p className="text-xl font-medium text-slate-600">
          Disponible
        </p>
        <p className="text-sm text-slate-500">{CageSizeLabels[cage.size]}</p>
      </CardContent>
    </Card>
  );

  if (loading) return <div>Cargando tablero de hospitalización...</div>;

  return (
    <DashboardLayoutSection>
      <div className="h-full bg-gray-50 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Tablero de Hospitalización</h1>
              <p className="text-gray-600 mt-1">Estado en tiempo real de las jaulas y pacientes internados.</p>
            </div>
            <Button onClick={() => setAddCageModalOpen(true)} >
              <PlusCircle className="mr-2 h-4 w-4" /> Agregar Jaula
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
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