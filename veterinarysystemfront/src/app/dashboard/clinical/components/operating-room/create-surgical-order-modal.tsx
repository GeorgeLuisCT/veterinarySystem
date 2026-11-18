"use client";

import { OperatingRoomService } from "@/app/dashboard/branche/services/operating-room-service";
import { OperatingRoomResponse } from "@/app/dashboard/branche/types/operating-room-response";
import ClinicalServiceService from "@/app/dashboard/clinical/service/clinical-service-service";
import { ClinicalServiceQuickSearchResponse } from "@/app/dashboard/clinical/types/clinical-service-response";
import AnimalService from "@/app/dashboard/crm/patients/service/animal-service";
import {
  QuickAnimalView,
  QUICK_ANIMAL_DESCRIPTION,
  QUICK_ANIMAL_TITLE,
  quickAnimalLabel,
  useQuickAnimalView,
  type QuickCreatedAnimal,
} from "@/app/dashboard/crm/patients/components/quick-animal-view";
import { AnimalSummaryResponse } from "@/app/dashboard/crm/patients/types/animal-summary-response";
import SurgicalOrderService from "@/app/dashboard/schedule/service/surgical-order-service";
import { CreateSurgicalOrderRequest, createSurgicalOrderSchema } from "@/app/dashboard/schedule/types/surgical-order-request";
import EmployeeService from "@/app/dashboard/staff/service/employee-service";
import { EmployeeSummaryResponse } from "@/app/dashboard/staff/types/employee-summary-response";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/context/user-context";
import { RoleName } from "@/enums/role-name";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

type Option = { value: string; label: string };

interface CreateSurgicalOrderModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateSurgicalOrderModal({ open, onClose, onCreated }: CreateSurgicalOrderModalProps) {
  const { toast } = useToast();
  const { userInfo } = useUser();
  const branchId = userInfo?.selectedBranch.id;

  const [loadingOptions, setLoadingOptions] = useState(false);
  const [animalOptions, setAnimalOptions] = useState<Option[]>([]);
  const [serviceOptions, setServiceOptions] = useState<Option[]>([]);
  const [requestedByOptions, setRequestedByOptions] = useState<Option[]>([]);
  const [operatingRoomOptions, setOperatingRoomOptions] = useState<Option[]>([]);
  const [submitting, setSubmitting] = useState(false);
  // Vista "Nueva mascota" dentro del modal (sin abrir otro modal ni perder lo llenado).
  const quickAnimal = useQuickAnimalView();
  const resetQuickAnimal = quickAnimal.reset;

  const form = useForm<CreateSurgicalOrderRequest>({
    resolver: zodResolver(createSurgicalOrderSchema),
    defaultValues: {
      animalId: undefined,
      recommendedServiceId: undefined,
      requestedById: undefined,
      operationRoomId: undefined,
      notes: undefined,
      status: undefined,
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) resetQuickAnimal();
  }, [open, resetQuickAnimal]);

  const handleAnimalCreated = (animal: QuickCreatedAnimal) => {
    const option = { value: String(animal.id), label: quickAnimalLabel(animal) };
    setAnimalOptions((prev) => [option, ...prev.filter((o) => o.value !== option.value)]);
    form.setValue("animalId", animal.id, { shouldValidate: true, shouldDirty: true });
  };

  useEffect(() => {
    if (!open) {
      form.reset({
        animalId: undefined,
        recommendedServiceId: undefined,
        requestedById: undefined,
        operationRoomId: undefined,
        notes: undefined,
        status: undefined,
      });
      return;
    }
    let active = true;
    setLoadingOptions(true);
    const loadStaticOptions = async () => {
      try {
        const [requestedByRes, roomsRes] = await Promise.all([
          EmployeeService.getEmployeesByRoles([RoleName.ROLE_VETERINARIAN]).catch(() => []),
          branchId ? OperatingRoomService.listByBranch(branchId).catch(() => []) : Promise.resolve([]),
        ]);
        if (!active) return;
        const mapEmployees = (employees: EmployeeSummaryResponse[]) => employees.map((emp: EmployeeSummaryResponse) => ({ value: String(emp.id), label: emp.branchNames ? `${emp.firstName} ${emp.lastName} • ${emp.branchNames}` : `${emp.firstName} ${emp.lastName}` }));
        setRequestedByOptions(mapEmployees(requestedByRes ?? []));
        setOperatingRoomOptions((roomsRes ?? []).map((room: OperatingRoomResponse) => ({ value: String(room.id), label: room.branchName ? `${room.branchName} • ${room.name}` : room.name })));
      } catch {
        toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar las opciones necesarias." });
      } finally {
        if (active) setLoadingOptions(false);
      }
    };
    void loadStaticOptions();
    return () => { active = false; };
  }, [open, branchId, toast, form]);

