"use client";

import * as React from "react";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import CustomerService from "@/app/dashboard/customer/management/service/customer-service";
import AnimalService from "@/app/dashboard/patients/animals/service/animal-service";
import { CustomerQuickSearchResponse } from "@/app/dashboard/customer/management/types/customer-quick-search-response";
import { AnimalQuickSearchResponse } from "@/app/dashboard/patients/animals/types/animal-quick-search-response";
import { toast } from "sonner";

interface Props {
  selectedCustomerId?: number;
  selectedAnimalId?: number;
  onCustomerChange: (customerId?: number) => void;
  onAnimalChange: (animalId?: number) => void;
}

export function OwnerAnimalSelector({
  selectedCustomerId,
  selectedAnimalId,
  onCustomerChange,
  onAnimalChange,
}: Props) {
  const [customerOptions, setCustomerOptions] = React.useState<CustomerQuickSearchResponse[]>([]);
  const [animalOptions, setAnimalOptions] = React.useState<AnimalQuickSearchResponse[]>([]);

  const selectedCustomer = customerOptions.find((c) => c.id === selectedCustomerId);
  const selectedAnimal = animalOptions.find((a) => a.id === selectedAnimalId);

  const searchCustomers = async (query: string) => {
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
      searchAnimals("");
    } else {
      setAnimalOptions([]);
    }
  }, [selectedCustomer]);

  return (
    <div className="flex flex-col gap-4">
      <FloatingLabelSelect
        id="customerId"
        label="Seleccionar cliente"
        value={selectedCustomer ? String(selectedCustomer.id) : ""}
        onValueChange={(value) => {
          const selected = customerOptions.find((c) => String(c.id) === value);
          onCustomerChange(selected?.id ?? undefined);
          onAnimalChange(undefined);
        }}
        onSearch={searchCustomers}
        emptyMessage="No se encontraron clientes."
        options={customerOptions.map((c) => ({
          value: String(c.id),
          label: `${c.name} - ${c.documentNumber}`,
        }))}
      />

      {selectedCustomer && (
        <FloatingLabelSelect
          id="animalId"
          label="Seleccionar animal"
          value={selectedAnimal ? String(selectedAnimal.id) : ""}
          onValueChange={(value) => {
            const selected = animalOptions.find((a) => String(a.id) === value);
            onAnimalChange(selected?.id ?? undefined);
          }}
          onSearch={searchAnimals}
          emptyMessage="No se encontraron animales."
          options={animalOptions.map((a) => ({
            value: String(a.id),
            label: a.name,
          }))}
        />
      )}
    </div>
  );
}
