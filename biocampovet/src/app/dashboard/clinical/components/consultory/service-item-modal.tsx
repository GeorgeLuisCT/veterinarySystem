"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addClinicalAttentionServiceItemSchema, AddClinicalAttentionServiceItemRequest } from "../../types/clinical-attention-request";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { ClinicalAttentionService } from "../../service/clinical-attention-service";
import { ClinicalAttentionDetailResponse } from "../../types/clinical-attention-response";
import { useUser } from "@/context/user-context";
import { ClinicalServiceQuickSearchResponse } from "../../types/clinical-service-response";
import ClinicalServiceService from "../../service/clinical-service-service";

type CommonProps = { 
  id: number; 
  onClose: () => void; 
  onAdded: (data: ClinicalAttentionDetailResponse) => void 
};

export function ServiceItemModal({ id, onClose, onAdded }: CommonProps) {
    const { userInfo } = useUser();
    const [submitting, setSubmitting] = useState(false);
    const [serviceOptions, setServiceOptions] = useState<{ value: string; label: string }[]>([]);
    const [searchResults, setSearchResults] = useState<ClinicalServiceQuickSearchResponse[]>([]);
  
    const form = useForm<AddClinicalAttentionServiceItemRequest>({
      resolver: zodResolver(addClinicalAttentionServiceItemSchema),
      defaultValues: {
        clinicalServiceId: undefined,
        unitPrice: 0,
        quantity: 1,
        notes: "",
      },
      mode: "onChange",
    });
  
    const handleSearchServices = async (query: string) => {
      if (query.length < 2) {
        setServiceOptions([]);
        setSearchResults([]);
        return;
      }
      try {
        const results = await ClinicalServiceService.quickSearch(query, userInfo?.selectedBranch.id);
        const options = results.map((service) => ({
          value: String(service.id),
          label: service.name,
        }));
        setSearchResults(results);
        setServiceOptions(options);
      } catch (error) {
        console.error("Error searching services:", error);
        setServiceOptions([]);
        setSearchResults([]);
      }
    };

    const onSubmit = async (values: AddClinicalAttentionServiceItemRequest) => {
      setSubmitting(true);
      try {
        const res = await ClinicalAttentionService.addServiceItem(id, values);
        onAdded(res);
        onClose();
      } finally {
        setSubmitting(false);
      }
    };
  
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Agregar servicio</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="clinicalServiceId"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelSelect
                        id="clinicalServiceId"
                        label="Servicio"
                        placeholder="Buscar servicio..."
                        options={serviceOptions}
                        onSearch={handleSearchServices}
                        value={field.value ? String(field.value) : ""}
                        onValueChange={(v) => {
                          const selectedId = v ? Number(v) : undefined;
                          field.onChange(selectedId);
                          if (selectedId) {
                            const selectedService = searchResults.find(s => s.id === selectedId);
                            if (selectedService) {
                              form.setValue("unitPrice", selectedService.price || 0, { shouldValidate: true });
                            }
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="unitPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FloatingLabelInput
                          id="unitPrice"
                          label="Precio unitario"
                          type="number"
                          value={String(field.value ?? "")}
                          onChange={(v) => field.onChange(v === "" ? 0 : Number(v))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FloatingLabelInput
                          id="quantity"
                          label="Cantidad"
                          type="number"
                          value={String(field.value ?? "")}
                          onChange={(v) => field.onChange(v === "" ? 1 : Number(v))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        id="notes"
                        rows={3}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.value)}
                        placeholder="Notas (opcional)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={!form.formState.isValid || submitting}>
                  {submitting ? "Guardando..." : "Guardar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  }