"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { ReportModule, ReportsDashboard } from "@/types/reporting";
import { ModuleSummaryStrip } from "./module-summary-strip";
import { ModuleDetailPanel } from "./module-detail-panel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ReportsDashboardViewProps = {
  dashboard?: ReportsDashboard | null;
  loading?: boolean;
  error?: string | null;
  selectedModule: ReportModule;
  onSelectModule: (module: ReportModule) => void;
};

export function ReportsDashboardView({
  dashboard,
  loading,
  error,
  selectedModule,
  onSelectModule,
}: ReportsDashboardViewProps) {
  if (loading && !dashboard) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-[420px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Dialog open={true}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>No se pudo cargar el dashboard</DialogTitle>
            <DialogDescription>{error}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  if (!dashboard) {
    return (
      <Dialog open={true}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sin información</DialogTitle>
            <DialogDescription>
              Selecciona filtros y actualiza para generar los reportes.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const collections = dashboard.collections;
  const selected =
    collections.find((collection) => collection.module === selectedModule) ??
    collections[0];

  return (
    <div className="space-y-6">
      <ModuleSummaryStrip
        collections={collections}
        selectedModule={selected?.module ?? selectedModule}
        onSelect={onSelectModule}
      />
      <ModuleDetailPanel collection={selected} />
    </div>
  );
}