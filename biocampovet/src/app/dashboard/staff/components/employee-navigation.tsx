"use client";

import * as React from "react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { PlusCircle, Ban } from "lucide-react";
import { useUser } from "@/context/user-context";
import ManageInactiveEmployees from "./manage-inactive-employees";
import { EmployeeForm } from "../form/employee-form";

export function EmployeeNavigation() {
  const [openEmployee, setOpenEmployee] = React.useState<boolean>(false);
  const [openInactive, setOpenInactive] = React.useState<boolean>(false);

  const { userInfo } = useUser();

  return (
    <NavigationMenu className="max-h-[min-content]">
      <NavigationMenuList className="pl-4">
        <NavigationMenuItem>
          <button
            onClick={() => setOpenEmployee(true)}
            className={`${navigationMenuTriggerStyle()} flex items-center w-full`}
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Registrar Empleado
          </button>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <button
            onClick={() => setOpenInactive(true)}
            className={`${navigationMenuTriggerStyle()} flex items-center w-full`}
          >
            <Ban className="w-4 h-4 mr-2" />
            Empleados Inactivos
          </button>
        </NavigationMenuItem>
      </NavigationMenuList>

      <Dialog open={openEmployee} onOpenChange={setOpenEmployee}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Empleado</DialogTitle>
            <DialogDescription>
              Completa el formulario para registrar un nuevo empleado en el sistema.
            </DialogDescription>
          </DialogHeader>
          <EmployeeForm setOpen={setOpenEmployee} />
        </DialogContent>
      </Dialog>

      <Dialog open={openInactive} onOpenChange={setOpenInactive}>
        <DialogContent className="w-[90%] sm:max-w-[70%] max-h-[90vh] overflow-y-auto overflow-x-auto">
          <DialogHeader>
            <DialogTitle>Empleados Inactivos</DialogTitle>
            <DialogDescription>
              {userInfo?.selectedBranch?.id === 0
                ? "Consulta y administra los empleados que están inactivos en alguna o varias sucursales."
                : "Consulta y administra los empleados que están inactivos en esta sucursal."}
            </DialogDescription>
          </DialogHeader>
          <ManageInactiveEmployees branchId={userInfo?.selectedBranch?.id ?? 0} />
        </DialogContent>
      </Dialog>
    </NavigationMenu>
  );
}
