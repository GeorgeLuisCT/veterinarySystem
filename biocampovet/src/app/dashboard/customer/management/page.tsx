'use client';

import { useUser } from "@/context/user-context";
import DashboardLayoutSection from "../../dashboard-layout-section";
import { CustomerNavigation } from "./components/customer-navigation";
import MainCustomers from "./components/main-customers";
import { CustomerProvider } from "./context/customer-context";
import { useEffect } from "react";

export default function CustomerPage() {
  const { userInfo } = useUser();

  console.log("CustomerPage render");

  useEffect(() => {
    console.log("userInfo", userInfo);
  }, []);

  return (
    <CustomerProvider>
      <CustomerNavigation />
      <DashboardLayoutSection>
        <MainCustomers />
      </DashboardLayoutSection>
    </CustomerProvider>
  );
}
