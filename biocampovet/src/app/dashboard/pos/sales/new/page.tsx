"use client";

import DashboardLayoutSection from "../../../dashboard-layout-section";
import { SalesProvider } from "../context/sales-context-type";
import MainSales from "../components/main-sales";
import React from "react";

export default function SalesPage() {

  return (
    <SalesProvider>
    <DashboardLayoutSection>
      <MainSales />
    </DashboardLayoutSection>
  </SalesProvider>
  );
}

