"use client";

import { Control, useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Trash2, Plus } from "lucide-react";
import { useEffect } from "react";
import { ProductRequest } from "../_types/product-request";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { getProductUnitTypeLabel, ProductUnitType } from "../_enums/product-unit-type";
import { getAllowedVariants, getNextAvailableUnitType, isFracionableUnit } from "../_utils/product-unit-type-validator";
import { ProductPresentationType } from "../_enums/product-presentation-type";
import { presentationToUnitMap } from "../_helpers/product-mapper";
import { useToast } from "@/hooks/use-toast";
import { getSaleModeSummaryText } from "../_utils/product-util-labels";
import { ProductSaleModeRequest } from "../_types/product-sale-mode-request";

interface Props {
    control: Control<ProductRequest>;
    baseUnitType: ProductUnitType | null;
    presentationType: ProductPresentationType | null;
    isEdit: boolean;
}

export function ProductSaleModeForm({ control, baseUnitType, presentationType, isEdit }: Props) {
    const { fields, append, remove } = useFieldArray({ control, name: "saleModes" });

    const { setValue, register } = useFormContext<ProductRequest>();
    const saleModes = useWatch({ control, name: "saleModes" });
    const mainUnitType = presentationType ? presentationToUnitMap[presentationType] : null;
    const { toast } = useToast();

    function handleAddSaleMode() {
        if (!baseUnitType || !mainUnitType) {
            toast({ variant: "destructive", title: "Error", description: "Define la Presentación y la Unidad Base primero." });
            return;
        }
        const next = getNextAvailableUnitType(baseUnitType, saleModes, mainUnitType);
        if (!next) {
            toast({ variant: "destructive", title: "Error", description: "Ya se han agregado todos los modos de venta posibles." });
            return;
        }
        const isFrac = isFracionableUnit(next);
        append({
            unitType: next,
            price: 0,
            relativeQuantity: 1,
            relativeUnitType: isFrac ? next : (mainUnitType ?? baseUnitType),
        });
    }

    useEffect(() => {
        if (!saleModes) return;
        saleModes.forEach((mode, index) => {
            if (!mode?.unitType) return;
            const isFrac = isFracionableUnit(mode.unitType);
            if (isFrac) {
                if (mode.relativeUnitType !== mode.unitType) {
                    setValue(`saleModes.${index}.relativeUnitType`, mode.unitType, { shouldDirty: true });
                }
                if (mode.relativeQuantity !== 1) {
                    setValue(`saleModes.${index}.relativeQuantity`, 1, { shouldDirty: true });
                }
            } else {
                const targetUnit = mainUnitType ?? baseUnitType;
                if (targetUnit && mode.relativeUnitType !== targetUnit) {
                    setValue(`saleModes.${index}.relativeUnitType`, targetUnit, { shouldDirty: true });
                }
            }
        });
    }, [saleModes, setValue, mainUnitType, baseUnitType]);

    const formatPEN = (n?: number | string) => {
        const num = typeof n === "string" ? Number(n) : n;
        if (num == null || isNaN(num)) return "";
        return `S/. ${Number(num).toFixed(2)}`;
    };

    return (
        <div className="space-y-4">
            {fields.map((field, index) => {
                const current = saleModes?.[index];
                const modeUnit: ProductUnitType | undefined = current?.unitType;
                const isFrac = modeUnit ? isFracionableUnit(modeUnit) : false;

                const relQty: number = Number(current?.relativeQuantity ?? 0);
                const relUnit: ProductUnitType | undefined = current?.relativeUnitType;
                const priceVal = current?.price;

                const priceText = priceVal != null && priceVal !== undefined ? formatPEN(priceVal) : "…";
                const summaryText = getSaleModeSummaryText(modeUnit, relQty, presentationType);
                const rowSummary = `${summaryText} a ${priceText}`;

                return (
                    <div key={field.id} className="rounded-lg border p-3 space-y-2">
                        <div className="flex flex-row items-end gap-3">
                            <div className="flex flex gap-2 w-full">
                                <FormField
                                    control={control}
                                    name={`saleModes.${index}.unitType`}
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormControl>
                                                <FloatingLabelSelect
                                                    id={`saleModes.${index}.unitType`}
                                                    label="Modo de venta"
                                                    value={field.value ?? ""}
                                                    onValueChange={field.onChange}
                                                    className="w-full"
                                                    disabled={isEdit && (saleModes?.[index] as ProductSaleModeRequest)?.id !== undefined}
                                                    options={getAllowedVariants(baseUnitType).map((mode) => ({
                                                        value: mode,
                                                        label: getProductUnitTypeLabel(mode),
                                                    }))}
                                                />
                                            </FormControl>
                                            <FormMessage className="ml-2" />
                                        </FormItem>
                                    )}
                                />

                                {!isFrac && (
                                    <FormField
                                        control={control}
                                        name={`saleModes.${index}.relativeQuantity`}
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormControl>
                                                    <FloatingLabelInput
                                                        {...field}
                                                        id={`saleModes.${index}.relativeQuantity`}
                                                        type="number"
                                                        step="any"
                                                        label="Cantidad"
                                                        className="w-full"
                                                        onChange={(value) => field.onChange(parseFloat(value) || "")}
                                                    />
                                                </FormControl>
                                                <FormMessage className="ml-2" />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                <FormField
                                    control={control}
                                    name={`saleModes.${index}.price`}
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormControl>
                                                <FloatingLabelInput
                                                    {...field}
                                                    id={`saleModes.${index}.price`}
                                                    type="number"
                                                    label="Precio"
                                                    className="w-full"
                                                    onChange={(value) => field.onChange(parseFloat(value) || "")}
                                                />
                                            </FormControl>
                                            <FormMessage className="ml-2" />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="flex items-center">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="hover:bg-red-100 cursor-pointer"
                                    size="icon"
                                    onClick={() => remove(index)}
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        </div>

                        <input type="hidden" value={relUnit ?? ""} {...register(`saleModes.${index}.relativeUnitType` as const)} />

                        <div className="text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-1">
                            {rowSummary}
                        </div>
                    </div>
                );
            })}

            <div className="border-t pt-3 flex justify-end">
                <Button
                    type="button"
                    onClick={handleAddSaleMode}
                    variant="link"
                    className="flex items-center gap-1 rounded-lg cursor-pointer"
                >
                    <Plus className="h-4 w-4" />
                    <span>Agregar</span>
                </Button>
            </div>
        </div>
    );
}
