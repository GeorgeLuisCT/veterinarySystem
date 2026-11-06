"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportCollection } from "@/types/reporting";
import { Award, ArrowDownRight, ArrowUpRight, Activity } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type ReportInsightsCardProps = {
  collection: ReportCollection;
};

export function ReportInsightsCard({ collection }: ReportInsightsCardProps) {
  const metricsWithTrend = collection.metrics.filter((metric) => typeof metric.trend === "number");
  const improvingMetric = metricsWithTrend.filter((metric) => (metric.trend ?? 0) > 0).sort(
    (a, b) => (b.trend ?? 0) - (a.trend ?? 0),
  )[0];
  const slippingMetric = metricsWithTrend.filter((metric) => (metric.trend ?? 0) < 0).sort(
    (a, b) => (a.trend ?? 0) - (b.trend ?? 0),
  )[0];

  const breakdownItems = collection.breakdowns.flatMap((group) => group.items ?? []);
  const topPerformer = breakdownItems
    .filter((item) => typeof item.value === "number")
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))[0];
  const lowerPerformerCandidate = breakdownItems
    .filter((item) => typeof item.value === "number")
    .sort((a, b) => (a.value ?? 0) - (b.value ?? 0))[0];
  const lowerPerformer =
    lowerPerformerCandidate && topPerformer && lowerPerformerCandidate.label === topPerformer.label
      ? undefined
      : lowerPerformerCandidate;

  const insights = [
    improvingMetric && {
      icon: ArrowUpRight,
      title: improvingMetric.label,
      description: `${(improvingMetric.trend! * 100).toFixed(1)}% por encima del periodo comparable.`,
      accent: "text-success-strong",
    },
    slippingMetric && {
      icon: ArrowDownRight,
      title: slippingMetric.label,
      description: `${Math.abs(slippingMetric.trend! * 100).toFixed(1)}% por debajo del periodo anterior.`,
      accent: "text-destructive",
    },
    topPerformer && {
      icon: Award,
      title: topPerformer.label,
      description: `Mejor contribución con ${topPerformer.formattedValue ?? topPerformer.value?.toLocaleString()}.`,
      accent: "text-primary",
    },
    lowerPerformer && {
      icon: Activity,
      title: lowerPerformer.label,
      description: `Menor impacto registrado (${lowerPerformer.formattedValue ?? lowerPerformer.value?.toLocaleString()}).`,
      accent: "text-muted-foreground",
    },
  ].filter(Boolean) as {
    icon: LucideIcon;
    title: string;
    description: string;
    accent: string;
  }[];

  return (
    <Card className="h-full border border-border/70 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Insights clave</CardTitle>
        <p className="text-xs text-muted-foreground">
          Interpretaciones automáticas generadas a partir de tendencias y comparativos.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Aún no hay suficientes datos para generar insights automáticos.
          </p>
        )}
        {insights.map((insight) => {
          const Icon = insight.icon;
          return (
            <div key={insight.title} className="flex items-start gap-3 rounded-lg border border-border/50 p-3">
              <div className={`rounded-full bg-muted p-2 ${insight.accent}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">{insight.title}</p>
                <p className="text-xs text-muted-foreground">{insight.description}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
