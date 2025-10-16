import { z } from "zod";

const baseEmployeeSchema = z.object({
    firstName: z.string().min(1, "El nombre no puede estar vacío"),
    lastName: z.string().min(1, "El apellido no puede estar vacío"),
    email: z.string().email("Debe ingresar un correo válido").min(1, "El correo es obligatorio"),
    phoneNumber: z.string().max(15, "El número de teléfono no debe exceder los 15 caracteres").optional(),
    burden: z.string().min(1, "El cargo es obligatorio"),
});

export const employeeCreateSchema = baseEmployeeSchema.extend({
    branchIds: z.array(z.number(), {
        required_error: "Debes seleccionar al menos una sucursal",
    }).min(1, "Debes seleccionar al menos una sucursal"),
});

export const employeeUpdateSchema = baseEmployeeSchema.extend({
    id: z.number({ required_error: "El ID del empleado es obligatorio" }),
});

export type EmployeeCreateRequest = z.infer<typeof employeeCreateSchema>;
export type EmployeeUpdateRequest = z.infer<typeof employeeUpdateSchema>;

export type EmployeeRequest = z.infer<typeof baseEmployeeSchema> & {
    id?: number;
    branchIds?: number[];
};