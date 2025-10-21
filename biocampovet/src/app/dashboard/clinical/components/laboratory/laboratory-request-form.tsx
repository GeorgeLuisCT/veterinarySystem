"use client";

import React, {
  useCallback,
  useMemo,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useToast } from "@/hooks/use-toast";

import { LaboratoryRequestDetailResponse, LaboratoryRequestItemResponse } from "../../types/laboratory-request-response";
import { AddResultValuesRequest, resultValueItemSchema } from "../../types/laboratory-request-request";
import { LaboratoryRequestService } from "../../service/laboratory-request-service";
import { LabValueType } from "../../enums/lab-value-type";
import { LabUnit, LabUnitLabels, LabUnitSymbols } from "../../enums/lab-unit";

export type LaboratoryRequestFormHandle = {
  triggerSaveAll: () => Promise<void>;
};

type ResultValueItem = z.infer<typeof resultValueItemSchema>;

export type ResultInputHandle = {
  getCurrentClean(): ResultValueItem;
  getContext(): { itemId: number; parameterId: number };
};

function useDebounced(fn: (...args: any[]) => void, ms: number) {
  const ref = useRef<NodeJS.Timeout | null>(null);
  return useCallback((...args: any[]) => {
    if (ref.current) clearTimeout(ref.current);
    ref.current = setTimeout(() => fn(...args), ms);
  }, [fn, ms]);
}

const parseOptions = (allowedOptions?: string | null) => {
  if (!allowedOptions) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of (allowedOptions ?? "").split(",")) {
    const opt = raw.trim();
    if (!opt) continue;
    if (seen.has(opt)) continue;
    seen.add(opt);
    out.push(opt);
  }
  return out;
};

