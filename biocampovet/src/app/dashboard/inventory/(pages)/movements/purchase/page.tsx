"use client";

import DashboardLayoutSection from "@/app/dashboard/dashboard-layout-section";
import { useUser } from "@/context/user-context";
import MainInventoryMovements from "../../../_components/main-inventory-movements";

export default function InventoryPurchasePage() {
  const { userInfo } = useUser();
  const branchId = userInfo?.selectedBranch?.id;

  return (
    <DashboardLayoutSection>
      <div className="h-full bg-gray-50 p-4 sm:p-6">
        <div className="mx-auto h-full max-w-7xl">
          <MainInventoryMovements branchId={branchId} context="PURCHASES" />
        </div>
      </div>
    </DashboardLayoutSection>
  );
}
