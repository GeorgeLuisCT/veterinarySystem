"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Scissors, Stethoscope, Syringe } from "lucide-react";
import { format } from "date-fns";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";
import AppointmentService from "../service/appointment-service";
import {
  createClinicalAppointmentSchema,
  createGroomingAppointmentSchema,
  CreateClinicalAppointmentRequest,
  CreateGroomingAppointmentRequest,
  createSurgicalAppointmentSchema,
  CreateSurgicalAppointmentRequest,
} from "../types/appointment-request";
import type { AppointmentDetailResponse } from "../types/appointment-response";
import AnimalService from "@/app/dashboard/patients/animals/service/animal-service";
import EmployeeService from "@/app/dashboard/staff/employees/service/employee-service";
import { BranchService } from "@/app/dashboard/branche/services/branch-service";
import { useUser } from "@/context/user-context";
import { ClinicalAppointmentTab } from "./new-appointment-modal/clinical-appointment-tab";
import { GroomingAppointmentTab } from "./new-appointment-modal/grooming-appointment-tab";
import { SurgicalAppointmentTab } from "./new-appointment-modal/surgical-appointment-tab";
import type { Option } from "./types";

type NewAppointmentModalTab = "clinical" | "grooming" | "surgical";

interface NewAppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (appointment: AppointmentDetailResponse) => void;
  initialDateTime?: Date | null;
}

const clinicalDefaultValues: Partial<CreateClinicalAppointmentRequest> = {
  startDateTime: "",
  estimatedDurationMinutes: null,
  consultationReason: "",
  clinicalNotes: "",
};

const groomingDefaultValues: Partial<CreateGroomingAppointmentRequest> = {
  startDateTime: "",
  estimatedDurationMinutes: null,
  ownerSpecialNotes: "",
};

const surgicalDefaultValues: Partial<CreateSurgicalAppointmentRequest> = {
  startDateTime: "",
  estimatedDurationMinutes: null,
  prepInstructions: "",
};

