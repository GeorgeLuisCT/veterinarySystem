'use client'; 

import { useUser } from "@/context/user-context";
import DashboardLayoutSection from "../../dashboard-layout-section";
import { InventoryNavigation } from "./components/inventory-navigation";
import MainInvetory from "./components/main-invetory";
import { ProductProvider } from "./context/product-context-type";
import { useEffect } from "react";

export default function InventoryPage() {
  const { userInfo } = useUser();

  console.log("InventoryPage render");

  useEffect(() => {
    console.log("userInfo", userInfo);
  }, [])

  return (
    <ProductProvider>
      <InventoryNavigation />
      <DashboardLayoutSection>
        <MainInvetory
          branchId={userInfo?.selectedBranch?.id ?? 0}
        />
      </DashboardLayoutSection>
    </ProductProvider>
  );
}

