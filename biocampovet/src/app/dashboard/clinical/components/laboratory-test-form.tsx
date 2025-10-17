"use client";

import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, X, PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormControl, FormMessage, FormLabel } from "@/components/ui/form";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { getAaxiosErrorMessage } from "@/helpers/error";

import {
  createLaboratoryTestSchema,
  updateLaboratoryTestSchema,
  CreateLaboratoryTestRequest,
} from "../types/laboratory-test-request";
import { LaboratoryTestResponse } from "../types/laboratory-test-response";
import LaboratoryTestService from "../service/laboratory-test-service";
import LaboratoryService from "@/app/dashboard/branche/services/laboratory-service";
import { LaboratoryResponse } from "@/app/dashboard/branche/types/laboratory-response";
import { useToast } from "@/hooks/use-toast";
import { LabValueType } from "../enums/lab-value-type";

interface LaboratoryTestFormProps {
  setOpen: (open: boolean) => void;
  testId?: number;
  onSuccess?: (test: LaboratoryTestResponse) => void;
}

export default function LaboratoryTestForm({ setOpen, testId, onSuccess }: LaboratoryTestFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [laboratories, setLaboratories] = React.useState<LaboratoryResponse[]>([]);

  const schema = testId ? updateLaboratoryTestSchema : createLaboratoryTestSchema;

  const form = useForm<CreateLaboratoryTestRequest>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      price: 0,
      active: true,
      parameters: [],
      laboratories: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "parameters",
  });

  const laboratoriesArray = useFieldArray({
    control: form.control,
    name: "laboratories",
  });

  React.useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [labs, testData] = await Promise.all([
          LaboratoryService.listAll(),
          testId ? LaboratoryTestService.getById(testId) : Promise.resolve(undefined),
        ]);

        setLaboratories(labs);

        if (testData) {
          const activeLabIds = new Set(testData.laboratories.filter(l => l.active).map(l => l.laboratoryId));
          form.reset({
            name: testData.name,
            code: testData.code,
            description: testData.description || "",
            price: testData.price,
            active: testData.active,
            laboratories: labs.map(lab => ({
              laboratoryId: lab.id,
              active: activeLabIds.has(lab.id),
            })),
            parameters: testData.parameters?.map(p => ({
              id: p.id,
              name: p.name,
              valueType: p.valueType,
              unit: p.unit ?? undefined,
              allowedOptions: p.allowedOptions ?? undefined,
              refMin: p.refMin ?? undefined,
              refMax: p.refMax ?? undefined,
              refText: p.refText ?? undefined,
              decimals: p.decimals ?? undefined,
            })) || [],
          });
        } else {
            form.reset({
                ...form.getValues(),
                laboratories: labs.map(lab => ({
                    laboratoryId: lab.id,
                    active: true, // Default to active for new tests
                })),
            });
        }
      } catch (error: unknown) {
        const message = getAaxiosErrorMessage(error) ?? "Error al cargar el formulario.";
        console.error(message);
        toast({ variant: "destructive", title: "Error", description: message });
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [testId, form, setOpen, toast]);

  const onSubmit = async (values: CreateLaboratoryTestRequest) => {
    try {
      if (testId) {
        const updated = await LaboratoryTestService.update(testId, values);
        toast({ variant: "default", title: "Éxito", description: "Prueba actualizada." });
        onSuccess?.(updated);
      } else {
        const created = await LaboratoryTestService.create(values);
        toast({ variant: "default", title: "Éxito", description: "Prueba registrada." });
        onSuccess?.(created);
      }
      setOpen(false);
    } catch (error: unknown) {
      const message = getAaxiosErrorMessage(error) ?? "Error al procesar la prueba.";
      toast({ variant: "destructive", title: "Error", description: message });
    }
  };

  return (
    <div className="max-h-[80vh] overflow-auto p-4">
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-600" />
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem className="gap-0">
                    <FormControl>
                      <FloatingLabelInput {...field} id="code" label="Código" disabled={form.formState.isSubmitting} />
                    </FormControl>
                    <FormMessage className="ml-2" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="gap-0">
                    <FormControl>
                      <FloatingLabelInput {...field} id="name" label="Nombre" disabled={form.formState.isSubmitting} />
                    </FormControl>
                    <FormMessage className="ml-2" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="gap-0">
                  <FormControl>
                    <FloatingLabelInput {...field} id="description" label="Descripción" disabled={form.formState.isSubmitting} />
                  </FormControl>
                  <FormMessage className="ml-2" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem className="gap-0">
                    <FormControl>
                      <FloatingLabelInput
                        {...field}
                        id="price"
                        type="number"
                        label="Precio"
                        disabled={form.formState.isSubmitting}
                      />
                    </FormControl>
                    <FormMessage className="ml-2" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <label htmlFor="active-switch">Activo</label>
                    </div>
                    <FormControl>
                      <Switch
                        id="active-switch"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={form.formState.isSubmitting}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3 rounded-md border border-border p-3">
              <h4 className="text-sm font-medium text-muted-foreground">Laboratorios</h4>
              <div className="space-y-2">
                {laboratoriesArray.fields.map((field, index) => {
                  const lab = laboratories.find(l => l.id === field.laboratoryId);
                  return (
                    <FormField
                      key={field.id}
                      control={form.control}
                      name={`laboratories.${index}.active`}
                      render={({ field: checkboxField }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={checkboxField.value}
                              onCheckedChange={checkboxField.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {lab?.name ?? `Laboratorio ${field.laboratoryId}`}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 rounded-md border border-border p-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground">Parámetros</h4>
                <Button type="button" size="sm" variant="ghost" onClick={() => append({ name: "", valueType: LabValueType.NUMERIC, unit: "", allowedOptions: "", refMin: null, refMax: null, refText: "", decimals: null })}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Añadir Parámetro
                </Button>
              </div>
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex flex-col gap-2 p-2 border rounded-md">
                    <div className="flex items-center gap-2">
                        <FormField
                          control={form.control}
                          name={`parameters.${index}.name`}
                          render={({ field }) => <FloatingLabelInput {...field} id={`parameters-${index}-name`} label="Nombre" className="flex-1" />}
                        />
                        <FormField
                            control={form.control}
                            name={`parameters.${index}.valueType`}
                            render={({ field }) => (
                                <FloatingLabelSelect
                                    id={`parameters.${index}-valueType`}
                                    label="Tipo de Valor"
                                    options={Object.values(LabValueType).map(v => ({ value: v, label: v }))}
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    disabled={form.formState.isSubmitting}
                                />
                            )}
                        />
                        <Button type="button" size="icon" variant="ghost" onClick={() => remove(index)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    {form.watch(`parameters.${index}.valueType`) === LabValueType.NUMERIC && (
                        <div className="grid grid-cols-2 gap-2">
                            <FormField
                                control={form.control}
                                name={`parameters.${index}.unit`}
                                render={({ field }) => <FloatingLabelInput {...field} id={`parameters-${index}-unit`} label="Unidad" />}
                            />
                            <FormField
                                control={form.control}
                                name={`parameters.${index}.refMin`}
                                render={({ field }) => <FloatingLabelInput {...field} value={field.value ?? ''} onChange={v => field.onChange(v === '' ? null : parseFloat(v))} id={`parameters-${index}-refMin`} label="Ref. Mín" type="number" />}
                            />
                            <FormField
                                control={form.control}
                                name={`parameters.${index}.refMax`}
                                render={({ field }) => <FloatingLabelInput {...field} value={field.value ?? ''} onChange={v => field.onChange(v === '' ? null : parseFloat(v))} id={`parameters-${index}-refMax`} label="Ref. Máx" type="number" />}
                            />
                            <FormField
                                control={form.control}
                                name={`parameters.${index}.decimals`}
                                render={({ field }) => <FloatingLabelInput {...field} value={field.value ?? ''} onChange={v => field.onChange(v === '' ? null : parseInt(v, 10))} id={`parameters-${index}-decimals`} label="Decimales" type="number" />}
                            />
                        </div>
                    )}
                    {form.watch(`parameters.${index}.valueType`) === LabValueType.TEXT && (
                        <FormField
                            control={form.control}
                            name={`parameters.${index}.refText`}
                            render={({ field }) => <FloatingLabelInput {...field} id={`parameters-${index}-refText`} label="Texto de Referencia" />}
                        />
                    )}
                    {form.watch(`parameters.${index}.valueType`) === LabValueType.SELECT && (
                        <FormField
                            control={form.control}
                            name={`parameters.${index}.allowedOptions`}
                            render={({ field }) => <FloatingLabelInput {...field} id={`parameters-${index}-allowedOptions`} label="Opciones (separadas por coma)" />}
                        />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center">
              <Button type="submit" disabled={form.formState.isSubmitting} className="w-48">
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {testId ? "Guardar" : "Registrar"}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
