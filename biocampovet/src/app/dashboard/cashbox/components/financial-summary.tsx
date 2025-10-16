"use client";

import {
  Calculator,
  TrendingUp,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { FinancialSummaryCard } from "./financial-summary-card";

interface FinancialSummaryProps {
  initialAmount: number;
  totalIncome: number;
  totalExpense: number;
  physicalAmount: number;
}

export function FinancialSummary({
  initialAmount,
  totalIncome,
  totalExpense,
  physicalAmount,
}: FinancialSummaryProps) {
  const difference = physicalAmount - (initialAmount + totalIncome - totalExpense);
  const differenceClass = difference < 0 ? "text-red-600" : "text-green-600";

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Calculator className="h-5 w-5" />
        Resumen Financiero
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <FinancialSummaryCard
          title="Total Ingresos"
          amount={totalIncome}
          borderColorClass="border-l-green-500"
          amountTextClass="text-green-600"
          icon={<TrendingUp className="h-8 w-8 text-green-500" />}
        />
        <FinancialSummaryCard
          title="Total Egresos"
          amount={totalExpense}
          borderColorClass="border-l-red-500"
          amountTextClass="text-red-600"
          icon={<TrendingDown className="h-8 w-8 text-red-500" />}
        />
        <FinancialSummaryCard
          title="Monto Físico"
          amount={physicalAmount}
          borderColorClass="border-l-blue-500"
          amountTextClass="text-blue-600"
          icon={<Wallet className="h-8 w-8 text-blue-500" />}
        />
        <FinancialSummaryCard
          title="Diferencia"
          amount={difference}
          borderColorClass="border-l-orange-500"
          amountTextClass={differenceClass}
          icon={<Calculator className="h-8 w-8 text-orange-500" />}
        />
      </div>
    </div>
  );
}
