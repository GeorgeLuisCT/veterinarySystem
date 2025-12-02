"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormControl, FormMessage, FormLabel } from "@/components/ui/form";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelSingleBadgeSelect } from "@/components/floating-label-single-select";
import { FloatingLabelMultiSelect } from "@/components/floating-label-multi-select";
import { useUser } from "@/context/user-context";
import { getAaxiosErrorMessage } from "@/helpers/error";

import { userCreateSchema, type UserCreateFormValues } from "../types/user-form";
import { EmployeeQuickSearchResponse } from "@/app/dashboard/staff/types/employee-quick-search-response";
import EmployeeService from "@/app/dashboard/staff/service/employee-service";
import UserService, { CreateUserRequest } from "../service/users-service";
import { RoleName } from "@/enums/role-name";

type UserFormProps = {
  setOpen: (open: boolean) => void;
  onCreated?: () => void;
};

const ROLE_LABELS: Record<RoleName, string> = {
  [RoleName.ROLE_USER]: "Usuario",
  [RoleName.ROLE_ADMIN]: "Administrador",
  [RoleName.ROLE_VETERINARIAN]: "Veterinario",
  [RoleName.ROLE_ASSISTANT]: "Asistente",
  [RoleName.ROLE_RECEPTIONIST]: "Recepcionista",
  [RoleName.ROLE_MANAGER]: "Gerente",
  [RoleName.ROLE_GROOMER]: "Groomer",
  [RoleName.ROLE_SUPERVISOR]: "Supervisor",
  [RoleName.ROLE_WAREHOUSE]: "Almacén",
  [RoleName.ROLE_CASHIER]: "Cajero",
};

export function UserForm({ setOpen, onCreated }: UserFormProps) {
  const { userInfo } = useUser();
  const [employeeOptions, setEmployeeOptions] = React.useState<EmployeeQuickSearchResponse[]>([]);
  const [loadingEmployees, setLoadingEmployees] = React.useState(false);

  const form = useForm<UserCreateFormValues>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      employeeId: undefined,
      roles: [RoleName.ROLE_USER],
    },
  });

  const fetchEmployees = React.useCallback(
    async (query: string) => {
      setLoadingEmployees(true);
      try {
        const branchId = userInfo?.selectedBranch?.id;
        const employees = await EmployeeService.searchEmployees(query || "", branchId);
        setEmployeeOptions(employees);
      } catch (error) {
        console.error("Error buscando empleados", error);
      } finally {
        setLoadingEmployees(false);
      }
    },
    [userInfo?.selectedBranch?.id]
  );

  React.useEffect(() => {
    fetchEmployees("");
  }, [fetchEmployees]);

  const onSubmit = async (values: UserCreateFormValues) => {
    try {
      const payload: CreateUserRequest = {
        username: values.username.trim(),
        password: values.password,
        employeeId: values.employeeId,
        roles: values.roles,
      };

      await UserService.createUser(payload);
      toast.success("Usuario registrado correctamente");
      form.reset();
      onCreated?.();
      setOpen(false);
    } catch (error: unknown) {
      const message = getAaxiosErrorMessage(error) || "No pudimos registrar el usuario";
      toast.error(message);
    }
  };

  const roleOptions = React.useMemo(
    () =>
      Object.values(RoleName).map((role) => ({
        value: role,
        label: ROLE_LABELS[role] ?? role,
      })),
    []
  );

  const employeeSelectOptions = employeeOptions.map((employee) => ({
    value: employee.id,
    label: `${employee.fullName} • ${employee.email}`,
  }));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <FloatingLabelInput {...field} label="Usuario" id="username" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FloatingLabelInput {...field} id="password" label="Contraseña" type="password" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FloatingLabelInput {...field} id="confirmPassword" label="Confirmar contraseña" type="password" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="employeeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Empleado</FormLabel>
              <FormControl>
                <FloatingLabelSingleBadgeSelect
                  id="employee"
                  label="Selecciona un empleado"
                  options={employeeSelectOptions}
                  selected={field.value}
                  onChange={(value) => field.onChange(value ?? undefined)}
                  onSearch={(query) => fetchEmployees(query)}
                />
              </FormControl>
              {loadingEmployees && (
                <p className="text-xs text-muted-foreground mt-1">Buscando colaboradores...</p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="roles"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Roles</FormLabel>
              <FormControl>
                <FloatingLabelMultiSelect
                  id="roles"
                  label="Selecciona roles"
                  options={roleOptions}
                  selected={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-center pt-2">
          <Button type="submit" disabled={form.formState.isSubmitting} className="w-48">
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Registrar
          </Button>
        </div>
      </form>
    </Form>
  );
}
