import { z } from "zod";

export interface CageListParams {
  branchId?: number;
  name?: string;
  size?: string;
  isOccupied?: boolean;
  page?: number;
  pageSize?: number;
}

export const cageSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  size: z.string().optional(),
  branchId: z.number().min(1, "La sucursal es requerida"),
});

export type CageRequest = z.infer<typeof cageSchema>;
