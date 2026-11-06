"use client";

import * as React from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Dialog,
} from "@/components/ui/dialog";
import MainEmployee from "./components/main-employee";
import { useUser } from "@/context/user-context";
import { EmployeeForm } from "./form/employee-form";
import DashboardLayoutSection from "../dashboard-layout-section";
import { EmployeeProvider } from "./context/employee-context";
import { PageContainer } from "@/components/page/page-container";
import { PageHeader } from "@/components/page/page-header";

export default function EmployeePage() {
  const { userInfo } = useUser();
  const branchId = userInfo?.selectedBranch?.id ?? 0;

  const [openCreate, setOpenCreate] = React.useState(false);

  return (
    <EmployeeProvider>
      <DashboardLayoutSection>
        <PageContainer>
          <PageHeader
            title="Empleados"
            description="Administra tu personal con registro, edición y control de estado."
            actions={
              <>
                <div className="flex items-center gap-2">
                  <Button onClick={() => setOpenCreate(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Registrar Empleado
                  </Button>
                </div>
              </>
            }
          />

          <MainEmployee key={branchId} branchId={branchId} />

          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Empleado</DialogTitle>
                <DialogDescription>
                  Completa el formulario para registrar un nuevo empleado.
                </DialogDescription>
              </DialogHeader>
              <EmployeeForm setOpen={setOpenCreate} />
            </DialogContent>
          </Dialog>
        </PageContainer>
      </DashboardLayoutSection>
    </EmployeeProvider>
  );
}
