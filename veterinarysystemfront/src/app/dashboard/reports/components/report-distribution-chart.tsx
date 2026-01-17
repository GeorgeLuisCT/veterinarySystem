"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportBreakdownGroup } from "@/types/reporting";
import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip } from "recharts";

const COLORS = ["#2563eb", "#0ea5e9", "#22c55e", "#f97316", "#a855f7", "#ec4899", "#14b8a6"];

type ReportDistributionChartProps = {
  group?: ReportBreakdownGroup;
};

export function ReportDistributionChart({ group }: ReportDistributionChartProps) {
  if (!group) {
    return (
      <Card className="h-full border border-dashed border-border/70 shadow-none">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Distribución</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No hay datos suficientes para la distribución.</p>
        </CardContent>
      </Card>
    );
  }

  const data = group.items
    .map((item, index) => {
      const rawValue =
        typeof item.value === "number"
          ? item.value
          : typeof item.percentage === "number"
            ? item.percentage * 100
            : undefined;
      if (rawValue === undefined) {
        return null;
      }
      return {
        name: item.label,
        value: rawValue,
        formatted: item.formattedValue ?? rawValue.toLocaleString(undefined, { maximumFractionDigits: 2 }),
        color: COLORS[index % COLORS.length],
      };
    })
    .filter((item): item is { name: string; value: number; formatted: string; color: string } => Boolean(item));

  if (!data.length) {
    return (
      <Card className="h-full border border-dashed border-border/70 shadow-none">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">{group.title}</CardTitle>
          {group.subtitle && <p className="text-xs text-muted-foreground">{group.subtitle}</p>}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No hay datos suficientes para graficar.</p>
        </CardContent>
      </Card>
    );
  }

  const total = data.reduce((acc, item) => acc + item.value, 0);

  return (
    <Card className="h-full border border-border/70 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{group.title}</CardTitle>
        {group.subtitle && <p className="text-xs text-muted-foreground">{group.subtitle}</p>}
      </CardHeader>
      <CardContent className="flex flex-col gap-4 lg:flex-row">
        <div className="h-64 w-full lg:h-72 lg:w-1/2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                strokeWidth={2}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} stroke="#0f172a" strokeOpacity={0.05} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, _, payload) => {
                  const percent = total ? `${((value / total) * 100).toFixed(1)}%` : "—";
                  const datum = payload?.payload as (typeof data)[number];
                  return [`${datum.formatted} (${percent})`, datum.name];
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2">
          {data.map((item) => {
            const percent = total ? (item.value / total) * 100 : 0;
            return (
              <div key={item.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </span>
                  <span>{percent.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${percent}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
