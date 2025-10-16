"use client";

import { useUser } from "@/context/user-context";
import DashboardLayoutSection from "../../dashboard-layout-section";

import { useEffect } from "react";
import { SupplierProvider } from "./context/supplier-context";
import { SupplierNavigation } from "./components/supplier-navigation";
import MainSupplier from "./components/main-supplier";

export default function SupplierPage() {
  const { userInfo } = useUser();

  console.log("SupplierPage render");

  useEffect(() => {
    console.log("userInfo", userInfo);
  }, []);

  return (
    <SupplierProvider>
      <SupplierNavigation />
      <DashboardLayoutSection>
        <MainSupplier />
      </DashboardLayoutSection>
    </SupplierProvider>
  );
}