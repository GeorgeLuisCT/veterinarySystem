"use client";

import * as React from "react";
import { PlusCircle, BriefcaseMedical, PawPrint, HelpingHand, TimerIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import PaginatedCardList from "@/components/paginated-card-list";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/context/user-context";
import { PaginatedResponse } from "@/types/paginated-response";
import { getAaxiosErrorMessage } from "@/helpers/error";

import AttentionService from "../service/attention-service";
import type { AttentionResponse } from "../types/attention-response";
import { AttentionType, AttentionTypeLabels, AttentionTypeOptions } from "../enums/attention-type";
import { AttentionTypeDetails } from "../enums/attention-type";
import { AttentionStatusDetails } from "../enums/attention-status";
import { NewAttentionModal } from "../components/new-attention-modal";
import { Card, CardContent } from "@/components/ui/card";
import DashboardLayoutSection from "../../dashboard-layout-section";
import { AnimalSpeciesDetails } from "../../patients/animals/enums/animal-species";
import { formatCheckInTime } from "@/utils/farmated-dates";
import { FaUserMd } from "react-icons/fa";

const CARD_EMERGENCY_CLASS = "ring-2 ring-red-400/70 bg-red-50/70";

const attendUrlByType: Record<AttentionType, (id: number) => string> = {
  [AttentionType.CLINIC]: (id) => `/dashboard/clinical/consultory/${id}`,
  [AttentionType.GROOMING]: (id) => `/dashboard/grooming/board/${id}`,
  [AttentionType.SURGERY]: (id) => `/dashboard/clinical/operating-room/${id}`,
};

export default function AttentionsPage() {
  const { toast } = useToast();
  const { userInfo } = useUser();
  const router = useRouter();

  const selectedBranchId = userInfo?.selectedBranch?.id ?? null;
  const branchFilter = selectedBranchId && selectedBranchId > 0 ? selectedBranchId : undefined;

  const [activeType, setActiveType] = React.useState<AttentionType>(AttentionType.CLINIC);
  const [pageData, setPageData] = React.useState<PaginatedResponse<AttentionResponse> | null>(null);
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [loading, setLoading] = React.useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);

  const handleAttend = React.useCallback(
    (attention: AttentionResponse) => {
      const getUrl = attendUrlByType[attention.type];
      const url = getUrl(attention.id);
      router.push(url);
    },
    [router]
  );

  const fetchAttentions = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await AttentionService.list({
        page: pageIndex,
        size: pageSize,
        type: activeType,
        branchId: branchFilter,
      });
      setPageData(response);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: getAaxiosErrorMessage(error) ?? "No se pudieron cargar las atenciones.",
      });
    } finally {
      setLoading(false);
    }
  }, [activeType, branchFilter, pageIndex, pageSize, toast]);

  React.useEffect(() => {
    fetchAttentions();
  }, [fetchAttentions]);

  const handleTypeChange = React.useCallback((value: string) => {
    setActiveType(value as AttentionType);
    setPageIndex(0);
  }, []);

  const handlePageSizeChange = React.useCallback((size: number) => {
    setPageSize(size);
    setPageIndex(0);
  }, []);

  const handleAttentionCreated = React.useCallback(
    (attention: AttentionResponse) => {
      const isDifferentType = attention.type !== activeType;
      if (isDifferentType) {
        setActiveType(attention.type);
        setPageIndex(0);
        return;
      }
      if (pageIndex !== 0) {
        setPageIndex(0);
        return;
      }
      void fetchAttentions();
    },
    [activeType, fetchAttentions, pageIndex]
  );

  const openCreateModal = React.useCallback(() => setIsCreateModalOpen(true), []);

  const renderCard = React.useCallback(
    (attention: AttentionResponse) => {
      const statusDetails = AttentionStatusDetails[attention.status];
      const speciesDetails = AnimalSpeciesDetails[attention.animalBasicResponse.animalSpecies];
      const StatusIcon = statusDetails.icon;
      const SpeciesIcon = speciesDetails?.icon;

      const statusColor = statusDetails?.colorClass;
      const speciesColor = speciesDetails?.colorClass;

      const borderCardClass = statusColor ? statusColor.replace("bg-", "border-") : "border-gray-200";
      const borderIconClass = speciesColor ? speciesColor.replace("bg-", "border-") : "border-gray-200";
      const iconSpeciesClass = speciesColor ? speciesColor.replace("bg-", "text-") : "text-gray-400";

      return (
        <Card className={`flex flex-col overflow-hidden shadow-md bg-white rounded-lg pt-0 border-2 border-l-8 ${borderCardClass}`}>
          <CardContent className="p-4 flex flex-col gap-4 pb-0">
            <div className="flex items-start gap-4">
              {attention.animalBasicResponse.animalPhotoUrl ? (
                <img
                  src={attention.animalBasicResponse.animalPhotoUrl}
                  alt={attention.animalBasicResponse.animalName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                  loading="lazy"
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
                    {speciesDetails ? speciesDetails.label : attention.animalBasicResponse.animalSpecies} -{" "}
                    {attention.animalBasicResponse.animalBreed || "Mestizo"}
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
                  Llegada hace :
                  <span className="text-sm font-normal text-gray-500"> {formatCheckInTime(attention.checkInTime)}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <FaUserMd className={`h-5 w-5 text-gray-500`} />
                <p className="text-sm font-semibold text-gray-600">
                  Asignado a :
                  <span className="text-sm font-normal text-gray-500"> {attention.attendingEmployeeFullName}</span>
                </p>
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-gray-100">
              <Button variant="outline" onClick={() => handleAttend(attention)} className="w-full text-gray-700 font-semibold">
                <HelpingHand className="mr-2 h-4 w-4" />
                Atender
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    },
    [handleAttend]
  );

  const emptyStateMessage = React.useMemo(
    () => `No hay atenciones registradas para ${AttentionTypeLabels[activeType].toLowerCase()}.`,
    [activeType]
  );

  return (
    <DashboardLayoutSection>
      <div className="h-full bg-gray-50 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto h-full flex flex-col">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Atenciones</h1>
              <p className="text-gray-600 mt-1">Gestiona las atenciones en curso y revisa el flujo de pacientes por tipo.</p>
            </div>
            <Button onClick={() => openCreateModal()}>
              <PlusCircle className="mr-2 h-4 w-4" /> Nueva Atención
            </Button>
          </div>

          <Tabs value={activeType} onValueChange={handleTypeChange} className="space-y-4 flex-1">
            <TabsList className="grid grid-cols-3 w-full sm:w-auto">
              {AttentionTypeOptions.map((option) => {
                const details = AttentionTypeDetails[option.value as AttentionType];
                const Icon = details.icon;
                return (
                  <TabsTrigger
                    key={option.value}
                    value={option.value}
                    className="gap-2 data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-slate-300"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{option.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {AttentionTypeOptions.map((option) => (
              <TabsContent key={option.value} value={option.value} className="focus-visible:outline-none">
                {option.value === activeType && (
                  <PaginatedCardList
                    pageData={pageData}
                    pageIndex={pageIndex}
                    pageSize={pageSize}
                    onPageIndexChange={setPageIndex}
                    onPageSizeChange={handlePageSizeChange}
                    loading={loading}
                    renderCard={renderCard}
                    cardHighlightBy={(attention) => attention.emergency}
                    cardHighlightClassName={CARD_EMERGENCY_CLASS}
                    getItemKey={(attention) => attention.id}
                    emptyState={emptyStateMessage}
                  />
                )}
              </TabsContent>
            ))}
          </Tabs>

          <NewAttentionModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} onCreated={handleAttentionCreated} />
        </div>
      </div>
    </DashboardLayoutSection>
  );
}
