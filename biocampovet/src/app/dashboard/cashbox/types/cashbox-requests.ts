import { z } from "zod";

export const OpenCashboxRequestSchema = z.object({
  branchId: z.number({ required_error: "La sucursal es obligatoria" }),
  initialAmount: z
    .number({ required_error: "El monto inicial es obligatorio" })
    .min(0, "El monto inicial no puede ser negativo"),
});

export const CloseCashboxRequestSchema = z.object({
  cashboxId: z.number({ required_error: "El ID de la caja es obligatorio" }),
  physicalAmount: z
    .number({ required_error: "El monto físico contado es obligatorio" })
    .min(0, "El monto físico no puede ser negativo"),
  closingObservations: z.string().optional(),
});

export type OpenCashboxRequest = z.infer<typeof OpenCashboxRequestSchema>;
export type CloseCashboxRequest = z.infer<typeof CloseCashboxRequestSchema>;
