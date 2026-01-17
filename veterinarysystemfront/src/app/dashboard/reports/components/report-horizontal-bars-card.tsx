"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportBreakdownGroup } from "@/types/reporting";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type ReportHorizontalBarsCardProps = {
  group?: ReportBreakdownGroup;
  title?: string;
};

export function ReportHorizontalBarsCard({ group, title }: ReportHorizontalBarsCardProps) {
  if (!group) {
    return (
      <Card className="h-full border border-dashed border-border/70 shadow-none">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">{title ?? "Detalle comparativo"}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No hay datos suficientes para graficar.</p>
        </CardContent>
      </Card>
    );
  }

  const data = group.items
    .map((item) => {
      if (typeof item.value !== "number") return null;
      return {
        name: item.label,
        value: item.value,
        formatted: item.formattedValue ?? item.value.toLocaleString(),
      };
    })
    .filter((item): item is { name: string; value: number; formatted: string } => Boolean(item))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return (
    <Card className="h-full border border-border/70 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{group.title}</CardTitle>
        {group.subtitle && <p className="text-xs text-muted-foreground">{group.subtitle}</p>}
      </CardHeader>
      <CardContent className="h-72">
        {data.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 8, bottom: 8, left: 20, right: 16 }}
              barCategoryGap="20%"
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={120} />
              <Tooltip formatter={(value, _, payload) => [(payload?.payload.formatted as string) ?? value, payload?.payload.name]} />
              <Bar dataKey="value" fill="#2563eb" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground">No hay registros destacados en este periodo.</p>
        )}
      </CardContent>
    </Card>
  );
}
