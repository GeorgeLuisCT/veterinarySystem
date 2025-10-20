import { z } from "zod";
import { ProductUnitType } from "../../inventory/products/enums/product-unit-type";
import { AdministrationRoute } from "../../inventory/products/enums/administration-route";
import { FrequencyUnit } from "../enums/frequency-unit";
import { SurgicalReportStatus } from "../enums/surgical-report-status";
import { AnestheticPhase } from "../enums/anesthetic-phase";

export interface SurgicalReportListParams {
  page?: number;
  size?: number;
  statuses?: SurgicalReportStatus[];
  branchId?: number;
  animalId?: number;
  attentionId?: number;
  surgeonId?: number;
  operatingRoomId?: number;
  startDate?: string;
  endDate?: string;
}

const nullableString = z
  .string()
  .transform((value) => value.trim())
  .optional()
  .nullable();

const nullableNumber = z.preprocess(
  (value) => (value === "" || value === undefined ? undefined : Number(value)),
  z
    .number({ invalid_type_error: "El valor debe ser un número." })
    .optional()
    .nullable()
);

const nullableInt = z.preprocess(
  (value) => (value === "" || value === undefined ? undefined : Number(value)),
  z
    .number({ invalid_type_error: "El valor debe ser un número." })
    .int("El valor debe ser un número entero.")
    .optional()
    .nullable()
);

export const createSurgicalReportSchema = z.object({
  attentionId: z
    .number({
      required_error: "Debes seleccionar una atención clínica.",
      invalid_type_error: "La atención seleccionada no es válida.",
    })
    .int("La atención seleccionada no es válida.")
    .min(1, "Debes seleccionar una atención clínica."),
  surgeryStartAt: z
    .string({
      required_error: "La fecha de inicio de cirugía es obligatoria.",
    })
    .min(1, { message: "La fecha de inicio de cirugía es obligatoria." }),
  surgeryEndAt: z
    .string({
      required_error: "La fecha de fin de cirugía es obligatoria.",
    })
    .min(1, { message: "La fecha de fin de cirugía es obligatoria." }),
  surgeonId: z
    .number({
      required_error: "Debes seleccionar un cirujano.",
      invalid_type_error: "El cirujano seleccionado no es válido.",
    })
    .int("El cirujano seleccionado no es válido.")
    .min(1, "Debes seleccionar un cirujano."),
  anesthesiologistId: nullableInt,
  assistantId: nullableInt,
  operatingRoomId: z
    .number({
      required_error: "Debes seleccionar un quirófano.",
      invalid_type_error: "El quirófano seleccionado no es válido.",
    })
    .int("El quirófano seleccionado no es válido.")
    .min(1, "Debes seleccionar un quirófano."),
  monitoring: nullableString,
  findings: nullableString,
  surgicalTechniqueDescription: nullableString,
});

export type CreateSurgicalReportRequest = z.infer<typeof createSurgicalReportSchema>;

export const updateSurgicalReportSchema = z.object({
  version: z
    .number({
      required_error: "La versión es obligatoria.",
      invalid_type_error: "La versión debe ser un número.",
    })
    .int("La versión debe ser un número entero.")
    .min(0, "La versión no puede ser negativa."),
  status: z
    .nativeEnum(SurgicalReportStatus, {
      errorMap: () => ({
        message: "El estado seleccionado no es válido.",
      }),
    })
    .optional()
    .nullable(),
  surgeryStartAt: z
    .string()
    .optional()
    .nullable(),
  surgeryEndAt: z
    .string()
    .optional()
    .nullable(),
  surgeonId: nullableInt,
  anesthesiologistId: nullableInt,
  assistantId: nullableInt,
  operatingRoomId: nullableInt,
  monitoring: nullableString,
  findings: nullableString,
  surgicalTechniqueDescription: nullableString,
});

export type UpdateSurgicalReportRequest = z.infer<typeof updateSurgicalReportSchema>;

