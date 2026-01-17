"use client";

import DashboardLayoutSection from "@/app/dashboard/dashboard-layout-section";
import MainInventoryMovements from "../../_components/main-inventory-movements";

export default function InventoryMovementsPage() {
  return (
    <DashboardLayoutSection>
      <div className="h-full bg-gray-50 p-4 sm:p-6">
        <div className="mx-auto h-full max-w-8xl">
          <MainInventoryMovements />
        </div>
      </div>
    </DashboardLayoutSection>
  );
}
