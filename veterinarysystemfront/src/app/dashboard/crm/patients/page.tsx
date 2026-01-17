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
import { AnimalProvider } from "./context/animal-context";
import MainAnimals from "./components/main-animals";
import { AnimalForm } from "./form/animal-form";

export default function AnimalPage() {
  const [openCreate, setOpenCreate] = React.useState(false);

  return (
    <AnimalProvider>
      <DashboardLayoutSection>
        <div className="h-full bg-gray-50 p-4 sm:p-6">
          <div className="mx-auto flex h-full max-w-8xl flex-col">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Animales</h1>
                <p className="mt-1 text-gray-600">
                  Administra tu base de animales con registro, edición y control de estado
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => setOpenCreate(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Registrar animal
                </Button>
              </div>
            </div>

            <MainAnimals />
          </div>
        </div>
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
