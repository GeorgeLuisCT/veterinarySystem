import { z } from "zod";
import { RoleName } from "@/enums/role-name";

export const userCreateSchema = z
  .object({
    username: z.string().min(4, "Ingresa un usuario válido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string().min(6, "Confirma la contraseña"),
    employeeId: z
      .number({ coerce: true })
      .int()
      .positive("Selecciona un empleado"),
    roles: z.array(z.nativeEnum(RoleName)).min(1, "Selecciona al menos un rol"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type UserCreateFormValues = z.infer<typeof userCreateSchema>;
