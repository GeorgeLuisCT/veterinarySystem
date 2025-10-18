"use client";

import React, { useState, useEffect, useCallback } from "react";
import { BedDouble, PlusCircle, FileText } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/context/user-context";
import { CageResponse, CurrentHospitalizationBrief } from "@/app/dashboard/clinical/types/cage-response";
import CageService from "@/app/dashboard/clinical/service/cage-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";
import { HospitalizationStatusColors, HospitalizationStatusLabels } from "../enums/hospitalization-status";
import { NewHospitalizationModal } from "../components/hospitalization/new-hospitalization-modal";
import { HospitalizationCauseLabels } from "../enums/hospitalization-cause";
import { AdmissionTimingLabels } from "../enums/admission-timing";

export default function HospitalizationBoardPage() {
  const { userInfo } = useUser();
  const { toast } = useToast();
  const [cages, setCages] = useState<CageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmitModalOpen, setAdmitModalOpen] = useState(false);
  const [selectedCage, setSelectedCage] = useState<CageResponse | null>(null);

  const fetchBoardData = useCallback(async () => {
    if (!userInfo?.selectedBranch?.id) return;

    setLoading(true);
    try {
      const cageRes = await CageService.list({ branchId: userInfo.selectedBranch.id, pageSize: 100 });
     console.log(cageRes);
      setCages(cageRes.content);


    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: getAaxiosErrorMessage(error) ?? "No se pudo cargar el tablero de hospitalización.",
      });
    } finally {
      setLoading(false);
    }
  }, [userInfo?.selectedBranch?.id, toast]);

  useEffect(() => {
    fetchBoardData();
  }, [fetchBoardData]);

  const handleOpenAdmitModal = (cage: CageResponse) => {
    setSelectedCage(cage);
    setAdmitModalOpen(true);
  };

  const handleHospitalizationCreated = () => {
    fetchBoardData();
  };

  const OccupiedCageCard = ({ hosp }: { hosp: CurrentHospitalizationBrief }) => {
    const style = HospitalizationStatusColors[hosp.status];
    return (
      <Card className={`flex flex-col border-l-8 ${style.color}`}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{hosp.animalName}</CardTitle>
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
              {HospitalizationStatusLabels[hosp.status]}
            </span>
          </div>
          <div className="mt-1 text-xs text-gray-500 space-y-0.5">
            <p>
              {hosp.cause ? HospitalizationCauseLabels[hosp.cause] : "—"} • {AdmissionTimingLabels[hosp.admissionTiming]}
            </p>
            <p>{hosp.clinicalServiceName ?? "—"}</p>
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-sm text-gray-700">Admitido: {new Date(hosp.admissionDate).toLocaleString()}</p>
        </CardContent>
        <div className="bg-gray-50 px-4 py-3 rounded-b-xl">
          <Link href={`/dashboard/clinical/hospitalization/${hosp.id}`} className="w-full">
            <Button variant="outline" size="sm" className="w-full">
              <FileText className="mr-2 h-4 w-4" /> Ver Ficha
            </Button>
          </Link>
        </div>
      </Card>
    );
  };

  const EmptyCageCard = ({ cage }: { cage: CageResponse }) => (
    <Card className="border-dashed border-2 flex flex-col items-center justify-center min-h-[180px]">
      <div className="text-center text-gray-400">
        <BedDouble className="mx-auto h-8 w-8 mb-2" />
        <p className="font-semibold">{cage.name}</p>
        <p className="text-sm">{cage.size}</p>
        <Button variant="ghost" className="mt-2 text-blue-600" onClick={() => handleOpenAdmitModal(cage)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Admitir Paciente
        </Button>
      </div>
    </Card>
  );

  if (loading) return <div>Cargando...</div>;

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900">Tablero de Hospitalización</h1>
            <p className="text-gray-600 mt-1">Estado en tiempo real de las jaulas y pacientes internados.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {cages.map((cage) =>
              cage.occupied && cage.currentHospitalization ? (
                <OccupiedCageCard key={cage.id} hosp={cage.currentHospitalization} />
              ) : (
                <EmptyCageCard key={cage.id} cage={cage} />
              )
            )}
          </div>
        </div>

        {isAdmitModalOpen && selectedCage && (
          <NewHospitalizationModal
            open={isAdmitModalOpen}
            onOpenChange={setAdmitModalOpen}
            cage={selectedCage}
            onSuccess={handleHospitalizationCreated}
          />
        )}
      </div>
    </>
  );
}
