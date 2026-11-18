// app/dashboard/inventory/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { PlusCircle, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useUser } from "@/context/user-context";
import { ProductProvider } from "../../_context/product-context-type";
import DashboardLayoutSection from "@/app/dashboard/dashboard-layout-section";
import MainInvetory from "../../_components/main-invetory";
import { ProductForm } from "../../_components/product-form";
import { PageContainer } from "@/components/page/page-container";
import { PageHeader } from "@/components/page/page-header";

export default function InventoryPage() {
  const { userInfo } = useUser();

  const [openProduct, setOpenProduct] = React.useState(false);

  const branchId = userInfo?.selectedBranch?.id ?? 0;

  return (
    <ProductProvider>
      <DashboardLayoutSection>
        <PageContainer>
          <PageHeader
            title="Inventario"
            description="Gestiona productos y su disponibilidad por sucursal."
            actions={
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={() => setOpenProduct(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Registrar producto
                  </Button>

                  {/* Las categorías se administran en Configuración */}
                  <Button variant="secondary" asChild>
                    <Link href="/dashboard/settings/product-categories">
                      <Tags className="mr-2 h-4 w-4" />
                      Categorías
                    </Link>
                  </Button>
                </div>
              </>
            }
          />

          <MainInvetory branchId={branchId} />
        </PageContainer>
      </DashboardLayoutSection>

      <ProductForm open={openProduct} setOpen={setOpenProduct} />

    </ProductProvider>
  );
}
