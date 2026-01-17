"use client";

import DashboardLayoutSection from "@/app/dashboard/dashboard-layout-section";
import MainInventoryPurchases from "../../../_components/main-inventory-purchases";

export default function InventoryPurchasePage() {
  return (
    <DashboardLayoutSection>
      <div className="h-full bg-gray-50 p-4 sm:p-6">
        <div className="mx-auto h-full max-w-8xl">
          <MainInventoryPurchases />
        </div>
      </div>
    </DashboardLayoutSection>
  );
}
