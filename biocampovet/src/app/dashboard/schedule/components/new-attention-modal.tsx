"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";
import { useUser } from "@/context/user-context";
import AnimalService from "@/app/dashboard/patients/animals/service/animal-service";
import EmployeeService from "@/app/dashboard/staff/employees/service/employee-service";
import ClinicalServiceService from "@/app/dashboard/clinical/service/clinical-service-service";
import { BranchService } from "@/app/dashboard/branche/services/branch-service";

import AttentionService from "../service/attention-service";
import { AttentionResponse } from "../types/attention-response";
import {
  createAttentionSchema,
  CreateAttentionRequest,
} from "../types/attention-request";
import { AttentionType, AttentionTypeOptions } from "../enums/attention-type";
import { AttentionStatus, AttentionStatusOptions } from "../enums/attention-status";
import { ClinicalServiceCategory } from "@/app/dashboard/clinical/enums/clinical-service-category";

type Option = {
  id: number;
  label: string;
};

interface NewAttentionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (attention: AttentionResponse) => void;
}

const DATE_TIME_INPUT_FORMAT = "yyyy-MM-dd'T'HH:mm";

export function NewAttentionModal({ open, onOpenChange, onCreated }: NewAttentionModalProps) {
  const { toast } = useToast();
  const { userInfo } = useUser();

  const selectedBranch = userInfo?.selectedBranch ?? null;
  const selectedBranchId = selectedBranch?.id ?? null;
  const hasFixedBranch = selectedBranchId !== null && selectedBranchId !== 0;
  const fixedBranchId = hasFixedBranch ? selectedBranchId : undefined;

  const [initialLoading, setInitialLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const [animalOptions, setAnimalOptions] = React.useState<Option[]>([]);
  const [employeeOptions, setEmployeeOptions] = React.useState<Option[]>([]);
  const [serviceOptions, setServiceOptions] = React.useState<Option[]>([]);
  const [branchOptions, setBranchOptions] = React.useState<Option[]>([]);
  const [branchesLoading, setBranchesLoading] = React.useState(false);

  const createDefaultValues = React.useCallback(
    (): Partial<CreateAttentionRequest> => ({
      branchId: fixedBranchId,
      checkInTime: format(new Date(), DATE_TIME_INPUT_FORMAT),
      type: AttentionType.CLINIC,
      status: AttentionStatus.WAITING,
      emergency: false,
    }),
    [fixedBranchId]
  );

  const form = useForm<CreateAttentionRequest>({
    resolver: zodResolver(createAttentionSchema),
    defaultValues: createDefaultValues(),
  });

  const branchId = form.watch("branchId");
  const attentionType = form.watch("type") ?? AttentionType.CLINIC;

  const loadAnimals = React.useCallback(
    async (query?: string) => {
      try {
        const response = await AnimalService.getAnimals({
          page: 0,
          size: 20,
          active: true,
          query: query?.trim() ? query.trim() : undefined,
        });

        const options = response.content.map((animal) => ({
          id: animal.id,
          label: `${animal.name} • ${animal.ownerName}`,
        }));
        setAnimalOptions(options);
        return options;
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: getAaxiosErrorMessage(error) ?? "No se pudieron cargar las mascotas.",
        });
        setAnimalOptions([]);
        return [];
      }
    },
    [toast]
  );

  const loadEmployees = React.useCallback(
    async (branch?: number, query?: string) => {
      if (!branch) {
        setEmployeeOptions([]);
        return [];
      }

      try {
        if (query?.trim()) {
          const results = await EmployeeService.searchEmployees(query.trim(), branch);
          const options = results.map((employee) => ({
            id: employee.id,
            label: employee.fullName,
          }));
          setEmployeeOptions(options);
          return options;
        }

        const response = await EmployeeService.getEmployees({
          active: true,
          page: 0,
          size: 20,
          branchId: branch,
        });

        const options = response.content.map((employee) => ({
          id: employee.id,
          label: `${employee.firstName} ${employee.lastName}`,
        }));
        setEmployeeOptions(options);
        return options;
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: getAaxiosErrorMessage(error) ?? "No se pudieron cargar los profesionales.",
        });
        setEmployeeOptions([]);
        return [];
      }
    },
    [toast]
  );

  const loadServices = React.useCallback(
    async (type: AttentionType, query?: string) => {
      try {
        const response = await ClinicalServiceService.list({
          page: 0,
          size: 20,
          q: query?.trim() ? query.trim() : undefined,
          category:
            type === AttentionType.GROOMING
              ? ClinicalServiceCategory.GROOMING
              : type === AttentionType.SURGERY
              ? ClinicalServiceCategory.SURGERY
              : undefined,
        });

        const filtered = response.content.filter((service) => {
          if (type === AttentionType.GROOMING) {
            return service.clinicalServiceCategory === ClinicalServiceCategory.GROOMING;
          }
          if (type === AttentionType.SURGERY) {
            return service.clinicalServiceCategory === ClinicalServiceCategory.SURGERY;
          }
          return (
            service.clinicalServiceCategory !== ClinicalServiceCategory.GROOMING &&
            service.clinicalServiceCategory !== ClinicalServiceCategory.SURGERY
          );
        });

        const options = filtered.map((service) => ({
          id: service.id,
          label: service.name,
        }));
        setServiceOptions(options);
        return options;
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: getAaxiosErrorMessage(error) ?? "No se pudieron cargar los servicios.",
        });
        setServiceOptions([]);
        return [];
      }
    },
    [toast]
  );

  const loadBranches = React.useCallback(async () => {
    setBranchesLoading(true);
    try {
      const branches = await BranchService.getBranchesByLoggedEmployee();
      setBranchOptions(
        branches.map((branch) => ({
          id: branch.id,
          label: branch.name,
        }))
      );
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: getAaxiosErrorMessage(error) ?? "No se pudieron cargar las sucursales.",
      });
      setBranchOptions([]);
    } finally {
      setBranchesLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    if (!open) return;

    const prepareData = async () => {
      setInitialLoading(true);
      const currentBranch = form.getValues("branchId") ?? fixedBranchId;
      const currentType = form.getValues("type") ?? AttentionType.CLINIC;

      try {
        await Promise.all([
          loadAnimals(),
          loadServices(currentType),
          currentBranch ? loadEmployees(currentBranch) : Promise.resolve([]),
          hasFixedBranch ? Promise.resolve() : loadBranches(),
        ]);
      } finally {
        setInitialLoading(false);
      }
    };

    void prepareData();
  }, [
    open,
    form,
    fixedBranchId,
    hasFixedBranch,
    loadAnimals,
    loadEmployees,
    loadServices,
    loadBranches,
  ]);

  React.useEffect(() => {
    if (!open) return;
    form.setValue("checkInTime", format(new Date(), DATE_TIME_INPUT_FORMAT), {
      shouldDirty: false,
    });
  }, [open, form]);

  React.useEffect(() => {
    if (!hasFixedBranch || !fixedBranchId) {
      return;
    }
    form.setValue("branchId", fixedBranchId, { shouldValidate: true });
  }, [hasFixedBranch, fixedBranchId, form]);

  React.useEffect(() => {
    if (!open) return;

    if (!branchId) {
      setEmployeeOptions([]);
      form.setValue("attendingEmployeeId", 0, { shouldValidate: false });
      return;
    }

    void loadEmployees(branchId);
  }, [branchId, open, form, loadEmployees]);

  React.useEffect(() => {
    if (!open || !attentionType) {
      return;
    }

    form.setValue("clinicalServiceId", 0, { shouldValidate: false });
    void loadServices(attentionType);
  }, [attentionType, open, form, loadServices]);

  const handleSearchAnimals = React.useCallback(
    (query: string) => {
      void loadAnimals(query);
    },
    [loadAnimals]
  );

  const handleSearchEmployees = React.useCallback(
    (query: string) => {
      void loadEmployees(branchId, query);
    },
    [branchId, loadEmployees]
  );

  const handleSearchServices = React.useCallback(
    (query: string) => {
      void loadServices(attentionType ?? AttentionType.CLINIC, query);
    },
    [attentionType, loadServices]
  );

  const handleModalToggle = React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        form.reset(createDefaultValues());
        setAnimalOptions([]);
        setEmployeeOptions([]);
        setServiceOptions([]);
        if (!hasFixedBranch) {
          setBranchOptions([]);
        }
      }
      onOpenChange(nextOpen);
    },
    [createDefaultValues, form, hasFixedBranch, onOpenChange]
  );

  const onSubmit = React.useCallback(
    async (values: CreateAttentionRequest) => {
      setSubmitting(true);
      try {
        const normalizedCheckIn =
          values.checkInTime && values.checkInTime.length === 16
            ? `${values.checkInTime}:00`
            : values.checkInTime;

        const payload: CreateAttentionRequest = {
          ...values,
          checkInTime: normalizedCheckIn,
          emergency: values.emergency ?? false,
        };

        const response = await AttentionService.create(payload);
        toast({
          title: "Atención registrada",
          description: "Se creó la atención correctamente.",
        });
        onCreated?.(response);
        handleModalToggle(false);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error al registrar la atención",
          description: getAaxiosErrorMessage(error) ?? "No se pudo crear la atención.",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [handleModalToggle, onCreated, toast]
  );

  return (
    <Dialog open={open} onOpenChange={handleModalToggle}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registrar atención</DialogTitle>
          <DialogDescription>
            Completa la información para registrar una atención inmediata.
          </DialogDescription>
        </DialogHeader>

        {initialLoading ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Cargando información...
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {!hasFixedBranch && (
                  <FormField
                    control={form.control}
                    name="branchId"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <FloatingLabelSelect
                            id="attention-branchId"
                            label="Sucursal"
                            value={field.value ? String(field.value) : ""}
                            onValueChange={(value) => field.onChange(Number(value))}
                            options={branchOptions.map((branch) => ({
                              value: String(branch.id),
                              label: branch.label,
                            }))}
                            disabled={branchesLoading || submitting}
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
                          id="attention-animalId"
                          label="Mascota"
                          value={field.value ? String(field.value) : ""}
                          onValueChange={(value) => field.onChange(Number(value))}
                          options={animalOptions.map((animal) => ({
                            value: String(animal.id),
                            label: animal.label,
                          }))}
                          onSearch={handleSearchAnimals}
                          disabled={submitting}
                          emptyMessage="No se encontraron mascotas."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FloatingLabelSelect
                          id="attention-type"
                          label="Tipo de atención"
                          value={field.value ?? ""}
                          onValueChange={(value) => field.onChange(value as AttentionType)}
                          options={AttentionTypeOptions.map((option) => ({
                            value: option.value,
                            label: option.label,
                          }))}
                          disabled={submitting}
                          emptyMessage="No se encontraron tipos disponibles."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FloatingLabelSelect
                          id="attention-status"
                          label="Estado"
                          value={field.value ?? ""}
                          onValueChange={(value) => field.onChange(value as AttentionStatus)}
                          options={AttentionStatusOptions.map((option) => ({
                            value: option.value,
                            label: option.label,
                          }))}
                          disabled={submitting}
                          emptyMessage="No se encontraron estados."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="attendingEmployeeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FloatingLabelSelect
                          id="attention-attendingEmployeeId"
                          label="Profesional responsable"
                          value={field.value ? String(field.value) : ""}
                          onValueChange={(value) => field.onChange(Number(value))}
                          options={employeeOptions.map((employee) => ({
                            value: String(employee.id),
                            label: employee.label,
                          }))}
                          onSearch={handleSearchEmployees}
                          disabled={submitting || !branchId}
                          emptyMessage={
                            branchId ? "No se encontraron profesionales." : "Seleccione primero una sucursal."
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clinicalServiceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FloatingLabelSelect
                          id="attention-clinicalServiceId"
                          label="Servicio"
                          value={field.value ? String(field.value) : ""}
                          onValueChange={(value) => field.onChange(Number(value))}
                          options={serviceOptions.map((service) => ({
                            value: String(service.id),
                            label: service.label,
                          }))}
                          onSearch={handleSearchServices}
                          disabled={submitting}
                          emptyMessage="No se encontraron servicios."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="checkInTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FloatingLabelInput
                          id="attention-checkInTime"
                          label="Fecha y hora de registro"
                          type="datetime-local"
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          disabled={submitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emergency"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                      <div className="space-y-0.5">
                        <span className="text-sm font-medium text-foreground">Emergencia</span>
                        <p className="text-xs text-muted-foreground">
                          Activa esta opción si la atención requiere prioridad.
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value ?? false}
                          onCheckedChange={(checked) => field.onChange(checked)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => handleModalToggle(false)} disabled={submitting}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar atención
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default NewAttentionModal;
