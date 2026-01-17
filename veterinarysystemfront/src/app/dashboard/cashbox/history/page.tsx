"use client";

import DashboardLayoutSection from "@/app/dashboard/dashboard-layout-section";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { CashSessionHistoryProvider } from "../_hooks/cash-history-context";
import MainCashHistory from "../_components/main-cash-history";

export default function CashSessionHistoryPage() {
  const router = useRouter();

  return (
    <CashSessionHistoryProvider>
      <DashboardLayoutSection>
        <div className="h-full bg-gray-50 p-4 sm:p-6 overflow-auto">
          <div className="mx-auto flex h-full max-w-8xl flex-col">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Historial de Cierres
                </h1>
                <p className="mt-1 text-gray-600">
                  Gestiona y revisa todas las sesiones de caja cerradas.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={() => router.push("/dashboard/cashbox")}>
                  Volver a Caja
                </Button>
              </div>
            </div>

            <MainCashHistory />
          </div>
        </div>
      </DashboardLayoutSection>
    </CashSessionHistoryProvider>
  );
}