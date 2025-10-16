"use client"

import * as React from "react";
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { List, FolderPlus, Settings, PlusCircle, Ban } from "lucide-react";
import { CategoryForm } from "../form/category-form";
import { ManageCategorieProduct } from "./manage-categorie-product";
import ManageInactivProducts from "./manage-inactive-products";
import { useUser } from "@/context/user-context";
import { ProductForm } from "../form/product-form";

export function InventoryNavigation() {
    const [openProduct, setOpenProduct] = React.useState<boolean>(false);
    const [openCategory, setOpenCategory] = React.useState<boolean>(false);
    const [openManage, setOpenManage] = React.useState<boolean>(false);
    const [openInactive, setOpenInactive] = React.useState<boolean>(false);

    const { userInfo } = useUser();

    return (
        <NavigationMenu className="max-h-[min-content]">
            <NavigationMenuList className="pl-4">
                <NavigationMenuItem>
                    <button
                        onClick={() => setOpenProduct(true)}
                        className={`${navigationMenuTriggerStyle()} flex items-center w-full`}
                    >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Registrar Producto
                    </button>
                </NavigationMenuItem>

                <NavigationMenuItem>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <NavigationMenuTrigger>
                                <List className="w-4 h-4 mr-2" />
                                Categorías
                            </NavigationMenuTrigger>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56">
                            <DropdownMenuGroup>
                                <DropdownMenuItem onSelect={() => setOpenCategory(true)}>
                                    <FolderPlus className="w-4 h-4 mr-2" />
                                    Nueva Categoría
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setOpenManage(true)}>
                                    <Settings className="w-4 h-4 mr-2" />
                                    Administrar Categorías
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </NavigationMenuItem>

                <NavigationMenuItem>
                    <button
                        onClick={() => setOpenInactive(true)}
                        className={`${navigationMenuTriggerStyle()} flex items-center w-full`}
                    >
                        <Ban className="w-4 h-4 mr-2" />
                        Productos Inactivos
                    </button>
                </NavigationMenuItem>
            </NavigationMenuList>

            <Dialog open={openProduct} onOpenChange={setOpenProduct}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Registrar Producto</DialogTitle>
                        <DialogDescription>
                            Completa el formulario para registrar un nuevo producto en el sistema.
                        </DialogDescription>
                    </DialogHeader>
                    <ProductForm setOpen={setOpenProduct} />
                </DialogContent>
            </Dialog>

            <Dialog open={openCategory} onOpenChange={setOpenCategory}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nueva Categoría</DialogTitle>
                        <DialogDescription>
                            Crea una nueva categoría para organizar mejor tus productos.
                        </DialogDescription>
                    </DialogHeader>
                    <CategoryForm setOpen={setOpenCategory} />
                </DialogContent>
            </Dialog>

            <Dialog open={openManage} onOpenChange={setOpenManage}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Administrar Categorías</DialogTitle>
                        <DialogDescription>
                            Edita, elimina o reordena las categorías de productos disponibles.
                        </DialogDescription>
                    </DialogHeader>
                    <ManageCategorieProduct />
                </DialogContent>
            </Dialog>

            <Dialog open={openInactive} onOpenChange={setOpenInactive}>
                <DialogContent className="w-[90%] sm:max-w-[70%] max-h-[90vh] overflow-y-auto overflow-x-auto">
                    <DialogHeader>
                        <DialogTitle>Productos Inactivos</DialogTitle>
                        <DialogDescription>
                            {userInfo?.selectedBranch.id === 0
                                ? "Consulta y administra los productos que están inactivos en alguna o varias sucursales."
                                : "Consulta y administra los productos que están inactivos en esta sucursal."}
                        </DialogDescription>

                    </DialogHeader>
                    <ManageInactivProducts branchId={userInfo?.selectedBranch?.id ?? 0} />
                </DialogContent>
            </Dialog>


        </NavigationMenu>
    );
}
