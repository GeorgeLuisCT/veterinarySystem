import * as React from "react";
import { type UseFormReturn } from "react-hook-form";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { Textarea } from "@/components/ui/textarea";
import type { CreateSurgicalAppointmentRequest } from "../../types/appointment-request";
import ClinicalServiceService from "@/app/dashboard/clinical/service/clinical-service-service";
import { ClinicalServiceCategory } from "@/app/dashboard/clinical/enums/clinical-service-category";
import { OperatingRoomService } from "@/app/dashboard/branche/services/operating-room-service";
import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";
import type { Option, SelectOption } from "../types";
import SurgicalOrderService from "../../service/surgical-order-service";

interface SurgicalAppointmentTabProps {
  form: UseFormReturn<CreateSurgicalAppointmentRequest>;
  onSubmit: (values: CreateSurgicalAppointmentRequest) => Promise<void>;
  onCancel: () => void;
  hasFixedBranch: boolean;
  branchOptions: Option[];
  branchesLoading: boolean;
  syncBranchBetweenForms: (value: number, source: "clinical" | "grooming" | "surgical") => void;
  animalOptions: Option[];
  onSearchAnimals: (query: string) => void;
  loadEmployees: (query?: string) => Promise<Option[]>;
  open: boolean;
  selectedBranchId: number | null;
}

