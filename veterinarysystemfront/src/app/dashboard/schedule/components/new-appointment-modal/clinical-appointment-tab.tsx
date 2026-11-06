import * as React from "react";
import { type UseFormReturn } from "react-hook-form";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { FloatingLabelDateInput } from "@/components/floating-label-date-input";
import { Textarea } from "@/components/ui/textarea";
import type { CreateClinicalAppointmentRequest } from "../../types/appointment-request";
import ClinicalServiceService from "@/app/dashboard/clinical/service/clinical-service-service";
import { ClinicalServiceCategory } from "@/app/dashboard/clinical/enums/clinical-service-category";
import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";
import type { Option } from "../types";

interface ClinicalAppointmentTabProps {
  form: UseFormReturn<CreateClinicalAppointmentRequest>;
  onSubmit: (values: CreateClinicalAppointmentRequest) => Promise<void>;
  onCancel: () => void;
  hasFixedBranch: boolean;
  branchOptions: Option[];
  branchesLoading: boolean;
  syncBranchBetweenForms: (value: number, source: "clinical" | "grooming" | "surgical") => void;
  animalOptions: Option[];
  onSearchAnimals: (query: string) => void;
  loadEmployees: (query?: string) => Promise<Option[]>;
  open: boolean;
}

export function ClinicalAppointmentTab({
  form,
  onSubmit,
  onCancel,
  hasFixedBranch,
  branchOptions,
  branchesLoading,
  syncBranchBetweenForms,
  animalOptions,
  onSearchAnimals,
  loadEmployees,
  open,
}: ClinicalAppointmentTabProps) {
  const isSubmitting = form.formState.isSubmitting;
  const { toast } = useToast();

  const [serviceOptions, setServiceOptions] = React.useState<Option[]>([]);
  const [veterinarianOptions, setVeterinarianOptions] = React.useState<Option[]>([]);

  const fetchClinicalServices = React.useCallback(
    async (query?: string) => {
      try {
        const response = await ClinicalServiceService.list({
          page: 0,
          size: 20,
          q: query?.trim() ? query.trim() : undefined,
        });

        return response.content
          .filter((service) => service.clinicalServiceCategory !== ClinicalServiceCategory.GROOMING)
          .map((service) => ({
            id: service.id,
            label: service.name,
          }));
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description:
            getAaxiosErrorMessage(error) ?? "No se pudieron cargar los servicios clínicos.",
        });
        return [];
      }
    },
    [toast]
  );

  const refreshClinicalServices = React.useCallback(
    async (query?: string) => {
      const options = await fetchClinicalServices(query);
      setServiceOptions(options);
    },
    [fetchClinicalServices]
  );

  const refreshVeterinarians = React.useCallback(
    async (query?: string) => {
      const employees = await loadEmployees(query);
      setVeterinarianOptions(employees);
    },
    [loadEmployees]
  );

  React.useEffect(() => {
    if (!open) {
      setServiceOptions([]);
      setVeterinarianOptions([]);
      return;
    }

    let mounted = true;
    void (async () => {
      const [services, veterinarians] = await Promise.all([
        fetchClinicalServices(),
        loadEmployees(),
      ]);

      if (!mounted) return;
      setServiceOptions(services);
      setVeterinarianOptions(veterinarians);
    })();

    return () => {
      mounted = false;
    };
  }, [open, fetchClinicalServices, loadEmployees]);

  const handleSearchClinicalServices = React.useCallback(
    (query: string) => {
      void refreshClinicalServices(query);
    },
    [refreshClinicalServices]
  );

  const handleSearchVeterinarians = React.useCallback(
    (query: string) => {
      void refreshVeterinarians(query);
    },
    [refreshVeterinarians]
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <fieldset className="border-t pt-4 first:border-t-0 first:pt-0">
          <legend className="mb-3 text-sm font-semibold text-foreground">Contexto de la cita</legend>
          <div className="grid gap-4 md:grid-cols-2">
            {!hasFixedBranch && (
              <FormField
                control={form.control}
                name="branchId"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelSelect
                        id="clinical-branchId"
                        label="Sucursal"
                        value={field.value ? String(field.value) : ""}
                        onValueChange={(value) => {
                          const numericValue = Number(value);
                          field.onChange(numericValue);
                          syncBranchBetweenForms(numericValue, "clinical");
                        }}
                        options={branchOptions.map((branch) => ({
                          value: String(branch.id),
                          label: branch.label,
                        }))}
                        disabled={branchesLoading || isSubmitting}
                        emptyMessage="No se encontraron sucursales."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="animalId"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelSelect
                      id="clinical-animalId"
                      label="Mascota"
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(value) => field.onChange(Number(value))}
                      options={animalOptions.map((animal) => ({
                        value: String(animal.id),
                        label: animal.label,
                      }))}
                      onSearch={onSearchAnimals}
                      disabled={isSubmitting}
                      emptyMessage="No se encontraron mascotas."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </fieldset>

        <fieldset className="border-t pt-4 first:border-t-0 first:pt-0">
          <legend className="mb-3 text-sm font-semibold text-foreground">Servicio y profesional</legend>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="clinicalServiceId"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelSelect
                      id="clinical-serviceId"
                      label="Servicio clínico"
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(value) => field.onChange(Number(value))}
                      options={serviceOptions.map((service) => ({
                        value: String(service.id),
                        label: service.label,
                      }))}
                      onSearch={handleSearchClinicalServices}
                      disabled={isSubmitting}
                      emptyMessage="No se encontraron servicios."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="veterinarianId"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelSelect
                      id="clinical-veterinarianId"
                      label="Veterinario responsable"
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(value) => field.onChange(Number(value))}
                      options={veterinarianOptions.map((employee) => ({
                        value: String(employee.id),
                        label: employee.label,
                      }))}
                      onSearch={handleSearchVeterinarians}
                      disabled={isSubmitting}
                      emptyMessage="No se encontraron profesionales."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </fieldset>

        <fieldset className="border-t pt-4 first:border-t-0 first:pt-0">
          <legend className="mb-3 text-sm font-semibold text-foreground">Programación</legend>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="startDateTime"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelDateInput
                      id="clinical-startDateTime"
                      label="Fecha y hora"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      disabled={isSubmitting}
                      mode="datetime"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estimatedDurationMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelInput
                      id="clinical-estimatedDurationMinutes"
                      label="Duración estimada (min)"
                      type="number"
                      step={1}
                      value={field.value ?? ""}
                      onChange={(value) => {
                        if (value === "") {
                          field.onChange(null);
                        } else {
                          field.onChange(Number(value));
                        }
                      }}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </fieldset>

        <fieldset className="border-t pt-4 first:border-t-0 first:pt-0">
          <legend className="mb-3 text-sm font-semibold text-foreground">Observaciones</legend>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="consultationReason"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      id="clinical-consultationReason"
                      placeholder="Motivo de la consulta (opcional)"
                      value={field.value ?? ""}
                      onChange={(event) => field.onChange(event.target.value)}
                      disabled={isSubmitting}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clinicalNotes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      id="clinical-clinicalNotes"
                      placeholder="Notas clínicas adicionales (opcional)"
                      value={field.value ?? ""}
                      onChange={(event) => field.onChange(event.target.value)}
                      disabled={isSubmitting}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </fieldset>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar cita
          </Button>
        </div>
      </form>
    </Form>
  );
}
