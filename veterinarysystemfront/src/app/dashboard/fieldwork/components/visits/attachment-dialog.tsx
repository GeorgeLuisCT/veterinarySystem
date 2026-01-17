"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FloatingLabelInput } from "@/components/floating-label-input";
import VisitService from "../../services/visit-service";
import { addAttachmentSchema, type AddAttachmentRequest } from "../../types/visit-request";
import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";

export default function AttachmentDialog({ open, onOpenChange, visitId, onSuccess }: { open: boolean; onOpenChange: (open: boolean) => void; visitId: number; onSuccess: () => void; }) {
  const { toast } = useToast();
  const form = useForm<AddAttachmentRequest>({ resolver: zodResolver(addAttachmentSchema) });

  const onSubmit = async (values: AddAttachmentRequest) => {
    try { await VisitService.addAttachment(visitId, values); onSuccess(); }
    catch (e) { toast({ variant: "destructive", title: "Error", description: getAaxiosErrorMessage(e) }); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Adjuntar archivo</DialogTitle>
          <DialogDescription>Agrega soporte multimedia o documentos.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField control={form.control} name="fileName" render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FloatingLabelInput id="fileName" label="Nombre" value={String(field.value ?? "")} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="fileUrl" render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FloatingLabelInput id="fileUrl" label="URL" value={String(field.value ?? "")} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="mimeType" render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FloatingLabelInput id="mimeType" label="MIME (opcional)" value={String(field.value ?? "")} onChange={field.onChange} />
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