export function NewAppointmentModal({ open, onOpenChange, onCreated, initialDateTime }: NewAppointmentModalProps) {
  const { toast } = useToast();
  const { userInfo } = useUser();
  const selectedBranch = userInfo?.selectedBranch ?? null;
  const selectedBranchId = selectedBranch?.id ?? null;
  const hasFixedBranch = selectedBranchId !== null && selectedBranchId !== 0;
  const fixedBranchId = hasFixedBranch ? selectedBranchId : undefined;

  const [activeTab, setActiveTab] = React.useState<NewAppointmentModalTab>("clinical");
  const [initialLoading, setInitialLoading] = React.useState(false);

  const [animalOptions, setAnimalOptions] = React.useState<Option[]>([]);
  const [branchOptions, setBranchOptions] = React.useState<Option[]>([]);
  const [branchesLoading, setBranchesLoading] = React.useState(false);

  const branchDefaultValues = React.useMemo(
    () => (fixedBranchId ? { branchId: fixedBranchId } : {}),
    [fixedBranchId]
  );

  const clinicalForm = useForm<CreateClinicalAppointmentRequest>({
    resolver: zodResolver(createClinicalAppointmentSchema),
    defaultValues: {
      ...clinicalDefaultValues,
      ...branchDefaultValues,
    },
  });

  const groomingForm = useForm<CreateGroomingAppointmentRequest>({
    resolver: zodResolver(createGroomingAppointmentSchema),
    defaultValues: {
      ...groomingDefaultValues,
      ...branchDefaultValues,
    },
  });

  const surgicalForm = useForm<CreateSurgicalAppointmentRequest>({
    resolver: zodResolver(createSurgicalAppointmentSchema),
    defaultValues: {
      ...surgicalDefaultValues,
      ...branchDefaultValues,
    },
  });

  const branchFilter = fixedBranchId;

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
    async (query?: string) => {
      try {
        if (query?.trim()) {
          const results = await EmployeeService.searchEmployees(query.trim(), branchFilter);
          return results.map((employee) => ({
            id: employee.id,
            label: employee.fullName,
          }));
        }

        const response = await EmployeeService.getEmployees({
          active: true,
          page: 0,
          size: 20,
          branchId: branchFilter,
        });

        return response.content.map((employee) => ({
          id: employee.id,
          label: `${employee.firstName} ${employee.lastName}`,
        }));
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: getAaxiosErrorMessage(error) ?? "No se pudieron cargar los empleados.",
        });
        return [];
      }
    },
    [branchFilter, toast]
  );

  const syncBranchBetweenForms = React.useCallback(
    (value: number, source: "clinical" | "grooming" | "surgical") => {
      if (source !== "clinical") {
        clinicalForm.setValue("branchId", value, { shouldValidate: true, shouldDirty: true });
      }
      if (source !== "grooming") {
        groomingForm.setValue("branchId", value, { shouldValidate: true, shouldDirty: true });
      }
      if (source !== "surgical") {
        surgicalForm.setValue("branchId", value, { shouldValidate: true, shouldDirty: true });
      }
    },
    [clinicalForm, groomingForm, surgicalForm]
  );

  React.useEffect(() => {
    if (!open || hasFixedBranch) {
      return;
    }

    let mounted = true;
    setBranchesLoading(true);

    (async () => {
      try {
        const branches = await BranchService.getBranchesByLoggedEmployee();
        if (!mounted) return;
        const options = branches.map((branch) => ({
          id: branch.id,
          label: branch.name,
        }));
        setBranchOptions(options);
      } catch (error) {
        if (!mounted) return;
        toast({
          variant: "destructive",
          title: "Error",
          description: getAaxiosErrorMessage(error) ?? "No se pudieron cargar las sucursales.",
        });
        setBranchOptions([]);
      } finally {
        if (mounted) {
          setBranchesLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [open, hasFixedBranch, toast]);

  React.useEffect(() => {
    if (!hasFixedBranch || !fixedBranchId) {
      return;
    }

    clinicalForm.setValue("branchId", fixedBranchId, { shouldValidate: true });
    groomingForm.setValue("branchId", fixedBranchId, { shouldValidate: true });
    surgicalForm.setValue("branchId", fixedBranchId, { shouldValidate: true });
  }, [hasFixedBranch, fixedBranchId, clinicalForm, groomingForm, surgicalForm]);

  const handleModalToggle = React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setActiveTab("clinical");
        clinicalForm.reset({
          ...clinicalDefaultValues,
          ...branchDefaultValues,
        });
        groomingForm.reset({
          ...groomingDefaultValues,
          ...branchDefaultValues,
        });
        surgicalForm.reset({
          ...surgicalDefaultValues,
          ...branchDefaultValues,
        });
      }
      onOpenChange(nextOpen);
    },
    [branchDefaultValues, clinicalForm, groomingForm, onOpenChange, surgicalForm]
  );

  React.useEffect(() => {
    if (!open) {
      return;
    }

    let mounted = true;
    setInitialLoading(true);

    (async () => {
      try {
        await loadAnimals();
      } finally {
        if (mounted) {
          setInitialLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [open, loadAnimals]);

  React.useEffect(() => {
    if (!open) return;
    const formattedDateTime = initialDateTime ? format(initialDateTime, "yyyy-MM-dd'T'HH:mm") : "";

    clinicalForm.setValue("startDateTime", formattedDateTime);
    groomingForm.setValue("startDateTime", formattedDateTime);
    surgicalForm.setValue("startDateTime", formattedDateTime);
  }, [open, initialDateTime, clinicalForm, groomingForm, surgicalForm]);

  const handleSearchAnimals = React.useCallback(
    (query: string) => {
      void loadAnimals(query);
    },
    [loadAnimals]
  );

  const onSubmitClinical = React.useCallback(
    async (values: CreateClinicalAppointmentRequest) => {
      try {
        const payload: CreateClinicalAppointmentRequest = {
          ...values,
          estimatedDurationMinutes: values.estimatedDurationMinutes ?? undefined,
        };

        const response = await AppointmentService.createClinical(payload);
        toast({
          title: "Cita registrada",
          description: "La cita clínica se creó correctamente.",
        });

        onCreated?.(response);
        handleModalToggle(false);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error al registrar la cita",
          description: getAaxiosErrorMessage(error) ?? "No se pudo crear la cita clínica.",
        });
      }
    },
    [handleModalToggle, onCreated, toast]
  );

  const onSubmitGrooming = React.useCallback(
    async (values: CreateGroomingAppointmentRequest) => {
      try {
        const payload: CreateGroomingAppointmentRequest = {
          ...values,
          estimatedDurationMinutes: values.estimatedDurationMinutes ?? undefined,
        };

        const response = await AppointmentService.createGrooming(payload);
        toast({
          title: "Cita registrada",
          description: "La cita de peluquería se creó correctamente.",
        });

        onCreated?.(response);
        handleModalToggle(false);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error al registrar la cita",
          description: getAaxiosErrorMessage(error) ?? "No se pudo crear la cita de peluquería.",
        });
      }
    },
    [handleModalToggle, onCreated, toast]
  );

  const onSubmitSurgical = React.useCallback(
    async (values: CreateSurgicalAppointmentRequest) => {
      try {
        const payload: CreateSurgicalAppointmentRequest = {
          ...values,
          orderId: values.orderId ?? undefined,
          anesthetistId: values.anesthetistId ?? undefined,
          operatingRoomId: values.operatingRoomId ?? undefined,
          estimatedDurationMinutes: values.estimatedDurationMinutes ?? undefined,
        };

        const response = await AppointmentService.createSurgical(payload);
        toast({
          title: "Cita registrada",
          description: "La cita quirúrgica se creó correctamente.",
        });

        onCreated?.(response);
        handleModalToggle(false);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error al registrar la cita",
          description: getAaxiosErrorMessage(error) ?? "No se pudo crear la cita quirúrgica.",
        });
      }
    },
    [handleModalToggle, onCreated, toast]
  );

  const handleCancel = React.useCallback(() => {
    handleModalToggle(false);
  }, [handleModalToggle]);

  return (
    <Dialog open={open} onOpenChange={handleModalToggle}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Crear nueva cita</DialogTitle>
          <DialogDescription>
            Completa la información según el tipo de cita que deseas agendar.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as NewAppointmentModalTab)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="clinical">
              <Stethoscope className="mr-2 h-4 w-4" />
              Clínica
            </TabsTrigger>
            <TabsTrigger value="grooming">
              <Scissors className="mr-2 h-4 w-4" />
              Peluquería
            </TabsTrigger>
            <TabsTrigger value="surgical">
              <Syringe className="mr-2 h-4 w-4" />
              Cirugía
            </TabsTrigger>
          </TabsList>
          <TabsContent value="clinical">
            {initialLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ClinicalAppointmentTab
                form={clinicalForm}
                onSubmit={onSubmitClinical}
                onCancel={handleCancel}
                hasFixedBranch={hasFixedBranch}
                branchOptions={branchOptions}
                branchesLoading={branchesLoading}
                syncBranchBetweenForms={syncBranchBetweenForms}
                animalOptions={animalOptions}
                onSearchAnimals={handleSearchAnimals}
                loadEmployees={loadEmployees}
                open={open}
              />
            )}
          </TabsContent>
          <TabsContent value="surgical">
            {initialLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <SurgicalAppointmentTab
                form={surgicalForm}
                onSubmit={onSubmitSurgical}
                onCancel={handleCancel}
                hasFixedBranch={hasFixedBranch}
                branchOptions={branchOptions}
                branchesLoading={branchesLoading}
                syncBranchBetweenForms={syncBranchBetweenForms}
                animalOptions={animalOptions}
                onSearchAnimals={handleSearchAnimals}
                loadEmployees={loadEmployees}
                open={open}
                selectedBranchId={selectedBranchId}
              />
            )}
          </TabsContent>
          <TabsContent value="grooming">
            {initialLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <GroomingAppointmentTab
                form={groomingForm}
                onSubmit={onSubmitGrooming}
                onCancel={handleCancel}
                hasFixedBranch={hasFixedBranch}
                branchOptions={branchOptions}
                branchesLoading={branchesLoading}
                syncBranchBetweenForms={syncBranchBetweenForms}
                animalOptions={animalOptions}
                onSearchAnimals={handleSearchAnimals}
                loadEmployees={loadEmployees}
                open={open}
              />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default NewAppointmentModal;
