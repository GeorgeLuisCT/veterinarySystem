"use client";

import { ReportBreakdownGroup } from "@/types/reporting";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ReportBreakdownCardProps = {
  group: ReportBreakdownGroup;
};

export function ReportBreakdownCard({ group }: ReportBreakdownCardProps) {
  return (
    <Card className="border border-border/70 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{group.title}</CardTitle>
        {group.subtitle && <p className="text-xs text-muted-foreground">{group.subtitle}</p>}
      </CardHeader>
      <CardContent className="space-y-3">
        {group.items.map((item) => (
          <div key={item.key} className="flex items-center justify-between border-b border-border/40 pb-2 last:border-b-0 last:pb-0">
            <div>
              <p className="text-sm font-medium">{item.label}</p>
              {item.metadata && item.metadata.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {item.metadata.map((meta) => `${meta.key}: ${meta.value}`).join(" • ")}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-base font-semibold">
                {item.formattedValue ??
                  (typeof item.value === "number" ? item.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—")}
              </p>
              {item.percentage !== undefined && item.percentage !== null && (
                <p className="text-xs text-muted-foreground">{Math.round(item.percentage * 100)}%</p>
              )}
            </div>
          </div>
        ))}
        {group.items.length === 0 && <p className="text-sm text-muted-foreground">Sin datos suficientes.</p>}
      </CardContent>
    </Card>
  );
}
