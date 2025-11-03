import { z } from "zod";

export const openSessionSchema = z.object({
  openingAmount: z.number().min(0),
});

export type OpenSessionFormValues = z.infer<typeof openSessionSchema>;
