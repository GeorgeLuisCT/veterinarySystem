"use client";

import DashboardLayoutSection from "@/app/dashboard/dashboard-layout-section";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { CashSessionHistoryProvider } from "../_hooks/cash-history-context";
import MainCashHistory from "../_components/main-cash-history";
import { PageHeader } from "@/components/page/page-header";

export default function CashSessionHistoryPage() {
  const router = useRouter();

  return (
    <CashSessionHistoryProvider>
      <DashboardLayoutSection>
        <div className="h-full overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto flex h-full w-full max-w-screen-2xl flex-col gap-4">
            <PageHeader
              title="Historial de Cierres"
              description="Gestiona y revisa todas las sesiones de caja cerradas."
              actions={
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button onClick={() => router.push("/dashboard/cashbox")}>Volver a Caja</Button>
                  </div>
                </>
              }
            />

            <MainCashHistory />
          </div>
        </div>
      </DashboardLayoutSection>
    </CashSessionHistoryProvider>
  );
}
