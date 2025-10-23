"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FloatingLabelInput } from "@/components/floating-label-input";
import VisitService from "../../services/visit-service";
import { setBiosecuritySchema, type SetBiosecurityRequest } from "../../types/visit-request";
import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";

export default function BiosecurityDialog({ open, onOpenChange, visitId, onSuccess }: { open: boolean; onOpenChange: (open: boolean) => void; visitId: number; onSuccess: () => void; }) {
  const { toast } = useToast();
  const form = useForm<SetBiosecurityRequest>({ resolver: zodResolver(setBiosecuritySchema), defaultValues: { vehicleAndEquipmentCleaned: true, ppeUsed: true, handHygiene: true } as any });

  const onSubmit = async (values: SetBiosecurityRequest) => {
    try { await VisitService.setBiosecurity(visitId, values); onSuccess(); }
    catch (e) { toast({ variant: "destructive", title: "Error", description: getAaxiosErrorMessage(e) }); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Bioseguridad</DialogTitle>
          <DialogDescription>Actualiza el checklist de bioseguridad.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField control={form.control} name="vehicleAndEquipmentCleaned" render={({ field }) => (
              <FormItem>
                <FormControl>
                  <label className="inline-flex items-center gap-2"><input type="checkbox" checked={!!field.value} onChange={(e) => field.onChange(e.target.checked)} /> Vehículo/equipo limpios</label>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="ppeUsed" render={({ field }) => (
              <FormItem>
                <FormControl>
                  <label className="inline-flex items-center gap-2"><input type="checkbox" checked={!!field.value} onChange={(e) => field.onChange(e.target.checked)} /> Uso de EPP</label>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="handHygiene" render={({ field }) => (
              <FormItem>
                <FormControl>
                  <label className="inline-flex items-center gap-2"><input type="checkbox" checked={!!field.value} onChange={(e) => field.onChange(e.target.checked)} /> Higiene de manos</label>
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
