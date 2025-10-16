"use client";

import * as React from "react";
import { FloatingLabelSingleBadgeSelect } from "@/components/floating-label-single-select";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import CustomerService from "@/app/dashboard/customer/management/service/customer-service";
import AnimalService from "@/app/dashboard/patients/animals/service/animal-service";

interface AnimalSearchProps {
  onAnimalSelected: (animalId: number | undefined) => void;
}

export function AnimalSearch({ onAnimalSelected }: AnimalSearchProps) {
  const [customerOptions, setCustomerOptions] = React.useState<{ value: string; label: string }[]>(
    []
  );
  const [animalOptions, setAnimalOptions] = React.useState<{ value: string; label: string }[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string | undefined>(undefined);
  const [selectedAnimalId, setSelectedAnimalId] = React.useState<string>("");

  const searchCustomers = async (query: string) => {
    const customers = await CustomerService.searchCustomers(query);
    setCustomerOptions(
      customers.map((c) => ({
        value: c.id.toString(),
        label: `${c.name} - ${c.documentNumber}`,
      }))
    );
  };

  const searchAnimals = async (query: string) => {
    const animals = await AnimalService.searchAnimals(1, query);
    setAnimalOptions(
      animals.map((a) => ({
        value: a.id.toString(),
        label: a.name,
      }))
    );
  };

  React.useEffect(() => {
    searchCustomers("");
    searchAnimals("");
  }, []);

  const handleAnimalChange = (id: string) => {
    setSelectedAnimalId(id);
    onAnimalSelected(id ? Number(id) : undefined);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-4">
        {/* Dueño */}
        <div className="flex flex-col gap-2 min-w-[250px] flex-1">
          <label className="text-sm font-medium">Dueño</label>
          <FloatingLabelSingleBadgeSelect
            id="customer"
            label="Seleccionar Cliente"
            options={customerOptions}
            selected={selectedCustomerId}
            onChange={(id) => setSelectedCustomerId(id)}
            onSearch={(query) => searchCustomers(query)}
            emptyMessage="No se encontraron clientes."
          />
        </div>

        {/* Mascota */}
        <div className="flex flex-col gap-2 min-w-[250px] flex-1">
          <label className="text-sm font-medium">Animal</label>
          <FloatingLabelSelect
            id="animal"
            label="Seleccionar Animal"
            value={selectedAnimalId}
            onValueChange={handleAnimalChange}
            options={animalOptions}
          />
        </div>
      </div>
    </div>
  );
}
