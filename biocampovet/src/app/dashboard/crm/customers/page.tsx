'use client';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlusCircle } from "lucide-react";
import * as React from "react";
import DashboardLayoutSection from "../../dashboard-layout-section";
import MainCustomers from "./components/main-customers";
import { CustomerProvider } from "./context/customer-context";
import { CustomerForm } from "./form/customer-form";

export default function CustomerPage() {
  const [openCreate, setOpenCreate] = React.useState(false);

  return (
    <CustomerProvider>
      <DashboardLayoutSection>
        <div className="h-full bg-gray-50 p-4 sm:p-6">
          <div className="mx-auto flex h-full max-w-8xl flex-col">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Clientes</h1>
                <p className="mt-1 text-gray-600">
                  Gestiona el registro, edición y estado de tus clientes.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => setOpenCreate(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Registrar cliente
                </Button>
              </div>
            </div>

            <MainCustomers />
          </div>
        </div>
      </DashboardLayoutSection>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Cliente</DialogTitle>
            <DialogDescription>
              Completa el formulario para registrar un nuevo cliente.
            </DialogDescription>
          </DialogHeader>
          <CustomerForm setOpen={setOpenCreate} />
        </DialogContent>
      </Dialog>
    </CustomerProvider>
  );
}
