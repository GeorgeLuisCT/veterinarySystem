"use client";

import { ReportCollection } from "@/types/reporting";
import { Card } from "@/components/ui/card";
import { ReportBreakdownCard } from "./report-breakdown-card";
import { ReportTimelineCard } from "./report-timeline-card";
import { MetricHighlightCard } from "./metric-highlight-card";
import { ReportDistributionChart } from "./report-distribution-chart";
import { ReportHorizontalBarsCard } from "./report-horizontal-bars-card";
import { ReportInsightsCard } from "./report-insights-card";

type ModuleDetailPanelProps = {
  collection?: ReportCollection;
};

export function ModuleDetailPanel({ collection }: ModuleDetailPanelProps) {
  if (!collection) {
    return (
      <Card className="border border-dashed border-border/70 shadow-none h-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Selecciona un módulo para ver el detalle.</p>
      </Card>
    );
  }

  const [primaryBreakdown, secondaryBreakdown, ...remainingBreakdowns] = collection.breakdowns;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-semibold">{collection.title}</h3>
        {collection.description && <p className="text-sm text-muted-foreground">{collection.description}</p>}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {collection.metrics.map((metric, index) => (
          <MetricHighlightCard key={metric.key} metric={metric} timeline={collection.timeline} colorIndex={index} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ReportTimelineCard title="Serie temporal" series={collection.timeline} />
        </div>
        <div className="lg:col-span-5">
          <ReportInsightsCard collection={collection} />
        </div>
      </div>
      {(primaryBreakdown || secondaryBreakdown) && (
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <ReportDistributionChart group={primaryBreakdown} />
          </div>
          <div className="lg:col-span-7">
            <ReportHorizontalBarsCard group={secondaryBreakdown ?? primaryBreakdown} />
          </div>
        </div>
      )}
      {remainingBreakdowns.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {remainingBreakdowns.map((group) => (
            <ReportBreakdownCard key={group.key} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}
