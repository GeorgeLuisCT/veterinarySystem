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
import ManageInactiveSuppliers from "./manage-inactive-suppliers";
import { SupplierForm } from "../form/supplier-form";

export function SupplierNavigation() {
  const [openSupplier, setOpenSupplier] = React.useState<boolean>(false);
  const [openInactive, setOpenInactive] = React.useState<boolean>(false);

  const { userInfo } = useUser();

  return (
    <NavigationMenu className="max-h-[min-content]">
      <NavigationMenuList className="pl-4">
        <NavigationMenuItem>
          <button
            onClick={() => setOpenSupplier(true)}
            className={`${navigationMenuTriggerStyle()} flex items-center w-full`}
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Registrar Proveedor
          </button>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <button
            onClick={() => setOpenInactive(true)}
            className={`${navigationMenuTriggerStyle()} flex items-center w-full`}
          >
            <Ban className="w-4 h-4 mr-2" />
            Proveedores Inactivos
          </button>
        </NavigationMenuItem>
      </NavigationMenuList>

      <Dialog open={openSupplier} onOpenChange={setOpenSupplier}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Proveedor</DialogTitle>
            <DialogDescription>
              Completa el formulario para registrar un nuevo proveedor en el sistema.
            </DialogDescription>
          </DialogHeader>
          <SupplierForm setOpen={setOpenSupplier} />
        </DialogContent>
      </Dialog>

      <Dialog open={openInactive} onOpenChange={setOpenInactive}>
        <DialogContent className="w-[90%] sm:max-w-[70%] max-h-[90vh] overflow-y-auto overflow-x-auto">
          <DialogHeader>
            <DialogTitle>Proveedores Inactivos</DialogTitle>
            <DialogDescription>
              {userInfo?.selectedBranch?.id === 0
                ? "Consulta y administra los proveedores inactivos en todas las sucursales."
                : "Consulta y administra los proveedores inactivos de esta sucursal."}
            </DialogDescription>
          </DialogHeader>
          <ManageInactiveSuppliers branchId={userInfo?.selectedBranch?.id ?? 0} />
        </DialogContent>
      </Dialog>
    </NavigationMenu>
  );
}
