"use client";

import DashboardLayoutSection from "@/app/dashboard/dashboard-layout-section";
import MainInventoryPurchases from "../../../_components/main-inventory-purchases";
import { PageContainer } from "@/components/page/page-container";

export default function InventoryPurchasePage() {
  return (
    <DashboardLayoutSection>
      <PageContainer>
        <MainInventoryPurchases />
      </PageContainer>
    </DashboardLayoutSection>
  );
}
