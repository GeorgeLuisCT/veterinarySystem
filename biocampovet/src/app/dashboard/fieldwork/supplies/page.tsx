"use client";

import * as React from "react";
import type { ProductResponse } from "@/app/dashboard/inventory/products/types/product-response";
import { useUser } from "@/context/user-context";
import VehicleSelectorCard from "../components/suplies/vehicle-selector-card";
import VehicleInventoryCard from "../components/suplies/vehicle-inventory-card";
import TransferDialog from "../components/suplies/transfer-dialog";
import BranchInventoryCard from "../components/suplies/branch-inventory-card";

export default function FieldSuppliesPage() {
  const { userInfo } = useUser();
  const selectedBranchId = userInfo?.selectedBranch?.id ?? null;

  const [selectedVehicleId, setSelectedVehicleId] = React.useState<number | null>(null);
  const [openTransferFor, setOpenTransferFor] = React.useState<ProductResponse | null>(null);
  const [stockRefreshKey, setStockRefreshKey] = React.useState(0);
  const [movementsRefreshKey, setMovementsRefreshKey] = React.useState(0);
  const [branchRefreshKey, setBranchRefreshKey] = React.useState(0);

  const refreshVehiclePanels = () => {
    setStockRefreshKey((k) => k + 1);
    setMovementsRefreshKey((k) => k + 1);
  };

  const refreshBranchPanel = () => setBranchRefreshKey((k) => k + 1);

  return (
    <div className="space-y-6 p-4">
      <VehicleSelectorCard value={selectedVehicleId} onChange={setSelectedVehicleId} onRefresh={refreshVehiclePanels} />

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-2 space-y-6">
          <BranchInventoryCard
            branchId={selectedBranchId}
            onAddToVehicle={(product) => setOpenTransferFor(product)}
            vehicleSelected={selectedVehicleId != null}
            refreshKey={branchRefreshKey}
          />
        </div>
        <div className="lg:col-span-2 space-y-6">
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
    </div>
  );
}
