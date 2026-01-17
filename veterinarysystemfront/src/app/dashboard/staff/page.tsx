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

export default function EmployeePage() {
  const { userInfo } = useUser();
  const branchId = userInfo?.selectedBranch?.id ?? 0;

  const [openCreate, setOpenCreate] = React.useState(false);

  return (

    <EmployeeProvider>
      <DashboardLayoutSection>
        <div className="h-full bg-gray-50 p-4 sm:p-6">
          <div className="mx-auto flex h-full max-w-8xl flex-col overflow-y-auto">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Empleados
                </h1>
                <p className="mt-1 text-gray-600">
                  Administra tu personal con registro, edición y control de estado.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => setOpenCreate(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Registrar Empleado
                </Button>
              </div>
            </div>

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
          </div>
        </div>
      </DashboardLayoutSection>
    </EmployeeProvider>
  );
}