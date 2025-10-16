export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getUserInfo } from "@/services/api-server";
import { UserProvider } from "@/context/user-context";
import DashboardContent from "./dashboard-content";
import { toast} from "sonner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const userInfo = await getUserInfo();

    if (!userInfo.selectedBranch) {
      toast.error( "No tienes una sucursal seleccionada. Por favor, selecciona una sucursal para continuar.");
      redirect("/login");
    }

    return (
      <UserProvider initialUser={userInfo}>
        <DashboardContent>{children}</DashboardContent>
      </UserProvider>
    );
  } catch (error) {
    console.error("Error fetching user info:", error);
    redirect("/login");
  }
}
