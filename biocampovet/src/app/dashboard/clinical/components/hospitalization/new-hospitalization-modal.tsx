"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";
import { CageResponse } from "@/app/dashboard/clinical/types/cage-response";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import HospitalizationService from "../../service/hospitalization-service";
import AnimalService from "@/app/dashboard/patients/animals/service/animal-service";
import { createHospitalizationSchema } from "../../types/hospitalization-request";
import { AdmissionTiming } from "../../enums/admission-timing";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cage: CageResponse;
  onSuccess: () => void;
}

type FormShape = z.infer<typeof createHospitalizationSchema>;
type Option = { id: number; label: string };

export function NewHospitalizationModal({ open, onOpenChange, cage, onSuccess }: Props) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [animalOptions, setAnimalOptions] = useState<Option[]>([]);

  const form = useForm<FormShape>({
    resolver: zodResolver(createHospitalizationSchema),
    defaultValues: {
      cageId: cage.id,
      animalId: undefined,
      attentionId: null,
      admissionTiming: AdmissionTiming.NONE,
      cause: null,
      clinicalServiceId: null,
      admissionNotes: "",
    },
  });

  const fetchAnimals = useCallback(
    async (query?: string) => {
      try {
        const response = await AnimalService.searchAnimals(
          query?.trim() ? query.trim() : undefined,
          true
        );
        const opts: Option[] = response.map((a) => ({
          id: a.id,
          label: `${a.name} • ${a.ownerName ?? "Sin propietario"} • ${a.speciesName ?? ""}`.trim(),
        }));
        setAnimalOptions(opts);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: getAaxiosErrorMessage(error) ?? "No se pudieron cargar las mascotas.",
        });
        setAnimalOptions([]);
      }
    },
    [toast]
  );

  const handleSearchAnimals = useCallback((q: string) => { void fetchAnimals(q); }, [fetchAnimals]);

  useEffect(() => {
    if (!open) return;
    void fetchAnimals();
  }, [open, fetchAnimals]);

  const onSubmit = async (data: FormShape) => {
    setIsSubmitting(true);
    try {
      await HospitalizationService.create(data);
      toast({ title: "Éxito", description: "El paciente ha sido admitido a hospitalización." });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: getAaxiosErrorMessage(error) ?? "No se pudo admitir al paciente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Admitir Paciente en {cage.name}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="animalId"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelSelect
                      id="hospitalization-animalId"
                      label="Mascota"
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(value) => field.onChange(Number(value))}
                      options={animalOptions.map((animal) => ({
                        value: String(animal.id),
                        label: animal.label,
                      }))}
                      onSearch={handleSearchAnimals}
                      disabled={isSubmitting}
                      emptyMessage="No se encontraron mascotas."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="admissionNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas de Admisión</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ej: Observación postoperatoria, terapia de fluidos, etc." {...field} />
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
                {isSubmitting ? "Admitiendo..." : "Confirmar Admisión"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
