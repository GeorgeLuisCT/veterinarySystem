// app/dashboard/clinical/attentions/page.tsx
"use client";

import * as React from "react";
import { PlusCircle } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import PaginatedCardList from "@/components/paginated-card-list";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/context/user-context";
import DashboardLayoutSection from "../../dashboard-layout-section";
import { PaginatedResponse } from "@/types/paginated-response";
import { getAaxiosErrorMessage } from "@/helpers/error";

import AttentionService from "../service/attention-service";
import type { AttentionResponse } from "../types/attention-response";
import { AttentionType } from "../enums/attention-type";
import AttentionFilters from "../components/attentions/attention-filters";
import AttentionCard from "../components/attentions/attention-card";
import NewAttentionModal from "../components/new-attention-modal";
import { AttentionStatus } from "../enums/attention-status";
import { PageContainer } from "@/components/page/page-container";

const CARD_EMERGENCY_CLASS = "bg-red-100/70";

const attendUrlByType: Record<AttentionType, (id: number) => string> = {
  [AttentionType.CLINIC]: (id) => `/dashboard/clinical/consultory/${id}`,
  [AttentionType.GROOMING]: (id) => `/dashboard/grooming/${id}`,
  [AttentionType.SURGERY]: (id) => `/dashboard/clinical/operating-room/${id}`,
};

const formatLocalDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const toDateParam = (v?: string | Date | null): string | undefined => {
  if (!v) return undefined;
  return v instanceof Date ? formatLocalDate(v) : v;
};

const parseLocalDate = (v?: string | null): Date | null => {
  if (!v) return null;
  const [yStr, mStr, dStr] = v.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);
  if (!y || !m || !d) return null;
  const dt = new Date();
  dt.setFullYear(y, m - 1, d);
  dt.setHours(0, 0, 0, 0);
  return dt;
};

export default function AttentionsPage() {
  const { toast } = useToast();
  const { userInfo } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedBranchId = userInfo?.selectedBranch?.id || undefined;
  const branchFilter = selectedBranchId && selectedBranchId > 0 ? selectedBranchId : undefined;

  const today = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const emergencyParam = searchParams.get("emergency");
  const emergencyInit: boolean | "ALL" =
    emergencyParam === null ? "ALL" : emergencyParam === "true";

  const [filters, setFilters] = React.useState<{
    type: AttentionType | "ALL";
    status: string | "ALL";
    emergency: boolean | "ALL";
    startDate?: string | Date | null;
    endDate?: string | Date | null;
  }>(() => ({
    type: (searchParams.get("type") as AttentionType | "ALL") ?? "ALL",
    status: (searchParams.get("status") as string | "ALL") ?? "ALL",
    emergency: emergencyInit,
    startDate: parseLocalDate(searchParams.get("startDate")) ?? today,
    endDate: parseLocalDate(searchParams.get("endDate")) ?? today,
  }));

  const [pageData, setPageData] = React.useState<PaginatedResponse<AttentionResponse> | null>(null);
  const [pageIndex, setPageIndex] = React.useState<number>(Number(searchParams.get("page") ?? 0));
  const [pageSize, setPageSize] = React.useState<number>(Number(searchParams.get("size") ?? 10));
  const [loading, setLoading] = React.useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);

  const syncUrl = React.useCallback(
    (nextFilters = filters, nextPageIndex = pageIndex, nextPageSize = pageSize) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.set("page", String(nextPageIndex));
      params.set("size", String(nextPageSize));

      if (nextFilters.type === "ALL") params.delete("type");
      else params.set("type", String(nextFilters.type));

      if (nextFilters.status === "ALL") params.delete("status");
      else params.set("status", String(nextFilters.status));

      if (nextFilters.emergency === "ALL") params.delete("emergency");
      else params.set("emergency", String(nextFilters.emergency));

      const s = toDateParam(nextFilters.startDate);
      const e = toDateParam(nextFilters.endDate);
      if (s) params.set("startDate", s);
      else params.delete("startDate");
      if (e) params.set("endDate", e);
      else params.delete("endDate");

      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [filters, pageIndex, pageSize, pathname, router, searchParams]
  );

  const handleAttend = React.useCallback(
    (attention: AttentionResponse) => {
      const getUrl = attendUrlByType[attention.type as AttentionType];
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
        type: filters.type === "ALL" ? undefined : (filters.type as AttentionType),
        status: filters.status === "ALL" ? undefined : (filters.status as AttentionStatus),
        emergency: filters.emergency === "ALL" ? undefined : (filters.emergency as boolean),
        startDate: toDateParam(filters.startDate),
        endDate: toDateParam(filters.endDate),
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
  }, [pageIndex, pageSize, filters, branchFilter, toast]);

  React.useEffect(() => {
    fetchAttentions();
  }, [fetchAttentions]);

  React.useEffect(() => {
    syncUrl();
  }, [filters, pageIndex, pageSize, syncUrl]);

  const handlePageSizeChange = React.useCallback((size: number) => {
    setPageSize(size);
    setPageIndex(0);
  }, []);

  const handleAttentionCreated = React.useCallback(
    (attention: AttentionResponse) => {
      setFilters((prev) => ({
        ...prev,
        type: prev.type === "ALL" ? "ALL" : attention.type,
      }));
      setPageIndex(0);
      fetchAttentions();
    },
    [fetchAttentions]
  );

  const openCreateModal = React.useCallback(() => setIsCreateModalOpen(true), []);

  return (
    <DashboardLayoutSection>
      <PageContainer>
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Recepción</h1>
            <p className="text-sm text-muted-foreground">
              Gestiona las recepciones en curso y revisa el flujo de pacientes.
            </p>
          </div>
          <Button onClick={() => openCreateModal()}>
            <PlusCircle className="mr-2 h-4 w-4" /> Nueva Recepción
          </Button>
        </div>

        <PaginatedCardList
          pageData={pageData}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPageIndexChange={(p) => {
            setPageIndex(p);
          }}
          onPageSizeChange={handlePageSizeChange}
          loading={loading}
          headerSlotLeft={
            <AttentionFilters
              value={filters}
              onChange={(next) => {
                setFilters(next);
                setPageIndex(0);
              }}
            />
          }
          renderCard={(attention) => (
            <AttentionCard
              attention={attention}
              onAttend={handleAttend}
              highlightClassName={attention.emergency ? CARD_EMERGENCY_CLASS : undefined}
            />
          )}
          cardHighlightBy={(attention) => attention.emergency}
          cardHighlightClassName={CARD_EMERGENCY_CLASS}
          getItemKey={(attention) => attention.id}
          emptyState={"No hay atenciones para los filtros seleccionados."}
        />

        <NewAttentionModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onCreated={handleAttentionCreated}
        />
      </PageContainer>
    </DashboardLayoutSection>
  );
}
