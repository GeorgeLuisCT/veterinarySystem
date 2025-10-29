"use client";

import { Control, useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useMemo } from "react";
import { ProductRequest } from "../_types/product-request";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { getProductUnitTypeLabel, getProductUnitTypeLabelByQuantity, ProductUnitType } from "../_enums/product-unit-type";
import { getAvailableVariantsForIndex, getNextAvailableUnitType, isFracionableUnit } from "../_utils/product-unit-type-validator";
import { ProductPresentationType } from "../_enums/product-presentation-type";
import { presentationToUnitMap } from "../_helpers/product-mapper";

interface Props {
    control: Control<ProductRequest>;
    baseUnitType: ProductUnitType | null;
    presentationType: ProductPresentationType | null;
    isEdit: boolean;
}

export function ProductSaleModeForm({ control, baseUnitType, presentationType, isEdit }: Props) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: "saleModes",
    });

    const { setValue } = useFormContext<ProductRequest>();
    const saleModes = useWatch({ control, name: "saleModes" });
    const mainUnitType = presentationType ? presentationToUnitMap[presentationType] : null;

    function handleAddSaleMode() {
        if (!baseUnitType || !mainUnitType) {
            toast.error("Define la Presentación y la Unidad Base primero.");
            return;
        }
        const next = getNextAvailableUnitType(baseUnitType, saleModes, mainUnitType);
        if (!next) {
            toast.warning("Ya se han agregado todos los modos de venta posibles.");
            return;
        }
        
        const isFraccionable = isFracionableUnit(next);
        
        append({
            unitType: next,
            price: 0,
            relativeQuantity: 1,
            relativeUnitType: isFraccionable ? next : (mainUnitType ?? baseUnitType),
        });
    }

    const relativeUnitOptions = useMemo(() => {
        const options: { value: ProductUnitType; label: string }[] = [];
        if (mainUnitType) {
            options.push({ value: mainUnitType, label: getProductUnitTypeLabel(mainUnitType) });
        }
        if (baseUnitType && baseUnitType !== mainUnitType) {
            options.push({ value: baseUnitType, label: getProductUnitTypeLabel(baseUnitType) });
        }
        return options;
    }, [baseUnitType, mainUnitType]);

    useEffect(() => {
        if (!saleModes) return;
        
        saleModes.forEach((mode, index) => {
            if (mode.unitType && isFracionableUnit(mode.unitType)) {
                if (mode.relativeUnitType !== mode.unitType) {
                    setValue(`saleModes.${index}.relativeUnitType`, mode.unitType, { shouldDirty: true });
                }
            }
        });
    }, [saleModes, setValue]);

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
                
                const isFraccionable = modeUnit ? isFracionableUnit(modeUnit) : false;

                const relQty: number = Number(current?.relativeQuantity ?? 0);
                const relUnit: ProductUnitType | undefined = current?.relativeUnitType;
                const priceVal = current?.price;

                const modeLabel = modeUnit ? getProductUnitTypeLabel(modeUnit).toLowerCase() : "modo";
                const relUnitLabelLower =
                    relUnit != null ? getProductUnitTypeLabelByQuantity(relUnit, relQty).toLowerCase() : "…";
                const qtyText = relQty > 0 ? relQty : "…";
                const priceText = priceVal != null && priceVal !== undefined ? formatPEN(priceVal) : "…";
                
                const isRedundant = modeUnit === relUnit;
                
                const rowSummary = isRedundant
                    ? `${qtyText} ${relUnitLabelLower} a ${priceText}`
                    : `${modeLabel} de ${qtyText} ${relUnitLabelLower} a ${priceText}`;

                return (
                    <div key={field.id} className="rounded-xl border p-3 space-y-2">
                        <div className="grid grid-cols-12 gap-2 items-end">
                            <FormField
                                control={control}
                                name={`saleModes.${index}.unitType`}
                                render={({ field }) => (
                                    <FormItem className="col-span-3 gap-0">
                                        <FormControl>
                                            <FloatingLabelSelect
                                                id={`saleModes.${index}.unitType`}
                                                label="Modo de venta"
                                                value={field.value ?? ""}
                                                onValueChange={field.onChange}
                                                disabled={isEdit && (saleModes?.[index] as any)?.id !== undefined}
                                                options={getAvailableVariantsForIndex(baseUnitType, saleModes, index, mainUnitType).map(
                                                    (mode) => ({
                                                        value: mode,
                                                        label: getProductUnitTypeLabel(mode),
                                                    })
                                                )}
                                            />
                                        </FormControl>
                                        <FormMessage className="ml-2" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={control}
                                name={`saleModes.${index}.relativeQuantity`}
                                render={({ field }) => (
                                    <FormItem className="col-span-2 gap-0">
                                        <FormControl>
                                            <FloatingLabelInput
                                                {...field}
                                                id={`saleModes.${index}.relativeQuantity`}
                                                type="number"
                                                step="any"
                                                label="Cantidad"
                                                onChange={(value) => field.onChange(parseFloat(value) || "")}
                                            />
                                        </FormControl>
                                        <FormMessage className="ml-2" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={control}
                                name={`saleModes.${index}.relativeUnitType`}
                                render={({ field }) => (
                                    <FormItem className="col-span-3 gap-0">
                                        <FormControl>
                                            <FloatingLabelSelect
                                                id={`saleModes.${index}.relativeUnitType`}
                                                label="Unidad"
                                                value={field.value ?? ""}
                                                onValueChange={field.onChange}
                                                options={isFraccionable && modeUnit
                                                    ? [{ value: modeUnit, label: getProductUnitTypeLabel(modeUnit) }]
                                                    : relativeUnitOptions
                                                }
                                                disabled={isFraccionable}
                                            />
                                        </FormControl>
                                        <FormMessage className="ml-2" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={control}
                                name={`saleModes.${index}.price`}
                                render={({ field }) => (
                                    <FormItem className="col-span-3 gap-0">
                                        <FormControl>
                                            <FloatingLabelInput
                                                {...field}
                                                id={`saleModes.${index}.price`}
                                                type="number"
                                                label="Precio"
                                                onChange={(value) => field.onChange(parseFloat(value) || "")}
                                            />
                                        </FormControl>
                                        <FormMessage className="ml-2" />
                                    </FormItem>
                                )}
                            />

                            <div className="col-span-1 flex justify-start">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="hover:bg-red-100 cursor-pointer"
                                    size="icon"
                                    onClick={() => remove(index)}
                                >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                            </div>
                        </div>

                        <div className="text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-1">
                            {rowSummary}
                        </div>
                    </div>
                );
            })}

            {/* footer con botón abajo-derecha */}
          <div className="border-t pt-3 flex justify-end">
            <Button
              type="button"
              onClick={handleAddSaleMode}
              variant="link"
              className="flex items-center gap-1 rounded-xl cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Agregar</span>
            </Button>
          </div>
        </div>
    );
}