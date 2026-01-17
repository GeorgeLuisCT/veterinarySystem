"use client";

import { Card } from "@/components/ui/card";
import { ReportCollection, ReportModule } from "@/types/reporting";
import { cn } from "@/lib/utils";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

type ModuleSummaryStripProps = {
  collections: ReportCollection[];
  selectedModule: ReportModule;
  onSelect: (module: ReportModule) => void;
};

export function ModuleSummaryStrip({ collections, selectedModule, onSelect }: ModuleSummaryStripProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {collections.map((collection) => {
        const metric = collection.metrics[0];
        const sparkline = collection.timeline?.slice(-10) ?? [];
        const trend =
          typeof metric?.trend === "number"
            ? metric?.trend
            : sparkline.length > 1 && sparkline[0].value !== 0
              ? (sparkline[sparkline.length - 1].value - sparkline[0].value) / sparkline[0].value
              : null;
        const TrendIcon =
          trend !== null ? (trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus) : metric?.trendLabel ? Minus : null;

        return (
          <Card
            key={collection.module}
            role="button"
            aria-pressed={selectedModule === collection.module}
            onClick={() => onSelect(collection.module)}
            className={cn(
              "cursor-pointer border border-border/60 transition hover:border-primary/60",
              selectedModule === collection.module && "border-primary shadow-md",
            )}
          >
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">{collection.title}</p>
                {TrendIcon && trend !== null && (
                  <span
                    className={cn(
                      "flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      trend > 0 ? "bg-emerald-50 text-emerald-700" : trend < 0 ? "bg-red-50 text-red-600" : "bg-muted text-muted-foreground",
                    )}
                  >
                    <TrendIcon className="h-3 w-3" />
                    {(trend * 100).toFixed(1)}%
                  </span>
                )}
              </div>
              <p className="text-2xl font-semibold">
                {metric?.formattedValue ?? metric?.value?.toLocaleString() ?? "—"}
              </p>
              {metric?.label && <p className="text-xs text-muted-foreground">{metric.label}</p>}
              {trend === null && metric?.trendLabel && (
                <p className="text-[11px] text-muted-foreground">{metric.trendLabel}</p>
              )}
              <div className="h-12">
                {sparkline.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sparkline}>
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#2563eb"
                        fill="#dbeafe"
                        strokeWidth={2}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-muted-foreground">Sin historial.</p>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
