"use client";

import DashboardLayoutSection from "@/app/dashboard/dashboard-layout-section";
import MainInventoryMovements from "../../_components/main-inventory-movements";
import { useUser } from "@/context/user-context";

export default function InventoryMovementsPage() {
  const { userInfo } = useUser();
  const branchId = userInfo?.selectedBranch?.id;

  return (
    <DashboardLayoutSection>
      <div className="h-full bg-gray-50 p-4 sm:p-6">
        <div className="mx-auto h-full max-w-7xl">
          <MainInventoryMovements branchId={branchId} context="MOVEMENTS" />
        </div>
      </div>
    </DashboardLayoutSection>
  );
}
