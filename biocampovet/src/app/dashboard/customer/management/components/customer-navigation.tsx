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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PlusCircle, Ban } from "lucide-react";
import { useUser } from "@/context/user-context";
import { CustomerForm } from "../form/customer-form";
import ManageInactiveCustomers from "./manage-inactive-customers";

export function CustomerNavigation() {
  const [openCustomer, setOpenCustomer] = React.useState(false);
  const [openInactive, setOpenInactive] = React.useState(false);

  const { userInfo } = useUser();

  return (
    <NavigationMenu className="max-h-[min-content]">
      <NavigationMenuList className="pl-4">
        <NavigationMenuItem>
          <button
            onClick={() => setOpenCustomer(true)}
            className={`${navigationMenuTriggerStyle()} flex items-center w-full`}
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Registrar Cliente
          </button>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <button
            onClick={() => setOpenInactive(true)}
            className={`${navigationMenuTriggerStyle()} flex items-center w-full`}
          >
            <Ban className="w-4 h-4 mr-2" />
            Clientes Inactivos
          </button>
        </NavigationMenuItem>
      </NavigationMenuList>

      <Dialog open={openCustomer} onOpenChange={setOpenCustomer}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Cliente</DialogTitle>
            <DialogDescription>
              Completa el formulario para registrar un nuevo cliente en el sistema.
            </DialogDescription>
          </DialogHeader>
          <CustomerForm setOpen={setOpenCustomer} />
        </DialogContent>
      </Dialog>

      <Dialog open={openInactive} onOpenChange={setOpenInactive}>
        <DialogContent className="w-[90%] sm:max-w-[70%] max-h-[90vh] overflow-y-auto overflow-x-auto">
          <DialogHeader>
            <DialogTitle>Clientes Inactivos</DialogTitle>
            <DialogDescription>
              {userInfo?.selectedBranch?.id === 0
                ? "Consulta y administra todos los clientes inactivos."
                : "Consulta y administra los clientes inactivos disponibles para la gestión."}
            </DialogDescription>
          </DialogHeader>
          <ManageInactiveCustomers />
        </DialogContent>
      </Dialog>
    </NavigationMenu>
  );
}
