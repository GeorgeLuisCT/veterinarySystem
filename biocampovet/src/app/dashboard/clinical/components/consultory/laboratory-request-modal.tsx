"use client"
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addClinicalAttentionLaboratorySchema, AddClinicalAttentionLaboratoryRequest } from "../../types/clinical-attention-request";
import { LabRequestStatus } from "@/app/dashboard/clinical/enums/lab-request-status";
import { ClinicalAttentionService } from "../../service/clinical-attention-service";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { ClinicalAttentionDetailResponse } from "../../types/clinical-attention-response";

type CommonProps = { id: number; onClose: () => void; onAdded: (data: ClinicalAttentionDetailResponse) => void };

export function LaboratoryRequestModal({ id, onClose, onAdded }: CommonProps) {
    const form = useForm<AddClinicalAttentionLaboratoryRequest>({
      resolver: zodResolver(addClinicalAttentionLaboratorySchema),
      defaultValues: {
        laboratoryId: undefined,
        requestingEmployeeId: null,
        status: LabRequestStatus.REQUESTED,
        createdAt: new Date().toISOString(),
        clinicalNotes: "",
        items: [],
      },
      mode: "onChange",
    });
    const [submitting, setSubmitting] = useState(false);
    const [itemName, setItemName] = useState("");
    const [sampleType, setSampleType] = useState("");
    const [itemPrice, setItemPrice] = useState<string>("");
    const [itemQty, setItemQty] = useState<string>("1");
    const [itemNotes, setItemNotes] = useState("");
  
    const addItem = () => {
      const price = itemPrice.trim() === "" ? 0 : Number(itemPrice);
      const qty = itemQty.trim() === "" ? 1 : Number(itemQty);
      const next = [
        ...form.getValues("items"),
        {
          testName: itemName,
          sampleType: sampleType || null,
          unitPrice: price,
          quantity: qty,
          notes: itemNotes || null,
        },
      ];
      form.setValue("items", next, { shouldDirty: true });
      setItemName("");
      setSampleType("");
      setItemPrice("");
      setItemQty("1");
      setItemNotes("");
    };
  
    const onSubmit = async (values: AddClinicalAttentionLaboratoryRequest) => {
      setSubmitting(true);
      try {
        const res = await ClinicalAttentionService.addLaboratoryRequest(id, values);
        onAdded(res);
        onClose();
      } finally {
        setSubmitting(false);
      }
    };
  
    const statusOptions = Object.values(LabRequestStatus).map((v) => ({ value: v, label: v }));
  
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar solicitud de laboratorio</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-3 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="laboratoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FloatingLabelInput
                          id="laboratoryId"
                          label="Laboratorio ID"
                          type="number"
                          value={field.value ? String(field.value) : ""}
                          onChange={(v) => field.onChange(v === "" ? undefined : Number(v))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="requestingEmployeeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FloatingLabelInput
                          id="requestingEmployeeId"
                          label="Empleado solicitante ID"
                          type="number"
                          value={field.value ? String(field.value) : ""}
                          onChange={(v) => field.onChange(v === "" ? null : Number(v))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
  
              <div className="grid gap-3 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="createdAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FloatingLabelInput id="createdAt" label="Fecha/hora (ISO)" value={field.value ?? ""} onChange={(v) => field.onChange(v)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FloatingLabelSelect id="status" label="Estado" value={field.value ?? ""} options={statusOptions} onValueChange={(v) => field.onChange(v || null)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
  
              <FormField
                control={form.control}
                name="clinicalNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea id="clinicalNotes" rows={3} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.value)} placeholder="Notas clínicas" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
  
              <div className="rounded-md border p-3">
                <div className="mb-2 text-sm font-medium">Pruebas</div>
                <div className="grid gap-2 sm:grid-cols-5">
                  <FloatingLabelInput id="testName" label="Nombre" value={itemName} onChange={setItemName} />
                  <FloatingLabelInput id="sampleType" label="Muestra" value={sampleType} onChange={setSampleType} />
                  <FloatingLabelInput id="unitPrice" label="Precio" type="number" value={itemPrice} onChange={setItemPrice} />
                  <FloatingLabelInput id="quantity" label="Cantidad" type="number" value={itemQty} onChange={setItemQty} />
                  <FloatingLabelInput id="notes" label="Notas" value={itemNotes} onChange={setItemNotes} />
                </div>
                <div className="mt-2">
                  <Button type="button" variant="outline" onClick={addItem}>
                    Agregar prueba
                  </Button>
                </div>
                <div className="mt-3 space-y-2">
                  {form.getValues("items").length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin pruebas</p>
                  ) : (
                    form.getValues("items").map((it, i) => (
                      <div key={`${it.testName}-${i}`} className="rounded-md border p-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span>{it.testName}</span>
                          <span>{(Number(it.quantity) * Number(it.unitPrice)).toFixed(2)}</span>
                        </div>
                        <div className="text-muted-foreground">{it.sampleType ?? ""}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
  
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Guardando..." : "Guardar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  }