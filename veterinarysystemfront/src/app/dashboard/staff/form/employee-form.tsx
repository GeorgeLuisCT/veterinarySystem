"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useUser } from "@/context/user-context";
import {
  employeeCreateSchema,
  employeeUpdateSchema,
  type EmployeeRequest,
} from "../types/employee-request";
import { BranchService } from "@/app/dashboard/branche/services/branch-service";
import { BranchResponse } from "@/app/dashboard/branche/types/branch-response";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelMultiSelect } from "@/components/floating-label-multi-select";
import EmployeeService from "../service/employee-service";
import { ZodTypeAny } from "zod";
import { mapToCreateRequest, mapToUpdateRequest } from "../helpers/employee-mapper";
import { useEmployeeContext } from "../context/employee-context";
import { getAaxiosErrorMessage } from "@/helpers/error";

interface EmployeeFormProps {
  setOpen: (open: boolean) => void;
  employeeId?: number;
  onSave?: () => void;
}

export function EmployeeForm({ setOpen, employeeId, onSave }: EmployeeFormProps) {
  const [branches, setBranches] = React.useState<BranchResponse[]>([]);
  const [loading, setLoading] = React.useState(true);

  const { userInfo } = useUser();
  const { addEmployee, updateEmployee } = useEmployeeContext();

  const schema: ZodTypeAny = employeeId ? employeeUpdateSchema : employeeCreateSchema;

  const form = useForm<EmployeeRequest>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      burden: "",
      branchIds: [],
    },
  });

  React.useEffect(() => {
    async function fetchData() {
      try {
        const branchesData = await BranchService.getBranches();
        setBranches(branchesData);

        const selectedId = userInfo?.selectedBranch?.id ?? 0;
        form.setValue("branchIds", selectedId > 0 ? [selectedId] : branchesData.map((b) => b.id));

        if (employeeId) {
          const employee = await EmployeeService.getEmployee(employeeId);
          form.reset({
            id: employee.id,
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
            phoneNumber: employee.phoneNumber,
            burden: employee.burden,
            branchIds: employee.branches.map((b) => b.branchId),
          });
        }
      } catch (error: unknown) {
        const message = getAaxiosErrorMessage(error) || "Error al cargar datos del empleado";
        toast.error(message);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [employeeId, form, setOpen]);

  const handleSearchBranches = async (query: string) => {
    try {
      const results = await BranchService.getBranches(query);
      setBranches(results);
    } catch (error) {
      console.error("Error buscando sucursales:", error);
    }
  };

  const onSubmit = async (data: EmployeeRequest) => {
    try {
      if (employeeId) {
        const updated = await EmployeeService.updateEmployee(mapToUpdateRequest(data, employeeId));
        toast.success("Empleado actualizado correctamente");
        updateEmployee(updated);
      } else {
        const created = await EmployeeService.createEmployee(mapToCreateRequest(data));
        toast.success("Empleado registrado exitosamente");

        const selectedId = userInfo?.selectedBranch?.id ?? 0;
        const isSelectedIncluded = created.branchNames.includes(
          userInfo?.selectedBranch?.name || ""
        );

        if (selectedId === 0 || isSelectedIncluded) {
          addEmployee(created);
        } else {
          toast.warning("El empleado fue creado, pero la sucursal actual no fue seleccionada.");
        }
      }

      if (onSave) onSave();
      form.reset();
      setOpen(false);
    } catch (error: unknown) {
      const message = getAaxiosErrorMessage(error) || "Error al procesar el empleado";
      toast.error(message);
      console.error("Error al guardar empleado:", error);
    }
  };

  return (
    <div className="max-h-[80vh] overflow-auto p-4">
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="animate-spin w-6 h-6 text-muted-foreground" />
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem className="gap-0">
                  <FormControl>
                    <FloatingLabelInput {...field} id="firstName" label="Nombres" />
                  </FormControl>
                  <FormMessage className="ml-2" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem className="gap-0">
                  <FormControl>
                    <FloatingLabelInput {...field} id="lastName" label="Apellidos" />
                  </FormControl>
                  <FormMessage className="ml-2" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="gap-0">
                  <FormControl>
                    <FloatingLabelInput {...field} id="email" label="Correo electrónico" />
                  </FormControl>
                  <FormMessage className="ml-2" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem className="gap-0">
                  <FormControl>
                    <FloatingLabelInput {...field} id="phoneNumber" label="Teléfono" />
                  </FormControl>
                  <FormMessage className="ml-2" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="burden"
              render={({ field }) => (
                <FormItem className="gap-0">
                  <FormControl>
                    <FloatingLabelInput {...field} id="burden" label="Cargo" />
                  </FormControl>
                  <FormMessage className="ml-2" />
                </FormItem>
              )}
            />

            {!employeeId && (
              <FormField
                control={form.control}
                name="branchIds"
                render={({ field }) => (
                  <FormItem className="gap-0">
                    <FormControl>
                      <FloatingLabelMultiSelect
                        id="branchIds"
                        label="Selecciona sucursales"
                        options={branches.map((b) => ({ value: b.id, label: b.name }))}
                        selected={field.value ?? []}
                        onChange={field.onChange}
                        onSearch={handleSearchBranches}
                      />
                    </FormControl>
                    <FormMessage className="ml-2" />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-center">
              <Button type="submit" disabled={form.formState.isSubmitting} className="w-48">
                {form.formState.isSubmitting && <Loader2 className="animate-spin mr-2" size={16} />}
                {employeeId ? "Guardar" : "Registrar"}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
