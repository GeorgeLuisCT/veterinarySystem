"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ReportMetric, ReportSeriesPoint } from "@/types/reporting";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const COLORS = ["#2563eb", "#0ea5e9", "#22c55e", "#f97316", "#a855f7", "#64748b"];

type MetricHighlightCardProps = {
  metric: ReportMetric;
  timeline?: ReportSeriesPoint[];
  colorIndex: number;
};

export function MetricHighlightCard({ metric, timeline = [], colorIndex }: MetricHighlightCardProps) {
  const chartPoints = useMemo(() => {
    if (!timeline.length) return [];
    return timeline.slice(-10).map((point) => ({ ...point }));
  }, [timeline]);

  const trend = typeof metric.trend === "number" ? metric.trend : null;
  const trendText =
    metric.trendLabel ??
    (trend !== null ? `${trend >= 0 ? "+" : ""}${(trend * 100).toFixed(1)}% vs. periodo anterior` : null);

  const TrendIcon =
    trend !== null ? (trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus) : metric.trendLabel ? Minus : null;

  const value =
    metric.formattedValue ??
    (typeof metric.value === "number" ? metric.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—");

  const accent = COLORS[colorIndex % COLORS.length];
  const gradientId = `metric-highlight-${metric.key}`;

  return (
    <Card className="relative overflow-hidden border border-border/60 shadow-sm">
      <CardHeader className="space-y-1 pb-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{metric.label}</p>
        <div className="flex flex-wrap items-baseline gap-2">
          <p className="text-2xl font-semibold leading-tight">
            {value}
            {metric.unit && <span className="ml-1 text-sm text-muted-foreground">{metric.unit}</span>}
          </p>
          {TrendIcon && trend !== null && (
            <span
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                trend > 0 ? "bg-success-soft text-success-strong" : trend < 0 ? "bg-danger-soft text-danger-strong" : "bg-muted text-foreground",
              )}
            >
              <TrendIcon className="h-3 w-3" />
              {(trend * 100).toFixed(1)}%
            </span>
          )}
          {TrendIcon === Minus && trend === null && metric.trendLabel && (
            <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
              <Minus className="h-3 w-3" />
              {metric.trendLabel}
            </span>
          )}
        </div>
        {trendText && <p className="text-xs text-muted-foreground">{trendText}</p>}
      </CardHeader>
      <CardContent className="pb-4 pt-0">
        {chartPoints.length > 1 ? (
          <div className="h-16 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartPoints}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={accent} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={accent} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={accent}
                  fillOpacity={1}
                  fill={`url(#${gradientId})`}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Sin historial suficiente para este indicador.</p>
        )}
      </CardContent>
    </Card>
  );
}
