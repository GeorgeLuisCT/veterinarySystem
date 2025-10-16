"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CustomerForm } from "@/app/dashboard/customer/management/form/customer-form";
import { AnimalForm } from "@/app/dashboard/patients/animals/form/animal-form";
import CustomerService from "@/app/dashboard/customer/management/service/customer-service";
import AnimalService from "@/app/dashboard/patients/animals/service/animal-service";
import { FloatingLabelMultiSelect } from "@/components/floating-label-multi-select";
import { CustomerQuickSearchResponse } from "@/app/dashboard/customer/management/types/customer-quick-search-response";
import { AnimalQuickSearchResponse } from "../../patients/animals/types/animal-quick-search-response";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { toast } from "sonner";

export enum OwnerAnimalPanel {
  CustomerCreate = "customer-create",
  AnimalCreate = "animal-create",
}

interface SaleFormProps {
  selectedCustomer?: CustomerQuickSearchResponse;
  selectedAnimals?: AnimalQuickSearchResponse[];
  onCustomerChange: (customer?: CustomerQuickSearchResponse) => void;
  onAnimalChange: (animals?: AnimalQuickSearchResponse[]) => void;
  currentSaleId: string;
}

export function SaleForm({
  selectedCustomer,
  selectedAnimals,
  onCustomerChange,
  onAnimalChange,
}: SaleFormProps) {
  const [customerOptions, setCustomerOptions] = React.useState<CustomerQuickSearchResponse[]>([]);
  const [animalOptions, setAnimalOptions] = React.useState<AnimalQuickSearchResponse[]>([]);
  const [activePanel, setActivePanel] = React.useState<OwnerAnimalPanel | null>(null);

  const searchCustomers = async (query: string) => {
    setAnimalOptions([]);
    if (!query.trim()) return;
    try {
      const customers = await CustomerService.searchCustomers(query);
      setCustomerOptions(customers);
    } catch (error) {
      console.error("Error buscando clientes:", error);
      toast.error("Error buscando clientes. Por favor, inténtalo de nuevo más tarde.");
    }
  };

  const searchAnimals = async (query: string) => {
    if (!selectedCustomer) {
      setAnimalOptions([]);
      return;
    }
    try {
      const animals = await AnimalService.searchAnimals(selectedCustomer.id, query);
      setAnimalOptions(animals);
    } catch (error) {
      toast.error("Error buscando animales. Por favor, inténtalo de nuevo más tarde.");
      console.error("Error buscando animales:", error);
    }
  };

  React.useEffect(() => {
    if (selectedCustomer) {
      setCustomerOptions([selectedCustomer]);
    }
    if (selectedAnimals && selectedAnimals.length > 0) {
      setAnimalOptions(selectedAnimals);
    }
  }, []);

  React.useEffect(() => {
    if (selectedCustomer) {
      searchAnimals("");
    } else {
      setAnimalOptions([]);
    }
  }, [selectedCustomer]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <label className="text-base font-semibold">Datos de venta</label>
          <span className="text-sm text-gray-500">
            {new Date().toLocaleString("es-PE", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })}
          </span>
        </div>

        <div className="flex items-center gap-2 min-w-[250px] flex-1">
          <FloatingLabelSelect
            id="customerId"
            label="Seleccionar cliente"
            value={selectedCustomer ? String(selectedCustomer.id) : ""}
            onValueChange={(value) => {
              const selected = customerOptions.find((c) => String(c.id) === value);
              onCustomerChange(selected ?? undefined);
              onAnimalChange([]);
            }}
            onSearch={searchCustomers}
            emptyMessage="No se encontraron clientes."
            options={customerOptions.map((c) => ({
              value: String(c.id),
              label: c.name + " - " + c.documentNumber,
            }))}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setActivePanel(OwnerAnimalPanel.CustomerCreate)}
          >
            + Nuevo
          </Button>
        </div>

        {selectedCustomer && (
          <div className="flex items-center gap-2 min-w-[250px] flex-1">
            <FloatingLabelMultiSelect
              id="animal"
              label="Seleccionar animales"
              options={animalOptions.map((a) => ({ value: a.id, label: a.name }))}
              selected={selectedAnimals?.map((animal) => animal.id) ?? []}
              onChange={(ids) =>
                onAnimalChange(
                  ids
                    .map((id) => animalOptions.find((a) => a.id === id))
                    .filter(Boolean) as AnimalQuickSearchResponse[]
                )
              }
              onSearch={(query) => searchAnimals(query)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActivePanel(OwnerAnimalPanel.AnimalCreate)}
            >
              + Nuevo
            </Button>
          </div>
        )}
      </div>

      <Dialog
        open={activePanel === OwnerAnimalPanel.CustomerCreate}
        onOpenChange={() => setActivePanel(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Cliente</DialogTitle>
            <DialogDescription>Agrega un nuevo cliente al sistema.</DialogDescription>
          </DialogHeader>
          <CustomerForm
            setOpen={() => {
              setActivePanel(null);
              searchCustomers("");
            }}
            onSuccess={(newCustomer) => {
              onCustomerChange(newCustomer);
              setCustomerOptions((prev) => {
                const exists = prev.some((c) => c.id === newCustomer.id);
                return exists ? prev : [...prev, newCustomer];
              });
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={activePanel === OwnerAnimalPanel.AnimalCreate}
        onOpenChange={() => setActivePanel(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Animal de {selectedCustomer?.name}</DialogTitle>
            <DialogDescription>Agrega una nueva mascota al sistema.</DialogDescription>
          </DialogHeader>
          <AnimalForm
            setOpen={() => {
              setActivePanel(null);
              searchAnimals("");
            }}
            onSuccess={(newAnimal) => {
              onAnimalChange([...(selectedAnimals ?? []), newAnimal]);
              setAnimalOptions((prev) => {
                const exists = prev.some((a) => a.id === newAnimal.id);
                return exists ? prev : [...prev, newAnimal];
              });
            }}
            fixedCustomer={selectedCustomer}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
