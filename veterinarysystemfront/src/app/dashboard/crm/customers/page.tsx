"use client";

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
import { PageContainer } from "@/components/page/page-container";
import { PageHeader } from "@/components/page/page-header";

export default function CustomerPage() {
  const [openCreate, setOpenCreate] = React.useState(false);

  return (
    <CustomerProvider>
      <DashboardLayoutSection>
        <PageContainer>
          <PageHeader
            title="Clientes"
            description="Gestiona el registro, edición y estado de tus clientes."
            actions={
              <>
                <div className="flex items-center gap-2">
                  <Button onClick={() => setOpenCreate(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Registrar cliente
                  </Button>
                </div>
              </>
            }
          />

          <MainCustomers />
        </PageContainer>
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
