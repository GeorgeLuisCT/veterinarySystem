"use client";

import * as React from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SupplierProvider } from "../../_context/supplier-context";
import DashboardLayoutSection from "@/app/dashboard/dashboard-layout-section";
import MainSupplier from "../../_components/main-supplier";
import { SupplierForm } from "../../_components/supplier-form";
import { PageContainer } from "@/components/page/page-container";
import { PageHeader } from "@/components/page/page-header";

export default function SupplierPage() {
  const [openSupplier, setOpenSupplier] = React.useState(false);

  return (
    <SupplierProvider>
      <DashboardLayoutSection>
        <PageContainer>
          <PageHeader
            title="Proveedores"
            description="Gestiona los proveedores de productos y servicios."
            actions={
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={() => setOpenSupplier(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Registrar proveedor
                  </Button>
                </div>
              </>
            }
          />

          <MainSupplier />
        </PageContainer>
      </DashboardLayoutSection>

      <SupplierForm open={openSupplier} setOpen={setOpenSupplier} />
    </SupplierProvider>
  );
}
