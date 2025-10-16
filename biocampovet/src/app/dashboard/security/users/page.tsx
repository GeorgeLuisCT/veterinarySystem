'use client'; 

import { useUser } from "@/context/user-context";
import DashboardLayoutSection from "../../dashboard-layout-section";
import MainUsers from "./main-users";
import { UsersNavigation } from "./users-navigation";

export default function UsersPage() {
  const { userInfo } = useUser();

  return (
    <>
      <UsersNavigation />
      <DashboardLayoutSection>
       <MainUsers 
         key={userInfo?.selectedBranch?.id}
         branchId={userInfo?.selectedBranch?.id ?? 0}
       />
      </DashboardLayoutSection>
    </>
  );
}
