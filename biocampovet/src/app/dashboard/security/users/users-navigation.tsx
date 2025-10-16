"use client"

import * as React from "react";
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuList,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { PlusCircle } from "lucide-react";

export function UsersNavigation() {
    const [openUser, setOpenUser] = React.useState<boolean>(false);
    

    return (
        <NavigationMenu className="max-h-[min-content]">
            <NavigationMenuList className="pl-4">
                <NavigationMenuItem>
                    <button
                        onClick={() => setOpenUser(true)}
                        className={`${navigationMenuTriggerStyle()} flex items-center w-full`}
                    >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Registrar Usuario
                    </button>
                </NavigationMenuItem>
            </NavigationMenuList>

            <Dialog open={openUser} onOpenChange={setOpenUser}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Registrar Producto</DialogTitle>
                    </DialogHeader>
                </DialogContent>
            </Dialog>

        </NavigationMenu>
    );
}
