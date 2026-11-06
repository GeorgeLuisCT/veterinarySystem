"use client";

import React, { useCallback, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Pill, Syringe, Beaker, ClipboardPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ClinicalAttentionDetailResponse, MedicationAdministrationResponse, ClinicalServiceItemResponse, SurgicalOrderResponse, LaboratoryRequestResponse, ClinicalAttentionPatchResponse } from "../../types/clinical-attention-response";
import { UpdateClinicalAttentionRequest, updateClinicalAttentionSchema } from "../../types/clinical-attention-request";
import ClinicalAttentionService from "../../service/clinical-attention-service";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { MedicationModal } from "./add-medication-modal";
import { ServiceItemModal } from "./service-item-modal";
import { SurgicalOrderModal } from "./surgical-order-modal";
import { LaboratoryRequestModal } from "./laboratory-request-modal";
import { ProductUnitTypeLabels } from "@/app/dashboard/inventory/_enums/product-unit-type";
import { AdministrationRouteLabels } from "@/app/dashboard/inventory/_enums/administration-route";
import PrescriptionTemplateApplyModal from "./prescription-template-apply-modal";
import { ClinicalServiceCategory, ClinicalServiceCategoryLabels } from "../../enums/clinical-service-category";
import { LabRequestItemStatusLabels } from "../../enums/lab-request-item-status";
import { FrequencyUnitLabels } from "../../enums/frequency-unit";
import { SurgicalOrderStatusLabels } from "@/app/dashboard/schedule/enums/surgical-order-status";

type FormShape = z.infer<typeof updateClinicalAttentionSchema>;

interface Props {
  detail: ClinicalAttentionDetailResponse;
  setDetail: (detail: ClinicalAttentionDetailResponse) => void;
  className?: string;
}

export interface ConsultationFormHandle {
  triggerSaveAll: () => Promise<void>;
}

