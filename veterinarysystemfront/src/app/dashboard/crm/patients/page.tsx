"use client";

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
import { AnimalProvider } from "./context/animal-context";
import MainAnimals from "./components/main-animals";
import { AnimalForm } from "./form/animal-form";
import { PageContainer } from "@/components/page/page-container";
import { PageHeader } from "@/components/page/page-header";

export default function AnimalPage() {
  const [openCreate, setOpenCreate] = React.useState(false);

  return (
    <AnimalProvider>
      <DashboardLayoutSection>
        <PageContainer>
          <PageHeader
            title="Animales"
            description="Administra tu base de animales con registro, edición y control de estado"
            actions={
              <>
                <div className="flex items-center gap-2">
                  <Button onClick={() => setOpenCreate(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Registrar animal
                  </Button>
                </div>
              </>
            }
          />

          <MainAnimals />
        </PageContainer>
      </DashboardLayoutSection>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Animal</DialogTitle>
            <DialogDescription>
              Completa el formulario para registrar un nuevo animal en el sistema.
            </DialogDescription>
          </DialogHeader>
          <AnimalForm setOpen={setOpenCreate} />
        </DialogContent>
      </Dialog>
    </AnimalProvider>
  );
}
