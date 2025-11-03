import { z } from "zod";

export const closeSessionSchema = z.object({
  countedClosingAmount: z.number().min(0),
  notes: z.string().optional(),
});

export type CloseSessionFormValues = z.infer<typeof closeSessionSchema>;
