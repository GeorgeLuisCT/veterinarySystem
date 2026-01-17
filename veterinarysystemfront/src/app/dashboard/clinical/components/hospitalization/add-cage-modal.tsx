"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";
import { cageSchema } from "@/app/dashboard/clinical/types/cage-request";
import CageService from "@/app/dashboard/clinical/service/cage-service";
import { CageResponse } from "@/app/dashboard/clinical/types/cage-response";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { BranchService } from "@/app/dashboard/branche/services/branch-service";
import { CageSizeOptions } from "../../enums/cage-size";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (newCage: CageResponse) => void;
}

type FormShape = z.infer<typeof cageSchema>;
type BranchOption = { value: string; label: string };

export function NewCageModal({ open, onOpenChange, onSuccess }: Props) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [branchOptions, setBranchOptions] = useState<BranchOption[]>([]);

  const form = useForm<FormShape>({
    resolver: zodResolver(cageSchema),
    defaultValues: {
      name: "",
      size: undefined,
      branchId: undefined,
    },
  });

  const fetchBranches = useCallback(async () => {
    try {
      const response = await BranchService.getBranchesByLoggedEmployee();
      const options: BranchOption[] = response.map((branch) => ({
        value: String(branch.id),
        label: branch.name,
      }));
      setBranchOptions(options);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: getAaxiosErrorMessage(error) ?? "No se pudieron cargar las sucursales.",
      });
      setBranchOptions([]);
    }
  }, [toast]);

  useEffect(() => {
    if (open) {
      fetchBranches();
      form.reset();
    }
  }, [open, fetchBranches, form]);

  const onSubmit = async (data: FormShape) => {
    setIsSubmitting(true);
    try {
      const response = await CageService.create(data);
      toast({ title: "Éxito", description: "La jaula ha sido creada correctamente." });
      onSuccess(response);
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: getAaxiosErrorMessage(error) ?? "No se pudo crear la jaula.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agregar Nueva Jaula</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelInput id="cage-name" label="Nombre" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="size"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelSelect
                      id="cage-size"
                      label="Tamaño"
                      value={field.value}
                      onValueChange={field.onChange}
                      options={CageSizeOptions}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="branchId"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelSelect
                      id="cage-branchId"
                      label="Sucursal"
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(value) => field.onChange(Number(value))}
                      options={branchOptions}
                      disabled={isSubmitting}
                      emptyMessage="No hay sucursales disponibles."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar Jaula"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}