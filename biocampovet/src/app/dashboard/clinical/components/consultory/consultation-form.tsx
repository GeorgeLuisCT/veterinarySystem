"use client";

import React, { useCallback, useMemo, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Pill, Syringe, Beaker, ClipboardPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ClinicalAttentionStatus } from "../../enums/clinical-attention-status";
import { ClinicalAttentionDetailResponse, MedicationAdministrationResponse, ClinicalServiceItemResponse, SurgicalOrderResponse, LaboratoryRequestResponse, ClinicalAttentionPatchResponse } from "../../types/clinical-attention-response";
import { UpdateClinicalAttentionRequest, updateClinicalAttentionSchema } from "../../types/clinical-attention-request";
import ClinicalAttentionService from "../../service/clinical-attention-service";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { MedicationModal } from "./add- medication-modal";
import { ServiceItemModal } from "./service-item-modal";
import { SurgicalOrderModal } from "./surgical-order-modal";
import { LaboratoryRequestModal } from "./laboratory-request-modal";

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
  const [openServiceItem, setOpenServiceItem] = useState(false);
  const [openSurgicalOrder, setOpenSurgicalOrder] = useState(false);
  const [openLab, setOpenLab] = useState(false);

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
      (body as any)[field] = value === "" ? null : value;

      const res: ClinicalAttentionPatchResponse = await ClinicalAttentionService.patch(detail.id, body);
      versionRef.current = res.version;
      form.setValue("version", res.version, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
      if (res.updated && res.updated[field as string] !== undefined) {
        form.setValue(field as any, res.updated[field as string] as any, { shouldDirty: false });
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


  const statusOptions = useMemo(
    () =>
      Object.values(ClinicalAttentionStatus).map((v) => ({
        value: v,
        label: v.replaceAll("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase()),
      })),
    []
  );

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
                          const num = v === "" ? null : parseInt(v, 10);
                          const finalVal = Number.isNaN(num as any) ? null : num;
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
                          const num = v === "" ? null : parseInt(v, 10);
                          const finalVal = Number.isNaN(num as any) ? null : num;
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
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setOpenMedication(true)}>
              <Pill className="mr-2 h-4 w-4" />
              Medicación
            </Button>
            <Button variant="outline" onClick={() => setOpenServiceItem(true)}>
              <Syringe className="mr-2 h-4 w-4" />
              Servicio
            </Button>
            <Button variant="outline" onClick={() => setOpenLab(true)}>
              <Beaker className="mr-2 h-4 w-4" />
              Laboratorio
            </Button>
            <Button variant="outline" onClick={() => setOpenSurgicalOrder(true)}>
              <ClipboardPlus className="mr-2 h-4 w-4" />
              Orden quirúrgica
            </Button>
          </div>

          <Separator />

          <div className="space-y-6">
            <div>
              <h4 className="mb-2 font-semibold">Medicaciones</h4>
              <div className="space-y-2">
                {medications.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin registros</p>
                ) : (
                  medications.map((m) => (
                    <div key={m.id} className="rounded-md border p-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>{m.productName}</span>
                        <span>{new Date(m.administeredAt).toLocaleString()}</span>
                      </div>
                      <div className="text-muted-foreground">
                        {m.doseAmount ? `${m.doseAmount} ${m.doseUnit ?? ""}` : ""} {m.route ?? ""}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h4 className="mb-2 font-semibold">Servicios</h4>
              <div className="space-y-2">
                {serviceItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin registros</p>
                ) : (
                  serviceItems.map((s) => (
                    <div key={s.id} className="rounded-md border p-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>{s.clinicalServiceName}</span>
                        <span>{(Number(s.subtotal) ?? 0).toFixed(2)}</span>
                      </div>
                      <div className="text-muted-foreground">{s.quantity} x {s.unitPrice}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h4 className="mb-2 font-semibold">Órdenes quirúrgicas</h4>
              <div className="space-y-2">
                {surgicalOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin registros</p>
                ) : (
                  surgicalOrders.map((o) => (
                    <div key={o.id} className="rounded-md border p-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>#{o.id}</span>
                        <span>{o.status}</span>
                      </div>
                      <div className="text-muted-foreground">{o.notes ?? ""}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h4 className="mb-2 font-semibold">Solicitudes de laboratorio</h4>
              <div className="space-y-2">
                {labRequests.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin registros</p>
                ) : (
                  labRequests.map((l) => (
                    <div key={l.id} className="rounded-md border p-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>{l.laboratoryName}</span>
                        <span>{l.status}</span>
                      </div>
                      <div className="text-muted-foreground">{new Date(l.createdAt).toLocaleString()}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

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

      {openServiceItem && (
        <ServiceItemModal
          id={detail.id}
          onClose={() => setOpenServiceItem(false)}
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

    </div>
  );
});

ConsultationForm.displayName = "ConsultationForm";
export default ConsultationForm;