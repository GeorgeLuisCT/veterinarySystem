"use client";

import * as React from "react";
import type { ProductResponse } from "@/app/dashboard/inventory/_types/product-response";
import { useUser } from "@/context/user-context";
import VehicleSelectorCard from "../components/suplies/vehicle-selector-card";
import VehicleInventoryCard from "../components/suplies/vehicle-inventory-card";
import TransferDialog from "../components/suplies/transfer-dialog";
import BranchInventoryCard from "../components/suplies/branch-inventory-card";
import DashboardLayoutSection from "@/app/dashboard/dashboard-layout-section";
import { PageContainer } from "@/components/page/page-container";
import { PageHeader } from "@/components/page/page-header";

export default function FieldSuppliesPage() {
  const { userInfo } = useUser();
  const selectedBranchId = userInfo?.selectedBranch?.id ?? null;

  const [selectedVehicleId, setSelectedVehicleId] = React.useState<number | null>(null);
  const [openTransferFor, setOpenTransferFor] = React.useState<ProductResponse | null>(null);
  const [stockRefreshKey, setStockRefreshKey] = React.useState(0);
  const [branchRefreshKey, setBranchRefreshKey] = React.useState(0);

  const refreshVehiclePanels = () => {
    setStockRefreshKey((k) => k + 1);
  };

  const refreshBranchPanel = () => setBranchRefreshKey((k) => k + 1);

  return (
    <DashboardLayoutSection>
      <PageContainer>
        <PageHeader
          title="Gestión de insumos"
          description="Transfiere productos de la sucursal a los vehículos de campo."
        />
        <VehicleSelectorCard
          value={selectedVehicleId}
          onChange={setSelectedVehicleId}
          onRefresh={refreshVehiclePanels}
        />

        <div className="grid gap-4 lg:grid-cols-4">
          <div className="lg:col-span-2 space-y-4">
            <BranchInventoryCard
              branchId={selectedBranchId}
              onAddToVehicle={(product) => setOpenTransferFor(product)}
              vehicleSelected={selectedVehicleId != null}
              refreshKey={branchRefreshKey}
            />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <VehicleInventoryCard vehicleId={selectedVehicleId} refreshKey={stockRefreshKey} />
          </div>
        </div>

        <TransferDialog
          product={openTransferFor}
          vehicleId={selectedVehicleId}
          branchId={selectedBranchId}
          onClose={() => setOpenTransferFor(null)}
          onTransferred={() => {
            setOpenTransferFor(null);
            refreshVehiclePanels();
            refreshBranchPanel();
          }}
        />
      </PageContainer>
    </DashboardLayoutSection>
  );
}
