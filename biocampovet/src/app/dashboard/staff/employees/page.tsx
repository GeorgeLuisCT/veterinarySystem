"use client";

import { useUser } from "@/context/user-context";
import DashboardLayoutSection from "../../dashboard-layout-section";

import { useEffect } from "react";
import { EmployeeProvider } from "./context/employee-context";
import { EmployeeNavigation } from "./components/employee-navigation";
import MainEmployee from "./components/main-employee";

export default function InventoryPage() {
  const { userInfo } = useUser();

  console.log("InventoryPage render");

  useEffect(() => {
    console.log("userInfo", userInfo);
  }, [])

  return (
    <EmployeeProvider>
      <EmployeeNavigation />
      <DashboardLayoutSection>
        <MainEmployee
          branchId={userInfo?.selectedBranch?.id ?? 0}
        />
      </DashboardLayoutSection>
    </EmployeeProvider>
  );
}