  const searchAnimals = async (q: string) => {
    try {
      const resp = await AnimalService.getAnimals({ query: q, page: 0, size: 20, active: true });
      setAnimalOptions(resp.content.map((a: AnimalSummaryResponse) => ({ value: String(a.id), label: `${a.name} • ${a.ownerName ?? "Sin propietario"}` })));
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudieron buscar mascotas." });
    }
  };

  const searchServices = async (q: string) => {
    try {
      const resp = await ClinicalServiceService.quickSearch(q, branchId ?? undefined);
      setServiceOptions(resp.map((s: ClinicalServiceQuickSearchResponse) => ({ value: String(s.id), label: s.name })));
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudieron buscar servicios." });
    }
  };

  const handleSubmit = async (values: CreateSurgicalOrderRequest) => {
    setSubmitting(true);
    try {
      await SurgicalOrderService.create({
        animalId: values.animalId!,
        recommendedServiceId: values.recommendedServiceId!,
        requestedById: values.requestedById!,
        operationRoomId: values.operationRoomId!,
        notes: values.notes,
        status: values.status,
      });
      toast({ title: "Orden creada", description: "La orden quirúrgica se creó correctamente." });
      onCreated();
      onClose();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudo crear la orden quirúrgica." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => (!value ? onClose() : undefined)}>
      <DialogContent className="overflow-hidden sm:max-w-2xl" onEscapeKeyDown={quickAnimal.handleEscapeKeyDown}>
        <DialogHeader>
          <DialogTitle>{quickAnimal.active ? QUICK_ANIMAL_TITLE : "Nueva orden quirúrgica"}</DialogTitle>
          {quickAnimal.active && <DialogDescription>{QUICK_ANIMAL_DESCRIPTION}</DialogDescription>}
        </DialogHeader>
        <QuickAnimalView view={quickAnimal} idPrefix="surgical-order-new-animal" onCreated={handleAnimalCreated} />
        <div className={quickAnimal.mainClassName}>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="animalId"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelSelect
                        id="animalId"
                        label="Mascota"
                        options={animalOptions}
                        value={field.value ? String(field.value) : ""}
                        onValueChange={(value) => field.onChange(value ? Number(value) : undefined)}
                        onSearch={searchAnimals}
                        disabled={loadingOptions}
                        emptyMessage="Busque y seleccione una mascota"
                        createOption={{
                          onCreate: quickAnimal.open,
                          label: (query) => (query ? `Registrar "${query}" como nueva mascota` : "Registrar nueva mascota"),
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="recommendedServiceId"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelSelect
                        id="recommendedServiceId"
                        label="Servicio recomendado"
                        options={serviceOptions}
                        value={field.value ? String(field.value) : ""}
                        onValueChange={(value) => field.onChange(value ? Number(value) : undefined)}
                        onSearch={searchServices}
                        disabled={loadingOptions}
                        emptyMessage="Busque y seleccione un servicio"
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
                name="requestedById"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelSelect
                        id="requestedById"
                        label="Profesional solicitante"
                        options={requestedByOptions}
                        value={field.value ? String(field.value) : ""}
                        onValueChange={(value) => field.onChange(value ? Number(value) : undefined)}
                        disabled={loadingOptions}
                        emptyMessage="No hay profesionales disponibles"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="operationRoomId"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelSelect
                        id="operationRoomId"
                        label="Sala de operaciones"
                        options={operatingRoomOptions}
                        value={field.value ? String(field.value) : ""}
                        onValueChange={(value) => field.onChange(value ? Number(value) : undefined)}
                        disabled={loadingOptions}
                        emptyMessage="No hay quirófanos configurados"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      id="notes"
                      rows={3}
                      value={field.value ?? ""}
                      onChange={(event) => field.onChange(event.target.value || undefined)}
                      placeholder="Notas (opcional)"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={submitting || !form.formState.isValid}>{submitting ? "Guardando..." : "Crear orden"}</Button>
            </DialogFooter>
          </form>
        </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
