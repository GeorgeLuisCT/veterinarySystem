"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FloatingLabelInput } from "@/components/floating-label-input";
import VisitService from "../../services/visit-service";
import { addServiceItemSchema, type AddServiceItemRequest } from "../../types/visit-request";
import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";

export default function ServiceItemDialog({ open, onOpenChange, visitId, onSuccess }: { open: boolean; onOpenChange: (open: boolean) => void; visitId: number; onSuccess: () => void; }) {
  const { toast } = useToast();
  const form = useForm<AddServiceItemRequest>({ resolver: zodResolver(addServiceItemSchema), defaultValues: { quantity: 1, unitPrice: 0 } as any });

  const onSubmit = async (values: AddServiceItemRequest) => {
    try { await VisitService.addServiceItem(visitId, values); onSuccess(); }
    catch (e) { toast({ variant: "destructive", title: "Error", description: getAaxiosErrorMessage(e) }); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Añadir servicio</DialogTitle>
          <DialogDescription>Agrega un servicio clínico realizado.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField control={form.control} name="clinicalServiceId" render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FloatingLabelInput id="clinicalServiceId" label="ID Servicio (temporal)" value={String(field.value ?? "")} onChange={(v) => field.onChange(v ? Number(v) : undefined)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-2">
              <FormField control={form.control} name="quantity" render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelInput id="quantity" label="Cantidad" value={String(field.value ?? "")} onChange={(v) => field.onChange(v === "" ? undefined : Number(v))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="unitPrice" render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelInput id="unitPrice" label="Precio" value={String(field.value ?? "")} onChange={(v) => field.onChange(v === "" ? undefined : Number(v))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="performedById" render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FloatingLabelInput id="performedById" label="ID Ejecutante (opcional)" value={String(field.value ?? "")} onChange={(v) => field.onChange(v ? Number(v) : undefined)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FloatingLabelInput id="notes" label="Notas" value={String(field.value ?? "")} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => form.reset()}>Limpiar</Button>
              <Button type="submit">Guardar</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