const ResultInput = forwardRef<ResultInputHandle, {
  item: LaboratoryRequestItemResponse;
  parameter: {
    id: number;
    name: string;
    valueType: LabValueType;
    unit: LabUnit;
    allowedOptions: string | null;
    refMin: number | null;
    refMax: number | null;
    decimals: number | null;
  };
}>(({ item, parameter }, ref) => {
  const { toast } = useToast();

  const existing = useMemo(
    () => item.results.find((r) => r.parameterId === parameter.id) ?? null,
    [item.results, parameter.id]
  );

  const defaultValues: ResultValueItem = {
    parameterId: parameter.id,
    numericValue: existing?.numericValue ?? null,
    textValue: existing?.textValue ?? null,
    booleanValue: existing?.booleanValue ?? null,
    comment: existing?.comment ?? null,
    unitOverride: existing?.unitOverride ?? null,
  };

  const form = useForm<ResultValueItem>({
    resolver: zodResolver(resultValueItemSchema),
    defaultValues,
    mode: "onChange",
  });

  const cleanByType = useCallback((snapshot: ResultValueItem): ResultValueItem => {
    const current: ResultValueItem = {
      parameterId: parameter.id,
      numericValue: snapshot.numericValue ?? null,
      textValue: snapshot.textValue ?? null,
      booleanValue: snapshot.booleanValue ?? null,
      comment: snapshot.comment ?? null,
      unitOverride: snapshot.unitOverride ?? null,
    };

    if (parameter.valueType === LabValueType.NUMERIC) {
      current.textValue = null;
      current.booleanValue = null;
      if (typeof current.numericValue !== "number" || Number.isNaN(current.numericValue)) {
        current.numericValue = null;
      }
    } else if (parameter.valueType === LabValueType.TEXT) {
      current.numericValue = null;
      current.booleanValue = null;
      if (typeof current.textValue === "string" && current.textValue.trim() === "") {
        current.textValue = null;
      }
    } else if (parameter.valueType === LabValueType.SELECT) {
      current.numericValue = null;
      current.booleanValue = null;
      if (typeof current.textValue === "string" && current.textValue.trim() === "") {
        current.textValue = null;
      }
    } else if (parameter.valueType === LabValueType.BOOLEAN) {
      current.numericValue = null;
      current.textValue = null;
      if (typeof current.booleanValue !== "boolean") {
        current.booleanValue = null;
      }
    }

    if (typeof current.comment === "string" && current.comment.trim() === "") {
      current.comment = null;
    }
    if (typeof current.unitOverride === "string" && current.unitOverride.trim() === "") {
      current.unitOverride = null;
    }

    return current;
  }, [parameter.id, parameter.valueType]);

  const buildPayload = useCallback(
    (partial: Partial<ResultValueItem>): AddResultValuesRequest => {
      const merged = cleanByType({ ...form.getValues(), ...partial } as ResultValueItem);
      return { results: [merged] };
    },
    [cleanByType, form]
  );

  const patch = useCallback(
    async (partial: Partial<ResultValueItem>) => {
      const payload = buildPayload(partial);
      try {
        await LaboratoryRequestService.addResults(item.id, payload);
      } catch {
        toast({ description: "Error al guardar resultado.", variant: "destructive" });
      }
    },
    [buildPayload, item.id, toast]
  );

  const debouncedPatch = useDebounced(patch, 700);

  useImperativeHandle(ref, (): ResultInputHandle => ({
    getCurrentClean: () => cleanByType(form.getValues()),
    getContext: () => ({ itemId: item.id, parameterId: parameter.id }),
  }), [cleanByType, form, item.id, parameter.id]);

  const step = useMemo(() => {
    const d = parameter.decimals ?? 0;
    return d <= 0 ? 1 : Number(`0.${"0".repeat(d - 1)}1`);
  }, [parameter.decimals]);

  const options = useMemo(() => parseOptions(parameter.allowedOptions), [parameter.allowedOptions]);

  return (
    <Form {...form}>
      <div className="grid gap-2">
        {parameter.valueType === LabValueType.NUMERIC && (
          <FormField
            control={form.control}
            name="numericValue"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step={step}
                      placeholder="0"
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const v = e.target.value === "" ? null : Number(e.target.value);
                        field.onChange(v);
                        debouncedPatch({ numericValue: v });
                      }}
                    />
                  </FormControl>
                  <span className="text-sm text-muted-foreground">{LabUnitSymbols[parameter.unit]}</span>
                </div>
                <FormMessage />
                {(parameter.refMin != null || parameter.refMax != null) && (
                  <p className="text-xs text-muted-foreground">
                    Ref: {parameter.refMin != null ? parameter.refMin : "—"} – {parameter.refMax != null ? parameter.refMax : "—"} {LabUnitSymbols[parameter.unit]}
                  </p>
                )}
              </FormItem>
            )}
          />
        )}

        {parameter.valueType === LabValueType.TEXT && (
          <FormField
            control={form.control}
            name="textValue"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="Ingresar resultado (texto)…"
                    value={field.value ?? ""}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      debouncedPatch({ textValue: e.target.value });
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {parameter.valueType === LabValueType.SELECT && (
          <FormField
            control={form.control}
            name="textValue"
            render={({ field }) => (
              <FormItem>
                <Select
                  value={field.value ?? ""}
                  onValueChange={(val) => {
                    field.onChange(val);
                    debouncedPatch({ textValue: val });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar opción" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.length === 0 ? (
                      <SelectItem value="__no_options__" disabled>
                        No hay opciones configuradas
                      </SelectItem>
                    ) : (
                      options.map((opt, i) => (
                        <SelectItem key={`${parameter.id}-${opt}-${i}`} value={opt}>
                          {opt}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {parameter.valueType === LabValueType.BOOLEAN && (
          <FormField
            control={form.control}
            name="booleanValue"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-md border p-2">
                <Label className="text-sm">Presente / Positivo</Label>
                <FormControl>
                  <Switch
                    checked={!!field.value}
                    onCheckedChange={(checked) => {
                      const v = !!checked;
                      field.onChange(v);
                      debouncedPatch({ booleanValue: v });
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder="Comentario (opcional)…"
                  value={field.value ?? ""}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    debouncedPatch({ comment: e.target.value });
                  }}
                  className="min-h-[70px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </Form>
  );
});
ResultInput.displayName = "ResultInput";

type Props = { detail: LaboratoryRequestDetailResponse };

const LaboratoryRequestForm = forwardRef<LaboratoryRequestFormHandle, Props>(({ detail }, ref) => {
  const inputRefs = useRef<Record<string, ResultInputHandle | null>>({});

  const getSetRef = useCallback(
    (key: string) => (instance: ResultInputHandle | null) => {
      inputRefs.current[key] = instance;
    },
    []
  );

  const sortedItems = useMemo(() => {
    return detail.items
      .map((it) => {
        const sortedParams = [...it.parameters].sort((a, b) => a.id - b.id);
        const sortedResults = [...it.results].sort((a, b) => a.parameterId - b.parameterId);
        return { ...it, parameters: sortedParams, results: sortedResults };
      })
      .sort((a, b) => {
        const byName = a.testName.localeCompare(b.testName);
        if (byName !== 0) return byName;
        return a.testCode.localeCompare(b.testCode);
      });
  }, [detail.items]);

  useImperativeHandle(ref, (): LaboratoryRequestFormHandle => ({
    triggerSaveAll: async () => {
      const perItem: Record<number, ResultValueItem[]> = {};

      for (const key of Object.keys(inputRefs.current)) {
        const handle = inputRefs.current[key];
        if (!handle) continue;
        const { itemId } = handle.getContext();
        const r = handle.getCurrentClean();

        const hasCore =
          r.numericValue !== null ||
          (typeof r.textValue === "string" && r.textValue.trim() !== "") ||
          r.booleanValue !== null;

        const hasExtras =
          (typeof r.comment === "string" && r.comment.trim() !== "") ||
          (typeof r.unitOverride === "string" && r.unitOverride.trim() !== "");

        if (!hasCore && !hasExtras) continue;

        if (!perItem[itemId]) perItem[itemId] = [];
        perItem[itemId].push({
          parameterId: r.parameterId,
          numericValue: r.numericValue,
          textValue: r.textValue ?? null,
          booleanValue: r.booleanValue,
          comment: r.comment ?? null,
          unitOverride: r.unitOverride ?? null,
        });
      }

      const tasks = Object.entries(perItem).map(async ([itemIdStr, results]) => {
        const itemId = Number(itemIdStr);
        const payload: AddResultValuesRequest = { results };
        await LaboratoryRequestService.addResults(itemId, payload);
      });

      await Promise.all(tasks);
    }
  }), []);

  return (
    <div className="space-y-6">
      {sortedItems.map((item) => (
        <Card key={item.id}>
          <CardHeader>
            <CardTitle>
              {item.testName} <span className="text-muted-foreground"></span>
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-3">
              {item.parameters.map((param) => {
                const refKey = `${item.id}-${param.id}`;
                return (
                  <div key={refKey} className="grid grid-cols-1 gap-2 md:grid-cols-3 md:items-center">
                    <div className="md:col-span-1">
                      <p className="font-medium">{param.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {param.valueType === LabValueType.NUMERIC && <>Numérico</>}
                        {param.valueType === LabValueType.TEXT && <>Texto</>}
                        {param.valueType === LabValueType.SELECT && <>Selección</>}
                        {param.valueType === LabValueType.BOOLEAN && <>Booleano</>}
                        {param.unit ? <> • {LabUnitLabels[param.unit]}</> : null}
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <ResultInput ref={getSetRef(refKey)} item={item} parameter={param as any} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});
LaboratoryRequestForm.displayName = "LaboratoryRequestForm";

export default LaboratoryRequestForm;
