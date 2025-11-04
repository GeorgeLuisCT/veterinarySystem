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
import { AnimalForm } from "../form/animal-form";
import ManageInactiveAnimals from "./manage-inactive-animals";

export function AnimalNavigation() {
  const [openAnimal, setOpenAnimal] = React.useState(false);
  const [openInactive, setOpenInactive] = React.useState(false);

  const { userInfo } = useUser();

  return (
    <NavigationMenu className="max-h-[min-content]">
      <NavigationMenuList className="pl-4">
        <NavigationMenuItem>
          <button
            onClick={() => setOpenAnimal(true)}
            className={`${navigationMenuTriggerStyle()} flex items-center w-full`}
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Registrar Animal
          </button>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <button
            onClick={() => setOpenInactive(true)}
            className={`${navigationMenuTriggerStyle()} flex items-center w-full`}
          >
            <Ban className="w-4 h-4 mr-2" />
            Animales Inactivos
          </button>
        </NavigationMenuItem>
      </NavigationMenuList>

      <Dialog open={openAnimal} onOpenChange={setOpenAnimal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Animal</DialogTitle>
            <DialogDescription>
              Completa el formulario para registrar un nuevo animal en el sistema.
            </DialogDescription>
          </DialogHeader>
          <AnimalForm setOpen={setOpenAnimal} />
        </DialogContent>
      </Dialog>

      <Dialog open={openInactive} onOpenChange={setOpenInactive}>
        <DialogContent className="w-[90%] sm:max-w-[70%] max-h-[90vh] overflow-y-auto overflow-x-auto">
          <DialogHeader>
            <DialogTitle>Animales Inactivos</DialogTitle>
            <DialogDescription>
              {userInfo?.selectedBranch?.id === 0
                ? "Consulta y administra todos los animales inactivos."
                : "Consulta y administra los animales inactivos disponibles para la gestión."}
            </DialogDescription>
          </DialogHeader>
          <ManageInactiveAnimals />
        </DialogContent>
      </Dialog>
    </NavigationMenu>
  );
}
