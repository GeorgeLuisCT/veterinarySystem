import { z } from "zod";
import { AnimalSpecies } from "../enums/animal-species";

export const baseAnimalSchema = z.object({
  name: z
    .string()
    .min(1, { message: "El nombre no puede estar vacío" })
    .max(100, { message: "El nombre no debe exceder los 100 caracteres" }),

  ownerId: z
    .number({ required_error: "El dueño del animal es obligatorio" })
    .int({ message: "El dueño debe ser un número entero" })
    .positive({ message: "Debes seleccionar un dueño" }),

  species: z.nativeEnum(AnimalSpecies, {
    required_error: "La especie del animal es obligatoria",
    invalid_type_error: "La especie seleccionada no es válida",
  }),

  breed: z
    .string()
    .max(100, { message: "La raza no debe exceder los 100 caracteres" })
    .optional()
    .or(z.literal("")),

  birthDate: z
    .string({
      required_error: "La fecha de nacimiento es obligatoria",
      invalid_type_error: "La fecha de nacimiento debe ser una fecha válida",
    })
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: "La fecha de nacimiento debe tener el formato YYYY-MM-DD",
    }),
});

export const animalCreateSchema = baseAnimalSchema;

export const animalUpdateSchema = baseAnimalSchema.extend({
  id: z
    .number({ required_error: "El ID del animal es obligatorio" })
    .int({ message: "El ID debe ser un número entero" })
    .positive({ message: "El ID debe ser mayor que 0" }),
});

export type AnimalCreateRequest = z.infer<typeof animalCreateSchema>;
export type AnimalUpdateRequest = z.infer<typeof animalUpdateSchema>;
export type AnimalRequest = z.infer<typeof baseAnimalSchema> & { id?: number };
