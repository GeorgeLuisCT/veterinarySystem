"use client";

import * as React from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayoutSection from "@/app/dashboard/dashboard-layout-section";
import { useRouter } from "next/navigation";
import MainSales from "../../../_components/main-history-sales";
import { SalesHistoryProvider } from "../../../_hooks/sales-history-context";

export default function SalesHistoryPage() {
  const router = useRouter();

  return (
    <SalesHistoryProvider>
      <DashboardLayoutSection>
        <div className="h-full bg-gray-50 p-4 sm:p-6">
          <div className="mx-auto flex h-full max-w-8xl flex-col">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Historial de Ventas
                </h1>
                <p className="mt-1 text-gray-600">
                  Gestiona y revisa todas las ventas registradas.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={() => router.push("/dashboard/pos/new")}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Nueva Venta
                </Button>
              </div>
            </div>

            <MainSales />
          </div>
        </div>
      </DashboardLayoutSection>
    </SalesHistoryProvider>
  );
}