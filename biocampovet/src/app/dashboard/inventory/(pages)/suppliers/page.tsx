"use client";

import * as React from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SupplierProvider } from "../../_context/supplier-context";
import DashboardLayoutSection from "@/app/dashboard/dashboard-layout-section";
import MainSupplier from "../../_components/main-supplier";
import { SupplierForm } from "../../_components/supplier-form";


export default function SupplierPage() {
  const [openSupplier, setOpenSupplier] = React.useState(false);

  return (
    <SupplierProvider>
      <DashboardLayoutSection>
        <div className="h-full bg-gray-50 p-4 sm:p-6">
          <div className="mx-auto flex h-full max-w-8xl flex-col">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Proveedores</h1>
                <p className="mt-1 text-gray-600">
                  Gestiona los proveedores de productos y servicios.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={() => setOpenSupplier(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Registrar proveedor
                </Button>
              </div>
            </div>

            <MainSupplier />
          </div>
        </div>
      </DashboardLayoutSection>

      <SupplierForm open={openSupplier} setOpen={setOpenSupplier} />
    </SupplierProvider>
  );
}