import { z } from "zod";

export const baseAnimalSchema = z.object({
  name: z.string()
    .min(1, { message: "El nombre no puede estar vacío" })
    .max(100, { message: "El nombre no debe exceder los 100 caracteres" }),

  ownerId: z.number({ required_error: "El dueño del animal es obligatorio" })
    .min(1, { message: "Debes seleccionar un dueño" }),

  speciesId: z.number({ required_error: "La especie del animal es obligatoria" })
    .min(1, { message: "Debes seleccionar una especie" }),

  breed: z.string()
    .max(100, { message: "La raza no debe exceder los 100 caracteres" })
    .optional()
    .or(z.literal("")),

  birthDate: z.string({
    required_error: "La fecha de nacimiento es obligatoria",
    invalid_type_error: "La fecha de nacimiento debe ser una fecha válida",
  }),
});

export const animalCreateSchema = baseAnimalSchema;

export const animalUpdateSchema = baseAnimalSchema.extend({
  id: z.number({
    required_error: "El ID del animal es obligatorio",
  }).min(1),
});

export type AnimalCreateRequest = z.infer<typeof animalCreateSchema>;
export type AnimalUpdateRequest = z.infer<typeof animalUpdateSchema>;
export type AnimalRequest = z.infer<typeof baseAnimalSchema> & { id?: number };
