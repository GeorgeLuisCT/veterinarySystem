import { z } from "zod";

const nullableStr = z.string().transform((v) => v.trim()).optional().nullable();

export const laboratoryRequestItemSchema = z.object({
  testId: z.number(),
  unitPrice: z.number(),
  quantity: z.number(),
  notes: nullableStr,
});

export const createLaboratoryRequestSchema = z.object({
  animalId: z.number(),
  laboratoryId: z.number(),
  requestingEmployeeId: z.number().optional().nullable(),
  clinicalNotes: nullableStr,
  items: z.array(laboratoryRequestItemSchema).min(1),
});

export type CreateLaboratoryRequest = z.infer<typeof createLaboratoryRequestSchema>;

export const resultValueItemSchema = z.object({
    parameterId: z.number(),
    numericValue: z.number().optional().nullable(),
    textValue: z.string().optional().nullable(),
    booleanValue: z.boolean().optional().nullable(),
    comment: nullableStr,
});

export const addResultValuesSchema = z.object({
    results: z.array(resultValueItemSchema).min(1),
});

export type AddResultValuesRequest = z.infer<typeof addResultValuesSchema>;
