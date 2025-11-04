"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { FloatingLabelDateInput } from "@/components/floating-label-date-input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import AnimalService from "../service/animal-service";
import { useAnimalContext } from "../context/animal-context";
import { animalCreateSchema, AnimalRequest, animalUpdateSchema } from "../types/animal-request";
import { mapToCreateAnimalRequest, mapToUpdateAnimalRequest } from "../helpers/animal-mapper";
import { AnimalSummaryResponse } from "../types/animal-summary-response";
import { CustomerQuickSearchResponse } from "../../customers/types/customer-quick-search-response";
import CustomerService from "../../customers/service/customer-service";
import { getAaxiosErrorMessage } from "@/helpers/error";
import { AnimalSpecies, AnimalSpeciesOptions } from "../enums/animal-species";

interface AnimalFormProps {
  setOpen: (open: boolean) => void;
  animalId?: number;
  animalContext?: ReturnType<typeof useAnimalContext>;
  onSuccess?: (animal: AnimalSummaryResponse) => void;
  fixedCustomer?: CustomerQuickSearchResponse;
}

export function AnimalForm({
  setOpen,
  animalId,
  animalContext,
  onSuccess,
  fixedCustomer,
}: AnimalFormProps) {
  const [ownersList, setOwnersList] = React.useState<CustomerQuickSearchResponse[]>([]);
  const [loading, setLoading] = React.useState(true);

  const schema = animalId ? animalUpdateSchema : animalCreateSchema;

  const form = useForm<AnimalRequest>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      ownerId: fixedCustomer ? fixedCustomer.id : 0,
      species: AnimalSpecies.CANINE,
      breed: "",
      birthDate: "",
    },
  });

  React.useEffect(() => {
    async function fetchData() {
      try {
        if (!fixedCustomer) {
          setOwnersList([]);
        }

        if (animalId) {
          const animal = await AnimalService.getAnimal(animalId);
          form.reset({
            name: animal.name,
            ownerId: fixedCustomer ? fixedCustomer.id : animal.owner.id,
            species: (animal.species as AnimalSpecies) ?? AnimalSpecies.CANINE,
            breed: animal.breed ?? "",
            birthDate: animal.birthDate ?? "",
            id: animal.id,
          });
        }
      } catch (error: unknown) {
        const message = getAaxiosErrorMessage(error) || "Error al procesar el animal";
        toast.error(message);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [animalId, form, fixedCustomer, setOpen]);

  const searchCustomers = async (query: string) => {
    if (!query.trim()) return;
    try {
      const customers = await CustomerService.searchCustomers(query);
      setOwnersList(customers);
    } catch (error) {
      console.error("Error buscando clientes:", error);
      toast.error("Error buscando clientes. Por favor, inténtalo de nuevo más tarde.");
    }
  };

  const onSubmit = async (data: AnimalRequest) => {
    try {
      if (animalId) {
        const updatedAnimal = await AnimalService.updateAnimal(
          mapToUpdateAnimalRequest(data, animalId)
        );
        toast.success("Animal actualizado correctamente");
        animalContext?.updateAnimal(updatedAnimal);
        onSuccess?.(updatedAnimal);
      } else {
        const createdAnimal = await AnimalService.createAnimal(mapToCreateAnimalRequest(data));
        toast.success("Animal registrado exitosamente!");
        animalContext?.addAnimal(createdAnimal);
        onSuccess?.(createdAnimal);
      }
      form.reset();
      setOpen(false);
    } catch (error: unknown) {
      const message = getAaxiosErrorMessage(error) || "Error al procesar el animal";
      toast.error(message);
    }
  };

  return (
    <div className="max-h-[80vh] overflow-auto p-4">
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="animate-spin w-6 h-6 text-gray-600" />
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!fixedCustomer && (
              <FormField
                control={form.control}
                name="ownerId"
                render={({ field }) => (
                  <FormItem className="gap-0">
                    <FormControl>
                      <FloatingLabelSelect
                        id="ownerId"
                        label="Dueño"
                        value={String(field.value ?? "")}
                        onSearch={searchCustomers}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        options={ownersList.map((owner) => ({
                          value: String(owner.id),
                          label: owner.name,
                        }))}
                      />
                    </FormControl>
                    <FormMessage className="ml-2" />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="gap-0">
                  <FormControl>
                    <FloatingLabelInput
                      {...field}
                      id="name"
                      label="Nombre del Animal"
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage className="ml-2" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="species"
              render={({ field }) => (
                <FormItem className="gap-0">
                  <FormControl>
                    <FloatingLabelSelect
                      id="species"
                      label="Especie"
                      value={String(field.value ?? "")}
                      onValueChange={(value) => field.onChange(value as AnimalSpecies)}
                      options={AnimalSpeciesOptions}
                    />
                  </FormControl>
                  <FormMessage className="ml-2" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="breed"
              render={({ field }) => (
                <FormItem className="gap-0">
                  <FormControl>
                    <FloatingLabelInput
                      {...field}
                      id="breed"
                      label="Raza"
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage className="ml-2" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="birthDate"
              render={({ field }) => (
                <FormItem className="gap-0">
                  <FormControl>
                    <FloatingLabelDateInput
                      id="birthDate"
                      label="Fecha de Nacimiento"
                      value={field.value}
                      onChange={field.onChange}
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage className="ml-2" />
                </FormItem>
              )}
            />

            <div className="flex justify-center">
              <Button type="submit" disabled={form.formState.isSubmitting} className="w-48">
                {form.formState.isSubmitting && <Loader2 className="animate-spin mr-2" size={16} />}
                {animalId ? "Guardar" : "Registrar"}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
