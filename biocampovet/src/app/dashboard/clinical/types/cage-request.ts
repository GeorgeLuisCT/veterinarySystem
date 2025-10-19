import { z } from "zod";
import { CageSize } from "../enums/cage-size";

export interface CageListParams {
  branchId?: number;
  name?: string;
  size?: CageSize;
  isOccupied?: boolean;
  page?: number;
  pageSize?: number;
}

export const cageSchema = z.object({
  name: z
    .string({
      required_error: "El nombre es requerido",
    })
    .min(1, { message: "El nombre es requerido" }),

  size: z.nativeEnum(CageSize, {
    required_error: "El tamaño es requerido",
  }),

  branchId: z
    .number({
      required_error: "La sucursal es requerida",
    })
    .min(1, { message: "La sucursal es requerida" }),
});

export type CageRequest = z.infer<typeof cageSchema>;
