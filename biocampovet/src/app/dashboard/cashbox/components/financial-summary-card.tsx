"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ReactNode } from "react";

interface FinancialSummaryCardProps {
  title: string;
  amount: number;
  icon: ReactNode;
  borderColorClass: string;
  amountTextClass: string;
}

export function FinancialSummaryCard({
  title,
  amount,
  icon,
  borderColorClass,
  amountTextClass,
}: FinancialSummaryCardProps) {
  return (
    <Card className={`border-l-4 ${borderColorClass}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className={`text-2xl font-bold ${amountTextClass}`}>
              S/ {amount.toFixed(2)}
            </p>
          </div>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