export function SurgicalAppointmentTab({
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
  selectedBranchId,
}: SurgicalAppointmentTabProps) {
  const isSubmitting = form.formState.isSubmitting;
  const { toast } = useToast();

  const [serviceOptions, setServiceOptions] = React.useState<Option[]>([]);
  const [surgeonOptions, setSurgeonOptions] = React.useState<Option[]>([]);
  const [anesthetistEmployeeOptions, setAnesthetistEmployeeOptions] = React.useState<Option[]>([]);
  const [operatingRoomOptions, setOperatingRoomOptions] = React.useState<Option[]>([]);
  const [surgicalOrderOptions, setSurgicalOrderOptions] = React.useState<Option[]>([]);
  const [surgicalOrdersLoading, setSurgicalOrdersLoading] = React.useState(false);
  const [operatingRoomsLoading, setOperatingRoomsLoading] = React.useState(false);

  const animalId = form.watch("animalId");
  const branchId = form.watch("branchId");

  const fetchSurgicalServices = React.useCallback(
    async (query?: string) => {
      try {
        const response = await ClinicalServiceService.list({
          page: 0,
          size: 20,
          q: query?.trim() ? query.trim() : undefined,
          category: ClinicalServiceCategory.SURGERY,
        });

        return response.content.map((service) => ({
          id: service.id,
          label: service.name,
        }));
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description:
            getAaxiosErrorMessage(error) ?? "No se pudieron cargar los servicios quirúrgicos.",
        });
        return [];
      }
    },
    [toast]
  );

  const refreshSurgicalServices = React.useCallback(
    async (query?: string) => {
      const options = await fetchSurgicalServices(query);
      setServiceOptions(options);
    },
    [fetchSurgicalServices]
  );

  const loadOperatingRoomsByBranch = React.useCallback(
    async (branch: number) => {
      setOperatingRoomsLoading(true);
      try {
        const rooms = await OperatingRoomService.listByBranch(branch);
        return rooms.map((room) => ({
          id: room.id,
          label: room.branchName ? `${room.branchName} • ${room.name}` : room.name,
        }));
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description:
            getAaxiosErrorMessage(error) ?? "No se pudieron cargar los quirófanos.",
        });
        return [];
      } finally {
        setOperatingRoomsLoading(false);
      }
    },
    [toast]
  );

  const fetchSurgicalOrders = React.useCallback(
    async (animal: number) => {
      setSurgicalOrdersLoading(true);
      try {
        const orders = await SurgicalOrderService.getPendingByAnimal(animal);
        return orders.map((order) => ({
          id: order.id,
          label: `#${order.id} • ${order.recommendedServiceName}`,
        }));
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description:
            getAaxiosErrorMessage(error) ?? "No se pudieron cargar las órdenes quirúrgicas pendientes.",
        });
        return [];
      } finally {
        setSurgicalOrdersLoading(false);
      }
    },
    [toast]
  );

  const refreshSurgeons = React.useCallback(
    async (query?: string) => {
      const employees = await loadEmployees(query);
      setSurgeonOptions(employees);
    },
    [loadEmployees]
  );

  const refreshAnesthetists = React.useCallback(
    async (query?: string) => {
      const employees = await loadEmployees(query);
      setAnesthetistEmployeeOptions(employees);
    },
    [loadEmployees]
  );

  React.useEffect(() => {
    if (!open) {
      setServiceOptions([]);
      setSurgeonOptions([]);
      setAnesthetistEmployeeOptions([]);
      setOperatingRoomOptions([]);
      setSurgicalOrderOptions([]);
      setSurgicalOrdersLoading(false);
      setOperatingRoomsLoading(false);
      return;
    }

    let mounted = true;
    void (async () => {
      const [services, employees] = await Promise.all([
        fetchSurgicalServices(),
        loadEmployees(),
      ]);
      if (!mounted) return;
      setServiceOptions(services);
      setSurgeonOptions(employees);
      setAnesthetistEmployeeOptions(employees);
    })();

    return () => {
      mounted = false;
    };
  }, [open, fetchSurgicalServices, loadEmployees]);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    const branchForRooms = branchId ?? selectedBranchId ?? 0;
    if (!branchForRooms) {
      setOperatingRoomOptions([]);
      return;
    }

    let mounted = true;
    void (async () => {
      const rooms = await loadOperatingRoomsByBranch(branchForRooms);
      if (!mounted) return;
      setOperatingRoomOptions(rooms);
    })();

    return () => {
      mounted = false;
    };
  }, [open, branchId, selectedBranchId, loadOperatingRoomsByBranch]);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    if (!animalId) {
      setSurgicalOrderOptions([]);
      setSurgicalOrdersLoading(false);
      const currentOrderId = form.getValues("orderId");
      if (currentOrderId !== undefined && currentOrderId !== null) {
        form.setValue("orderId", undefined, { shouldValidate: true });
      }
      return;
    }

    const watchedAnimalId = animalId;
    let mounted = true;
    void (async () => {
      const options = await fetchSurgicalOrders(watchedAnimalId);
      if (!mounted) return;
      setSurgicalOrderOptions(options);

      const currentOrderId = form.getValues("orderId");
      if (
        currentOrderId !== undefined &&
        currentOrderId !== null &&
        !options.some((option) => option.id === currentOrderId)
      ) {
        form.setValue("orderId", undefined, { shouldValidate: true });
      }
    })();

    return () => {
      mounted = false;
    };
  }, [open, animalId, fetchSurgicalOrders, form]);

  const handleSearchSurgicalServices = React.useCallback(
    (query: string) => {
      void refreshSurgicalServices(query);
    },
    [refreshSurgicalServices]
  );

  const handleSearchSurgeons = React.useCallback(
    (query: string) => {
      void refreshSurgeons(query);
    },
    [refreshSurgeons]
  );

  const handleSearchAnesthetists = React.useCallback(
    (query: string) => {
      void refreshAnesthetists(query);
    },
    [refreshAnesthetists]
  );

  const anesthetistSelectOptions = React.useMemo<SelectOption[]>(
    () => [
      { value: "", label: "Sin anestesista" },
      ...anesthetistEmployeeOptions.map((employee) => ({
        value: String(employee.id),
        label: employee.label,
      })),
    ],
    [anesthetistEmployeeOptions]
  );

  const operatingRoomSelectOptions = React.useMemo<SelectOption[]>(
    () => [
      { value: "", label: "Sin quirófano" },
      ...operatingRoomOptions.map((room) => ({
        value: String(room.id),
        label: room.label,
      })),
    ],
    [operatingRoomOptions]
  );

  const surgicalOrderSelectOptions = React.useMemo<SelectOption[]>(
    () => [
      { value: "", label: "Sin orden quirúrgica" },
      ...surgicalOrderOptions.map((order) => ({
        value: String(order.id),
        label: order.label,
      })),
    ],
    [surgicalOrderOptions]
  );

  return (
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
                      id="surgical-branchId"
                      label="Sucursal"
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(value) => {
                        const numericValue = Number(value);
                        field.onChange(numericValue);
                        syncBranchBetweenForms(numericValue, "surgical");
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
                    id="surgical-animalId"
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

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="orderId"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FloatingLabelSelect
                    id="surgical-orderId"
                    label="Orden quirúrgica (opcional)"
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(value) => {
                      if (!value) {
                        field.onChange(undefined);
                      } else {
                        field.onChange(Number(value));
                      }
                    }}
                    options={surgicalOrderSelectOptions}
                    disabled={!animalId || surgicalOrdersLoading || isSubmitting}
                    emptyMessage={
                      !animalId
                        ? "Seleccione una mascota para cargar las órdenes."
                        : surgicalOrdersLoading
                        ? "Cargando órdenes..."
                        : "No se encontraron órdenes pendientes."
                    }
                  />
                </FormControl>
                {animalId && surgicalOrdersLoading && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> Cargando órdenes pendientes...
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="finalServiceId"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FloatingLabelSelect
                    id="surgical-finalServiceId"
                    label="Servicio quirúrgico"
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(value) => field.onChange(Number(value))}
                    options={serviceOptions.map((service) => ({
                      value: String(service.id),
                      label: service.label,
                    }))}
                    onSearch={handleSearchSurgicalServices}
                    disabled={isSubmitting}
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
            name="surgeonId"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FloatingLabelSelect
                    id="surgical-surgeonId"
                    label="Cirujano responsable"
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(value) => field.onChange(Number(value))}
                    options={surgeonOptions.map((employee) => ({
                      value: String(employee.id),
                      label: employee.label,
                    }))}
                    onSearch={handleSearchSurgeons}
                    disabled={isSubmitting}
                    emptyMessage="No se encontraron profesionales."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="startDateTime"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FloatingLabelInput
                    id="surgical-startDateTime"
                    label="Fecha y hora"
                    type="datetime-local"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    disabled={isSubmitting}
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
            name="anesthetistId"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FloatingLabelSelect
                    id="surgical-anesthetistId"
                    label="Anestesista (opcional)"
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(value) => {
                      if (!value) {
                        field.onChange(undefined);
                      } else {
                        field.onChange(Number(value));
                      }
                    }}
                    options={anesthetistSelectOptions}
                    onSearch={handleSearchAnesthetists}
                    disabled={isSubmitting}
                    emptyMessage="No se encontraron profesionales."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="operatingRoomId"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FloatingLabelSelect
                    id="surgical-operatingRoomId"
                    label="Quirófano (opcional)"
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(value) => {
                      if (!value) {
                        field.onChange(undefined);
                      } else {
                        field.onChange(Number(value));
                      }
                    }}
                    options={operatingRoomSelectOptions}
                    disabled={isSubmitting || operatingRoomsLoading}
                    emptyMessage="No se encontraron quirófanos."
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
            name="estimatedDurationMinutes"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FloatingLabelInput
                    id="surgical-estimatedDurationMinutes"
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

        <FormField
          control={form.control}
          name="prepInstructions"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  id="surgical-prepInstructions"
                  placeholder="Instrucciones preoperatorias (opcional)"
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
