// app/dashboard/inventory/page.tsx
"use client";

import * as React from "react";
import { PlusCircle, List, FolderPlus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { useUser } from "@/context/user-context";
import { ProductProvider } from "../../_context/product-context-type";
import DashboardLayoutSection from "@/app/dashboard/dashboard-layout-section";
import MainInvetory from "../../_components/main-invetory";
import { ProductForm } from "../../_components/product-form";
import { CategoryForm } from "../../_components/category-form";
import { ManageCategorieProduct } from "../../_components/manage-categorie-product";

export default function InventoryPage() {
  const { userInfo } = useUser();

  const [openProduct, setOpenProduct] = React.useState(false);
  const [openCategory, setOpenCategory] = React.useState(false);
  const [openManage, setOpenManage] = React.useState(false);

  const branchId = userInfo?.selectedBranch?.id ?? 0;

  return (
    <ProductProvider>
      <DashboardLayoutSection>
        <div className="h-full bg-gray-50 p-4 sm:p-6">
          <div className="mx-auto flex h-full max-w-8xl flex-col">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Inventario</h1>
                <p className="mt-1 text-gray-600">
                  Gestiona productos, categorías y disponibilidad por sucursal.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={() => setOpenProduct(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Registrar producto
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary">
                      <List className="mr-2 h-4 w-4" />
                      Categorías
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuGroup>
                      <DropdownMenuItem onSelect={() => setOpenCategory(true)}>
                        <FolderPlus className="mr-2 h-4 w-4" />
                        Nueva categoría
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setOpenManage(true)}>
                        <Settings className="mr-2 h-4 w-4" />
                        Administrar categorías
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <MainInvetory branchId={branchId} />
          </div>
        </div>
      </DashboardLayoutSection>

      <ProductForm open={openProduct} setOpen={setOpenProduct} />

      {/* Dialog: Nueva categoría */}
      <Dialog open={openCategory} onOpenChange={setOpenCategory}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Categoría</DialogTitle>
            <DialogDescription>
              Crea una nueva categoría para organizar mejor tus productos.
            </DialogDescription>
          </DialogHeader>
          <CategoryForm setOpen={setOpenCategory} />
        </DialogContent>
      </Dialog>

      {/* Dialog: Administrar categorías */}
      <Dialog open={openManage} onOpenChange={setOpenManage}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Administrar Categorías</DialogTitle>
            <DialogDescription>
              Edita, elimina o reordena las categorías de productos disponibles.
            </DialogDescription>
          </DialogHeader>
          <ManageCategorieProduct />
        </DialogContent>
      </Dialog>
    </ProductProvider>
  );
}
