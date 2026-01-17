"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { subDays } from "date-fns";

import DashboardLayoutSection from "../dashboard-layout-section";
import { useUser } from "@/context/user-context";
import { ReportsFilterCard } from "./components/reports-filter-card";
import { ReportsDashboardView } from "./components/reports-dashboard-view";
import { fetchReportsDashboard } from "@/services/reporting/reporting-service";
import { ReportModule, ReportsDashboard, ReportsFiltersState } from "@/types/reporting";
import { UserInfo } from "@/app/dashboard/security/users/types/user-info";

const DEFAULT_RANGE = {
  from: subDays(new Date(), 29),
  to: new Date(),
};

export default function ReportsPage() {
  const { userInfo } = useUser();
  const [filters, setFilters] = useState<ReportsFiltersState>(() => buildDefaultFilters(userInfo));
  const [dashboard, setDashboard] = useState<ReportsDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<ReportModule>(ReportModule.SALES);

  const filtersKey = useMemo(
    () =>
      JSON.stringify({
        ...filters,
        dateRange: {
          from: filters.dateRange?.from?.toISOString(),
          to: filters.dateRange?.to?.toISOString(),
        },
      }),
    [filters],
  );

  useEffect(() => {
    setFilters(buildDefaultFilters(userInfo));
  }, [userInfo]);

  const loadDashboard = useCallback(
    async (currentFilters: ReportsFiltersState) => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchReportsDashboard(currentFilters);
        setDashboard(result);
        if (!result.collections.some((collection) => collection.module === selectedModule)) {
          setSelectedModule(result.collections[0]?.module ?? ReportModule.SALES);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "No se pudieron cargar los reportes.";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [selectedModule],
  );

  useEffect(() => {
    loadDashboard(filters);
  }, [filtersKey, filters, loadDashboard]);

  const handleRefresh = () => loadDashboard(filters);

  const handleReset = () => {
    const next = buildDefaultFilters(userInfo);
    setFilters(next);
    setSelectedModule(ReportModule.SALES);
  };

  return (
    <DashboardLayoutSection>
      <div className="flex flex-col gap-2">
        <ReportsFilterCard
          filters={filters}
          onFiltersChange={setFilters}
          onRefresh={handleRefresh}
          onReset={handleReset}
          loading={loading}
          branches={userInfo?.branches ?? []}
        />
        <ReportsDashboardView
          dashboard={dashboard}
          loading={loading}
          error={error}
          selectedModule={selectedModule}
          onSelectModule={setSelectedModule}
        />
      </div>
    </DashboardLayoutSection>
  );
}

function buildDefaultFilters(userInfo: UserInfo | null | undefined): ReportsFiltersState {
  const preferredBranch = userInfo?.selectedBranch?.id ? [userInfo.selectedBranch.id] : [];
  return {
    branchIds: preferredBranch,
    dateRange: DEFAULT_RANGE,
    statuses: [],
    modules: Object.values(ReportModule),
  };
}
