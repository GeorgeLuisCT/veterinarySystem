"use client";
import { useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { treasuryAccountSchema } from "../_schemas/treasury-account-schema";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { TreasuryAccountType } from "../_enums/accounts-enums";

type FormShape = { name: string; type: TreasuryAccountType; description?: string };

export function AccountFormDialog({
  open,
  mode,
  defaults,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  defaults: FormShape;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: FormShape) => Promise<void> | void;
}) {
  const form = useForm<FormShape>({
    resolver: zodResolver(treasuryAccountSchema),
    defaultValues: defaults,
    mode: "onChange",
  });

  useEffect(() => {
    if (open) form.reset(defaults);
  }, [open, defaults, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit({
      name: values.name.trim(),
      type: values.type,
      description: values.description?.trim() || undefined,
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(96vw,560px)]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Nueva cuenta" : "Editar cuenta"}</DialogTitle>
          <DialogDescription>Completa los datos básicos de la cuenta de tesorería.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <Label>Nombre</Label>
                  <FormControl>
                    <Input placeholder="Ej. BCP Soles" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <Label>Tipo</Label>
                  <FormControl>
                    <Select value={field.value} onValueChange={(v) => field.onChange(v as TreasuryAccountType)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={TreasuryAccountType.CASH}>Caja</SelectItem>
                        <SelectItem value={TreasuryAccountType.BANK}>Banco</SelectItem>
                        <SelectItem value={TreasuryAccountType.DIGITAL}>Digital</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <Label>Descripción</Label>
                  <FormControl>
                    <Input placeholder="Opcional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
