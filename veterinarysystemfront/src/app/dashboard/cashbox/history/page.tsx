"use client";

import DashboardLayoutSection from "@/app/dashboard/dashboard-layout-section";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { CashSessionHistoryProvider } from "../_hooks/cash-history-context";
import MainCashHistory from "../_components/main-cash-history";
import { PageHeader } from "@/components/page/page-header";
import { PageContainer } from "@/components/page/page-container";

export default function CashSessionHistoryPage() {
  const router = useRouter();

  return (
    <CashSessionHistoryProvider>
      <DashboardLayoutSection>
        <PageContainer>
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
        </PageContainer>
      </DashboardLayoutSection>
    </CashSessionHistoryProvider>
  );
}