export const addSurgicalReportAnestheticDrugSchema = z.object({
  productId: z
    .number({
      required_error: "Debes seleccionar un producto.",
      invalid_type_error: "El producto seleccionado no es válido.",
    })
    .int("El producto seleccionado no es válido.")
    .min(1, "Debes seleccionar un producto."),
  phase: z.nativeEnum(AnestheticPhase, {
    errorMap: () => ({ message: "La fase seleccionada no es válida." }),
  }),
  doseAmount: nullableNumber,
  doseUnit: z
    .nativeEnum(ProductUnitType, {
      errorMap: () => ({ message: "La unidad de dosis no es válida." }),
    })
    .optional()
    .nullable(),
  route: z
    .nativeEnum(AdministrationRoute, {
      errorMap: () => ({ message: "La vía de administración no es válida." }),
    })
    .optional()
    .nullable(),
});

export type AddSurgicalReportAnestheticDrugRequest = z.infer<
  typeof addSurgicalReportAnestheticDrugSchema
>;

export const addSurgicalReportMaterialSchema = z
  .object({
    productId: nullableInt,
    unregisteredProductName: nullableString,
    quantity: z.preprocess(
      (value) => (value === "" || value === undefined ? undefined : Number(value)),
      z
        .number({
          required_error: "La cantidad es obligatoria.",
          invalid_type_error: "La cantidad debe ser un número.",
        })
        .int("La cantidad debe ser un número entero.")
        .min(1, "La cantidad debe ser al menos 1.")
    ),
    unitType: z.nativeEnum(ProductUnitType, {
      required_error: "El tipo de unidad es obligatorio.",
      invalid_type_error: "El tipo de unidad no es válido.",
    }),
  })
  .superRefine((data, ctx) => {
    const hasProduct = data.productId !== null && data.productId !== undefined;
    const hasName =
      !!data.unregisteredProductName && data.unregisteredProductName.trim() !== "";

    if (hasProduct === hasName) {
      ctx.addIssue({
        path: ["productId"],
        code: z.ZodIssueCode.custom,
        message:
          "Debes indicar un producto registrado o uno no registrado, pero no ambos.",
      });
      ctx.addIssue({
        path: ["unregisteredProductName"],
        code: z.ZodIssueCode.custom,
        message:
          "Debes indicar un producto registrado o uno no registrado, pero no ambos.",
      });
    }
  });

export type AddSurgicalReportMaterialRequest = z.infer<typeof addSurgicalReportMaterialSchema>;

export const addSurgicalReportPostOpIndicationSchema = z
  .object({
    productId: nullableInt,
    doseAmount: nullableNumber,
    doseUnit: z
      .nativeEnum(ProductUnitType, {
        errorMap: () => ({ message: "La unidad de dosis no es válida." }),
      })
      .optional()
      .nullable(),
    frequencyValue: nullableInt,
    frequencyUnit: z
      .nativeEnum(FrequencyUnit, {
        errorMap: () => ({ message: "La unidad de frecuencia no es válida." }),
      })
      .optional()
      .nullable(),
    route: z
      .nativeEnum(AdministrationRoute, {
        errorMap: () => ({ message: "La vía de administración no es válida." }),
      })
      .optional()
      .nullable(),
    nonDrugInstruction: nullableString,
  })
  .superRefine((data, ctx) => {
    const hasProduct = data.productId !== null && data.productId !== undefined;
    const hasInstruction =
      data.nonDrugInstruction !== null &&
      data.nonDrugInstruction !== undefined &&
      data.nonDrugInstruction.trim() !== "";

    if (hasProduct && hasInstruction) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debes especificar un producto o una instrucción no farmacológica, pero no ambos.",
        path: ["productId"],
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debes especificar un producto o una instrucción no farmacológica, pero no ambos.",
        path: ["nonDrugInstruction"],
      });
      return;
    }

    if (!hasProduct && !hasInstruction) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debes indicar un medicamento o una instrucción no farmacológica.",
        path: ["productId"],
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debes indicar un medicamento o una instrucción no farmacológica.",
        path: ["nonDrugInstruction"],
      });
      return;
    }

    if (hasProduct) {
      if (data.doseAmount === null || data.doseAmount === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Debes indicar la dosis.",
          path: ["doseAmount"],
        });
      }
      if (data.doseUnit === null || data.doseUnit === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Debes indicar la unidad de dosis.",
          path: ["doseUnit"],
        });
      }
    }
  });

export type AddSurgicalReportPostOperativeIndicationRequest = z.infer<
  typeof addSurgicalReportPostOpIndicationSchema
>;
