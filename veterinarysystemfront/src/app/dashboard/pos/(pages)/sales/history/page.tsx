"use client";

import * as React from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayoutSection from "@/app/dashboard/dashboard-layout-section";
import { useRouter } from "next/navigation";
import MainSales from "../../../_components/main-history-sales";
import { SalesHistoryProvider } from "../../../_hooks/sales-history-context";
import { PageContainer } from "@/components/page/page-container";
import { PageHeader } from "@/components/page/page-header";

export default function SalesHistoryPage() {
  const router = useRouter();

  return (
    <SalesHistoryProvider>
      <DashboardLayoutSection>
        <PageContainer>
          <PageHeader
            title="Historial de Ventas"
            description="Gestiona y revisa todas las ventas registradas."
            actions={
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={() => router.push("/dashboard/pos/new")}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nueva Venta
                  </Button>
                </div>
              </>
            }
          />

          <MainSales />
        </PageContainer>
      </DashboardLayoutSection>
    </SalesHistoryProvider>
  );
}
