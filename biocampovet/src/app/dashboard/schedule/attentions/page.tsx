"use client";

import * as React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PaginatedCardList from "@/components/paginated-card-list";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/context/user-context";
import { PaginatedResponse } from "@/types/paginated-response";
import { getAaxiosErrorMessage } from "@/helpers/error";

import AttentionService from "../service/attention-service";
import type { AttentionResponse } from "../types/attention-response";
import { AttentionType, AttentionTypeLabels, AttentionTypeOptions } from "../enums/attention-type";
import { AttentionStatusLabels } from "../enums/attention-status";
import { NewAttentionModal } from "../components/new-attention-modal";

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

  const handleAttend = React.useCallback((attention: AttentionResponse) => {
    const getUrl = attendUrlByType[attention.type];
    const url = getUrl(attention.id);
    router.push(url);
  }, [router]);

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

  const renderCard = React.useCallback((attention: AttentionResponse) => {
    const checkInLabel = format(new Date(attention.checkInTime), "d MMM yyyy • HH:mm", { locale: es });
    const branchLocation = attention.branch.location?.trim();
    const branchLabel = branchLocation
      ? `${attention.branch.name} • ${branchLocation}`
      : attention.branch.name;

    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-foreground">{attention.animalName}</h3>
            <p className="text-sm text-muted-foreground">{attention.clinicalServiceName}</p>
            <p className="text-xs text-muted-foreground">
              Check-in: {checkInLabel} • {branchLabel}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Badge variant="secondary">{AttentionStatusLabels[attention.status]}</Badge>
            {attention.emergency && (
              <Badge className="bg-red-600 text-white">
                <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                Emergencia
              </Badge>
            )}
            <Button size="sm" onClick={() => handleAttend(attention)}>
              Atender
            </Button>
          </div>
        </div>

        <div className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
          <div className="flex flex-col gap-1">
            <span>
              <span className="font-medium text-foreground">Profesional:</span>{" "}
              {attention.attendingEmployeeFullName ?? "Sin asignar"}
            </span>
            {attention.appointmentId && (
              <span className="text-xs">
                Generada desde la cita #{attention.appointmentId}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }, [handleAttend]);

  const emptyStateMessage = React.useMemo(
    () => `No hay atenciones registradas para ${AttentionTypeLabels[activeType].toLowerCase()}.`,
    [activeType]
  );

  return (
    <>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Atenciones</h1>
          <p className="text-muted-foreground">
            Gestiona las atenciones en curso y revisa el flujo de pacientes por tipo.
          </p>
        </div>

        <Tabs value={activeType} onValueChange={handleTypeChange} className="space-y-4">
          <TabsList>
            {AttentionTypeOptions.map((option) => (
              <TabsTrigger key={option.value} value={option.value}>
                {option.label}
              </TabsTrigger>
            ))}
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
                  headerSlotRight={
                    <Button size="sm" onClick={openCreateModal}>
                      <Plus className="mr-2 h-4 w-4" />
                      Nueva atención
                    </Button>
                  }
                  cardHighlightBy={(attention) => attention.emergency}
                  cardHighlightClassName={CARD_EMERGENCY_CLASS}
                  getItemKey={(attention) => attention.id}
                  emptyState={emptyStateMessage}
                />
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <NewAttentionModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onCreated={handleAttentionCreated}
      />
    </>
  );
}