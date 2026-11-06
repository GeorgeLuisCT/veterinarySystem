"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ReportSeriesPoint } from "@/types/reporting";
import { cn } from "@/lib/utils";

type ReportTimelineCardProps = {
  title: string;
  series: ReportSeriesPoint[];
  className?: string;
};

export function ReportTimelineCard({ title, series, className }: ReportTimelineCardProps) {
  const hasData = series.length > 0;
  const firstValue = hasData ? series[0].value : 0;
  const lastValue = hasData ? series[series.length - 1].value : 0;
  const percentChange =
    hasData && firstValue !== 0 ? ((lastValue - firstValue) / Math.abs(firstValue)) * 100 : undefined;
  const average = hasData ? series.reduce((sum, point) => sum + point.value, 0) / series.length : 0;

  return (
    <Card className={cn("border border-border/70 shadow-none", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            {hasData && (
              <p className="text-xs text-muted-foreground">
                Promedio del periodo: {average.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            )}
          </div>
          {percentChange !== undefined && (
            <span
              className={cn(
                "text-xs font-semibold",
                percentChange > 0 ? "text-success-strong" : percentChange < 0 ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {percentChange > 0 ? "+" : ""}
              {percentChange.toFixed(1)}%
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="h-64">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="timeline-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#93c5fd" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={48} />
              <Tooltip
                labelClassName="text-sm font-medium"
                formatter={(value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              />
              <ReferenceLine y={average} stroke="#94a3b8" strokeDasharray="4 4" />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#2563eb"
                fill="url(#timeline-gradient)"
                strokeWidth={2}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground">Aún no hay datos históricos.</p>
        )}
      </CardContent>
    </Card>
  );
}
