"use client";

import React, { useEffect, useState } from "react";
import { Loader2, TrendingUp } from "lucide-react";

import CashBoxService from "../service/cashbox-service";
import { CashBoxResponse } from "../types/cashbox-response";
import { CashBoxHeader } from "./cashbox-header";
import { FinancialSummary } from "./financial-summary";
import { PaymentsTable } from "./payments-table";
import { CashBoxMovementsTable } from "./cashbox-movements-table";
import { CashboxAuditsTable } from "./cashbox-audits-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CashboxMovementType } from "../enums/cashbox-movement-type";

interface CashBoxDashboardProps {
  cashboxId?: number;
}

export function CashboxDetails({ cashboxId }: CashBoxDashboardProps) {
  const [cashBox, setCashBox] = useState<CashBoxResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCashBox();
  }, [cashboxId]);

  const fetchCashBox = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await CashBoxService.getCashBoxById(cashboxId);
      setCashBox(data);
    } catch {
      setError("Error al cargar la caja.");
      setCashBox(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-red-600 p-8">{error}</p>;
  }

  if (!cashBox) {
    return <p className="text-center p-8">Caja no encontrada.</p>;
  }

  // Separar movimientos por tipo
  const incomeMovements = cashBox.movements.filter(
    (m) => m.type === CashboxMovementType.INCOME
  );
  const expenseMovements = cashBox.movements.filter(
    (m) => m.type === CashboxMovementType.EXPENSE
  );

  return (
    <div className="min-h-screen bg-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <CashBoxHeader
          fetchCurrentCashBox={fetchCashBox}
          id={cashBox.id}
          branchName={cashBox.branchName}
          openedBy={cashBox.openedBy}
          openedAt={cashBox.openedAt}
          initialAmount={cashBox.initialAmount}
          status={cashBox.status}
        />

        <FinancialSummary
          initialAmount={cashBox.initialAmount}
          totalIncome={cashBox.totalIncome}
          totalExpense={cashBox.totalExpense}
          physicalAmount={cashBox.physicalAmount}
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Ingresos por ventas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentsTable payments={cashBox.payments} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Otros ingresos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CashBoxMovementsTable movements={incomeMovements} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Egresos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CashBoxMovementsTable movements={expenseMovements} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Corte de caja
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CashboxAuditsTable audits={cashBox.audits} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