const ConsultationForm = forwardRef<ConsultationFormHandle, Props>(({ detail, setDetail, className }, ref) => {
  const { toast } = useToast();

  const [medications, setMedications] = useState<MedicationAdministrationResponse[]>(detail.medicationAdministrations || []);
  const [serviceItems, setServiceItems] = useState<ClinicalServiceItemResponse[]>(detail.serviceItems || []);
  const [surgicalOrders, setSurgicalOrders] = useState<SurgicalOrderResponse[]>(detail.surgicalOrders || []);
  const [labRequests, setLabRequests] = useState<LaboratoryRequestResponse[]>(detail.laboratoryRequests || []);

  const [openMedication, setOpenMedication] = useState(false);
  const [openServiceItemCategory, setOpenServiceItemCategory] = useState<ClinicalServiceCategory | null>(null);
  const [openSurgicalOrder, setOpenSurgicalOrder] = useState(false);
  const [openLab, setOpenLab] = useState(false);
  const [openTemplate, setOpenTemplate] = React.useState(false);


  const form = useForm<FormShape>({
    resolver: zodResolver(updateClinicalAttentionSchema),
    defaultValues: {
      version: detail.version,
      visitDate: detail.visitDate,
      status: detail.status,
      subjective: detail.subjective,
      objective: detail.objective,
      assessment: detail.assessment,
      plan: detail.plan,
      weightKg: detail.weightKg,
      temperatureCelsius: detail.temperatureCelsius,
      heartRate: detail.heartRate,
      respiratoryRate: detail.respiratoryRate,
    },
    mode: "onChange",
  });

  const versionRef = useRef<number>(detail.version);

  const patchField = useCallback(
    async (field: keyof Omit<FormShape, "version">, value: unknown) => {
      if (!detail) return;
      const body: UpdateClinicalAttentionRequest = { version: versionRef.current };

      if (value === undefined) return;

      (body as Record<string, unknown>)[field] = value === "" ? null : value;

      const res: ClinicalAttentionPatchResponse = await ClinicalAttentionService.patch(detail.id, body);
      versionRef.current = res.version;
      form.setValue("version", res.version, { shouldDirty: false, shouldTouch: false, shouldValidate: false });

      if (res.updated) {
        const updatedValues = res.updated as Record<string, unknown>;
        if (updatedValues[field] !== undefined) {
          form.setValue(field, updatedValues[field] as FormShape[typeof field], { shouldDirty: false });
        }
      }
    },
    [detail, form]
  );

  const debouncers = useRef<Record<string, NodeJS.Timeout>>({});

  const autosave = useCallback(
    (field: keyof Omit<FormShape, "version">, value: unknown) => {
      if (debouncers.current[field as string]) clearTimeout(debouncers.current[field as string]);
      debouncers.current[field as string] = setTimeout(() => {
        patchField(field, value).catch(() => {
          toast({ description: "Conflicto de edición, se recargó la atención.", variant: "destructive" });
        });
      }, 600);
    },
    [patchField, toast]
  );

  const saveAll = useCallback(
    async (values: FormShape) => {
      try {
        const payload: UpdateClinicalAttentionRequest = {
          version: versionRef.current,
          visitDate: values.visitDate ?? null,
          status: values.status ?? null,
          subjective: values.subjective ?? null,
          objective: values.objective ?? null,
          assessment: values.assessment ?? null,
          plan: values.plan ?? null,
          weightKg: values.weightKg ?? null,
          temperatureCelsius: values.temperatureCelsius ?? null,
          heartRate: values.heartRate ?? null,
          respiratoryRate: values.respiratoryRate ?? null,
        };
        const res = await ClinicalAttentionService.patch(detail.id, payload);
        versionRef.current = res.version;
        form.setValue("version", res.version, { shouldDirty: false });
      } catch (error) {
        console.error("Error en saveAll:", error);
        throw error;
      }
    },
    [form, detail.id]
  );

  useImperativeHandle(ref, () => ({
    triggerSaveAll: () => form.handleSubmit(saveAll)(),
  }), [form, saveAll]);

  // Fix: Eliminado statusOptions que no se usaba

  React.useEffect(() => {
    setMedications(detail.medicationAdministrations || []);
  }, [detail.medicationAdministrations]);

  React.useEffect(() => {
    setServiceItems(detail.serviceItems || []);
  }, [detail.serviceItems]);

  React.useEffect(() => {
    setSurgicalOrders(detail.surgicalOrders || []);
  }, [detail.surgicalOrders]);

  React.useEffect(() => {
    setLabRequests(detail.laboratoryRequests || []);
  }, [detail.laboratoryRequests]);

  const syncDetail = useCallback((patch: Partial<ClinicalAttentionDetailResponse>) => {
    setDetail({
      ...detail,
      ...patch,
    });
  }, [detail, setDetail]);

  const updateVersion = useCallback((newVersion: number) => {
    versionRef.current = newVersion;
    form.setValue("version", newVersion, { shouldDirty: false });
  }, [form]);

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle>S - Subjetivo</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <FormField
              control={form.control}
              name="subjective"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      id="subjective"
                      value={field.value ?? ""}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        autosave("subjective", e.target.value === "" ? null : e.target.value);
                      }}
                      rows={4}
                      placeholder="Motivo de consulta"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>O - Objetivo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...form}>
            <div className="grid gap-4 md:grid-cols-4">
              <FormField
                control={form.control}
                name="weightKg"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelInput
                        id="weightKg"
                        label="Peso (kg)"
                        type="number"
                        value={field.value ?? ""}
                        onChange={(v) => {
                          const num = v === "" ? null : Number(v);
                          field.onChange(num);
                          autosave("weightKg", num);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="temperatureCelsius"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelInput
                        id="temperatureCelsius"
                        label="Temp (°C)"
                        type="number"
                        value={field.value ?? ""}
                        onChange={(v) => {
                          const num = v === "" ? null : Number(v);
                          field.onChange(num);
                          autosave("temperatureCelsius", num);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="heartRate"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelInput
                        id="heartRate"
                        label="FC (lpm)"
                        type="number"
                        value={field.value ?? ""}
                        onChange={(v) => {
                          const parsed = v === "" ? NaN : parseInt(v, 10);
                          const finalVal = Number.isNaN(parsed) ? null : parsed;
                          field.onChange(finalVal);
                          autosave("heartRate", finalVal);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="respiratoryRate"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelInput
                        id="respiratoryRate"
                        label="FR (rpm)"
                        type="number"
                        value={field.value ?? ""}
                        onChange={(v) => {
                          const parsed = v === "" ? NaN : parseInt(v, 10);
                          const finalVal = Number.isNaN(parsed) ? null : parsed;
                          field.onChange(finalVal);
                          autosave("respiratoryRate", finalVal);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="objective"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      id="objective"
                      value={field.value ?? ""}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        autosave("objective", e.target.value === "" ? null : e.target.value);
                      }}
                      rows={4}
                      placeholder="Hallazgos del examen físico"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>A - Valoración</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <FormField
              control={form.control}
              name="assessment"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      id="assessment"
                      value={field.value ?? ""}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        autosave("assessment", e.target.value === "" ? null : e.target.value);
                      }}
                      rows={4}
                      placeholder="Diagnóstico"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>P - Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Acciones rápidas */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setOpenMedication(true)}>
              <Pill className="mr-2 h-4 w-4" />
              Medicación
            </Button>
            <Button variant="outline" onClick={() => setOpenServiceItemCategory(ClinicalServiceCategory.VACCINATION)}>
              <Syringe className="mr-2 h-4 w-4" />
              Vacunación
            </Button>
            <Button variant="outline" onClick={() => setOpenServiceItemCategory(ClinicalServiceCategory.DEWORMING)}>
              <Syringe className="mr-2 h-4 w-4" />
              Desparasitación
            </Button>
            <Button variant="outline" onClick={() => setOpenServiceItemCategory(ClinicalServiceCategory.OTHER)}>
              <Syringe className="mr-2 h-4 w-4" />
              Otro
            </Button>
            <Button variant="outline" onClick={() => setOpenLab(true)}>
              <Beaker className="mr-2 h-4 w-4" />
              Laboratorio
            </Button>
            <Button variant="outline" onClick={() => setOpenSurgicalOrder(true)}>
              <ClipboardPlus className="mr-2 h-4 w-4" />
              Orden quirúrgica
            </Button>
            <Button variant="outline" onClick={() => setOpenTemplate(true)}>
              <ClipboardPlus className="mr-2 h-4 w-4" />
              Desde plantilla
            </Button>
          </div>

          <Separator />

          {/* Lista unificada y consistente */}
          {(() => {
            type Entry =
              | {
                id: string;
                kind: "MEDICACION";
                title: string;
                metaLeft?: string;
                metaRight?: string;
                timestamp?: number | null;
                details?: React.ReactNode;
                tagLabel?: string;
              }
              | {
                id: string;
                kind: "SERVICIO";
                title: string;
                metaLeft?: string;
                metaRight?: string;
                timestamp?: number | null;
                details?: React.ReactNode;
                tagLabel?: string;
              }
              | {
                id: string;
                kind: "ORDEN";
                title: string;
                metaLeft?: string;
                metaRight?: string;
                timestamp?: number | null;
                details?: React.ReactNode;
                tagLabel?: string;
              }
              | {
                id: string;
                kind: "LAB";
                title: string;
                metaLeft?: string;
                metaRight?: string;
                timestamp?: number | null;
                details?: React.ReactNode;
                tagLabel?: string;
              };

            const entries: Entry[] = [
              // Medicaciones
              ...medications.map((m) => {
                const pluralizeEs = (label: string, value: number) => {
                  if (!label) return "";
                  const n = Number(value);
                  if (Number.isNaN(n) || n === 1) return label;
                  if (/[s]$/i.test(label)) return label;
                  return `${label}s`;
                };

                const dose =
                  m.doseAmount
                    ? `${m.doseAmount} ${pluralizeEs(ProductUnitTypeLabels[m.doseUnit ?? ""], Number(m.doseAmount))}`.trim()
                    : "";

                const freq =
                  m.frequencyValue && m.frequencyUnit
                    ? `cada ${m.frequencyValue} ${pluralizeEs(FrequencyUnitLabels[m.frequencyUnit], Number(m.frequencyValue))}`
                    : "";

                const route = m.route ? `vía ${AdministrationRouteLabels[m.route].toLowerCase()}` : "";

                const extras = [dose, freq, route].filter(Boolean).join(" ");

                return {
                  id: `med-${m.id}`,
                  kind: "MEDICACION" as const,
                  title: m.productName,
                  metaLeft: extras || undefined,
                  metaRight: m.administeredAt ? new Date(m.administeredAt).toLocaleString() : undefined,
                  timestamp: m.administeredAt ? new Date(m.administeredAt).getTime() : null,
                  details: m.notes ? <div className="text-muted-foreground text-xs">{m.notes}</div> : undefined,
                };
              }),

              // Servicios
              ...serviceItems.map((s) => {
                const products =
                  s.products && s.products.length > 0 ? (
                    <ul className="mt-2 space-y-1">
                      {s.products.map((p) => {
                        const pluralizeEs = (label: string, value: number) => {
                          if (!label) return "";
                          const n = Number(value);
                          if (Number.isNaN(n) || n === 1) return label;
                          if (/[s]$/i.test(label)) return label;
                          return `${label}s`;
                        };

                        const dose =
                          p.dose != null
                            ? `${Number(p.dose)} ${pluralizeEs(ProductUnitTypeLabels[p.unit], Number(p.dose))}`.trim()
                            : "";

                        const route = p.administrationRoute
                          ? `vía ${AdministrationRouteLabels[p.administrationRoute].toLowerCase()}`
                          : "";

                        const extras = [dose, route].filter(Boolean).join(" ");

                        return (
                          <li key={p.id} className="flex items-center justify-between text-xs">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium text-foreground">{p.product.name}</span>
                              {extras && <span className="text-muted-foreground">{extras}</span>}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : undefined;


                const categoryKey = s.clinicalServiceCategory ?? s.clinicalServiceCategory;
                const categoryLabel = categoryKey ? ClinicalServiceCategoryLabels[categoryKey] : undefined;

                return {
                  id: `svc-${s.id}`,
                  kind: "SERVICIO" as const,
                  title: s.clinicalServiceName,
                  metaLeft: `${Number(s.quantity ?? 0)} x ${Number(s.unitPrice ?? 0).toFixed(2)}`,
                  metaRight: `${Number(s.subtotal ?? 0).toFixed(2)}`,
                  timestamp: null,
                  details: products,
                  tagLabel: categoryLabel,
                };
              }),

              // Órdenes
              ...surgicalOrders.map((o) => {
                const right = o.status ? String(SurgicalOrderStatusLabels[o.status]) : undefined;
                const left = [o.operationRoomName].filter(Boolean).join(" • ");
                return {
                  id: `ord-${o.id}`,
                  kind: "ORDEN" as const,
                  title: o.recommendedServiceName ?? "Orden quirúrgica",
                  metaLeft: left || undefined,
                  metaRight: right,
                  timestamp: o.createdAt ? new Date(o.createdAt as string).getTime() : null,
                  details: o.notes ? <div className="text-muted-foreground text-xs">{o.notes}</div> : undefined,
                };
              }),

              // Laboratorio
              ...labRequests.map((l) => {
                const items =
                  l.items && l.items.length > 0 ? (
                    <ul className="mt-2 space-y-1">
                      {l.items.map((i) => (
                        <li key={i.id} className="flex items-center justify-between text-xs">
                          <span className="font-medium text-foreground">{i.testName}</span>
                          <span className="text-muted-foreground">
                            {Number(i.quantity ?? 0)}
                            {i.unitPrice ? ` x ${Number(i.unitPrice).toFixed(2)}` : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : undefined;

                return {
                  id: `lab-${l.id}`,
                  kind: "LAB" as const,
                  title: l.laboratoryName,
                  metaLeft: l.status ? String(LabRequestItemStatusLabels[l.status]) : undefined,
                  metaRight: l.createdAt ? new Date(l.createdAt).toLocaleString() : undefined,
                  timestamp: l.createdAt ? new Date(l.createdAt).getTime() : null,
                  details: items,
                };
              }),
            ];

            // Orden por timestamp
            entries.sort((a, b) => {
              const ta = a.timestamp ?? -Infinity;
              const tb = b.timestamp ?? -Infinity;
              return tb - ta;
            });

            const kindIcon = (kind: Entry["kind"]) => {
              switch (kind) {
                case "MEDICACION":
                  return <Pill className="h-4 w-4" />;
                case "SERVICIO":
                  return <ClipboardPlus className="h-4 w-4" />;
                case "ORDEN":
                  return <ClipboardPlus className="h-4 w-4" />;
                case "LAB":
                  return <Beaker className="h-4 w-4" />;
              }
            };

            const kindLabel = (kind: Entry["kind"]) => {
              switch (kind) {
                case "MEDICACION":
                  return "Medicación";
                case "SERVICIO":
                  return "Servicio";
                case "ORDEN":
                  return "Orden quirúrgica";
                case "LAB":
                  return "Laboratorio";
              }
            };

            return (
              <div className="space-y-3">
                {entries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin registros</p>
                ) : (
                  entries.map((e) => (
                    <div key={e.id} className="rounded-lg border p-3 hover:bg-muted/40 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="grid h-8 w-8 place-items-center rounded-lg border">
                            {kindIcon(e.kind)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{e.title}</span>
                              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] leading-none">
                                {e.tagLabel ?? kindLabel(e.kind)}
                              </span>
                            </div>
                            {(e.metaLeft || e.details) && (
                              <div className="mt-1 text-xs text-muted-foreground">
                                {e.metaLeft}
                              </div>
                            )}
                          </div>
                        </div>

                        {(e.metaRight || e.timestamp) && (
                          <div className="text-right">
                            {e.metaRight && <div className="text-sm tabular-nums">{e.metaRight}</div>}
                            {e.timestamp && (
                              <div className="text-xs text-muted-foreground">
                                {new Date(e.timestamp).toLocaleString()}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {e.details && <div className="mt-2">{e.details}</div>}
                    </div>
                  ))
                )}
              </div>
            );
          })()}


          {/* Indicaciones al propietario */}
          <Form {...form}>
            <FormField
              control={form.control}
              name="plan"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      id="plan"
                      value={field.value ?? ""}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        autosave("plan", e.target.value === "" ? null : e.target.value);
                      }}
                      rows={3}
                      placeholder="Indicaciones al propietario"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Form>
        </CardContent>

      </Card>

      {openMedication && (
        <MedicationModal
          id={detail.id}
          onClose={() => setOpenMedication(false)}
          onAdded={(data) => {
            setMedications(data.medicationAdministrations);
            updateVersion(data.version);
            syncDetail({
              version: data.version,
              medicationAdministrations: data.medicationAdministrations,
            });
          }}
        />
      )}

      {openServiceItemCategory && (
        <ServiceItemModal
          id={detail.id}
          category={openServiceItemCategory}
          onClose={() => setOpenServiceItemCategory(null)}
          onAdded={(data) => {
            setServiceItems(data.serviceItems);
            updateVersion(data.version);
            syncDetail({
              version: data.version,
              serviceItems: data.serviceItems,
            });
          }}
        />
      )}

      {openSurgicalOrder && (
        <SurgicalOrderModal
          id={detail.id}
          onClose={() => setOpenSurgicalOrder(false)}
          onAdded={(data) => {
            setSurgicalOrders(data.surgicalOrders);
            updateVersion(data.version);
            syncDetail({
              version: data.version,
              surgicalOrders: data.surgicalOrders,
            });
          }}
        />
      )}

      {openLab && (
        <LaboratoryRequestModal
          id={detail.id}
          onClose={() => setOpenLab(false)}
          onAdded={(data) => {
            setLabRequests(data.laboratoryRequests);
            updateVersion(data.version);
            syncDetail({
              version: data.version,
              laboratoryRequests: data.laboratoryRequests,
            });
          }}
        />
      )}

      {openTemplate && (
        <PrescriptionTemplateApplyModal
          id={detail.id}
          onClose={() => setOpenTemplate(false)}
          onAdded={(data) => {
            setMedications(data.medicationAdministrations);
            updateVersion(data.version);
            syncDetail({
              version: data.version,
              medicationAdministrations: data.medicationAdministrations,
            });
          }}
        />
      )}

    </div>
  );
});

ConsultationForm.displayName = "ConsultationForm";
export default ConsultationForm;