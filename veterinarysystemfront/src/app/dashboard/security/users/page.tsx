"use client";

import * as React from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import DashboardLayoutSection from "../../dashboard-layout-section";
import MainUsers from "./main-users";
import { useUser } from "@/context/user-context";
import { UserForm } from "./components/user-form";
import { PageContainer } from "@/components/page/page-container";
import { PageHeader } from "@/components/page/page-header";

export default function UsersPage() {
  const { userInfo } = useUser();
  const branchId = userInfo?.selectedBranch?.id ?? 0;

  const [openCreate, setOpenCreate] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const handleCreated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <DashboardLayoutSection>
      <PageContainer>
        <PageHeader
          title="Usuarios"
          description="Administra tu base de usuarios con registro, edición y control de estado"
          actions={
            <>
              <div className="flex items-center gap-2">
                <Button onClick={() => setOpenCreate(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Registrar usuario
                </Button>
              </div>
            </>
          }
        />

        {/* Tabla + filtros */}
        <MainUsers key={branchId} branchId={branchId} refreshKey={refreshKey} />
        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Usuario</DialogTitle>
              <DialogDescription>
                Completa el formulario para registrar un nuevo usuario en el sistema.
              </DialogDescription>
            </DialogHeader>
            <UserForm setOpen={setOpenCreate} onCreated={handleCreated} />
          </DialogContent>
        </Dialog>
      </PageContainer>
    </DashboardLayoutSection>
  );
}
