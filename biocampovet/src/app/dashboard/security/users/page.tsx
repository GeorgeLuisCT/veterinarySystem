'use client';

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

export default function UsersPage() {
  const { userInfo } = useUser();
  const branchId = userInfo?.selectedBranch?.id ?? 0;

  const [openCreate, setOpenCreate] = React.useState(false);

  return (
    <DashboardLayoutSection>
      <div className="h-full bg-gray-50 p-4 sm:p-6">
        <div className="mx-auto flex h-full max-w-8xl flex-col overflow-y-auto">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Usuarios</h1>
              <p className="mt-1 text-gray-600">
                Administra tu base de usuarios con registro, edición y control de estado
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setOpenCreate(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Registrar usuario
              </Button>
            </div>
          </div>

          {/* Tabla + filtros */}
          <MainUsers key={branchId} branchId={branchId} />
          {/* Dialog: Crear usuario (deja tu <UserForm /> aquí si ya lo tienes) */}
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Usuario</DialogTitle>
                <DialogDescription>
                  Completa el formulario para registrar un nuevo usuario en el sistema.
                </DialogDescription>
              </DialogHeader>
              {/* <UserForm setOpen={setOpenCreate} /> */}
            </DialogContent>
          </Dialog>
        </div>
      </div>


    </DashboardLayoutSection>
  );
}
