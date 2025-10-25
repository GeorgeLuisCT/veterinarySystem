"use client";

import { Control, useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useRef } from "react";
import { ProductRequest } from "../_types/product-request";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { getProductUnitTypeAbbreviation, getProductUnitTypeLabel, ProductUnitType } from "../_enums/product-unit-type";
import { getAvailableVariantsForIndex, getNextAvailableUnitType } from "../_utils/product-unit-type-validator";

interface Props {
    control: Control<ProductRequest>;
    unitType: ProductUnitType | null;
    contentTotal: number;
    isEdit: boolean;
}

export function ProductSaleModeForm({ control, unitType, contentTotal, isEdit }: Props) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: "saleModes",
    });

    const { setValue } = useFormContext();
    const saleModes = useWatch({ control, name: "saleModes" });

    const previousModesRef = useRef<string[]>([]);

    useEffect(() => {
        saleModes?.forEach((mode, i) => {
            const current = mode?.unitType;
            const previous = previousModesRef.current[i];

            if (current === "UNIT" && current !== previous) {
                setValue(`saleModes.${i}.quantityEquivalent`, 1);
            }
        });

        previousModesRef.current = saleModes?.map((m) => m?.unitType) || [];
    }, [saleModes, setValue]);

    function handleAddSaleMode({
        unitType,
        saleModes,
        append,
    }: {
        unitType: ProductUnitType | null;
        saleModes: { unitType: ProductUnitType }[];
        contentTotal: number;
        append: (value: {
            unitType: ProductUnitType;
            quantityEquivalent: number;
            price: number;
        }) => void;
    }) {
        const next = getNextAvailableUnitType(unitType, saleModes);
        if (!next) {
            toast.warning("Ya se han agregado todos los modos de venta posibles.");
            return;
        }

        append({
            unitType: next,
            quantityEquivalent: next === ProductUnitType.UNIT ? 1 : 0,
            price: 0,
        });
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Button
                    type="button"
                    onClick={() =>
                        handleAddSaleMode({ unitType, saleModes, contentTotal, append })
                    }
                    className="flex items-center gap-1 rounded-xl cursor-pointer"
                >
                    <Plus className="h-4 w-4" />
                    <span>Agregar</span>
                </Button>
            </div>

            {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-9 gap-2 items-end">
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
                                        disabled={isEdit && saleModes?.[index]?.id !== undefined}
                                        options={getAvailableVariantsForIndex(unitType, saleModes, index).map((mode) => ({
                                            value: mode,
                                            label: getProductUnitTypeLabel(mode),
                                        }))}
                                    />
                                </FormControl>
                                <FormMessage className="ml-2" />
                            </FormItem>
                        )}
                    />

                    <div className="col-span-3 flex items-center gap-[4px] h-full">
                        <FormField
                            control={control}
                            name={`saleModes.${index}.quantityEquivalent`}
                            render={({ field }) => (
                                <FormItem className="gap-0">
                                    <FormControl>
                                        <FloatingLabelInput
                                            {...field}
                                            id={`saleModes.${index}.quantityEquivalent`}
                                            type="number"
                                            step="any"
                                            label="Contenido"
                                            disabled={saleModes?.[index]?.unitType === "UNIT"}
                                            onChange={(value) => field.onChange(parseFloat(value) || '')}
                                        />
                                    </FormControl>
                                    <FormMessage className="ml-2" />
                                </FormItem>
                            )}
                        />
                        <div className="flex items-end h-full">
                            {saleModes?.[index]?.unitType && getProductUnitTypeAbbreviation(saleModes[index].unitType)}
                        </div>
                    </div>

                    <FormField
                        control={control}
                        name={`saleModes.${index}.price`}
                        render={({ field }) => (
                            <FormItem className="col-span-2 gap-0">
                                <FormControl>
                                    <FloatingLabelInput
                                        {...field}
                                        id={`saleModes.${index}.price`}
                                        type="number"
                                        label="Precio"
                                        onChange={(value) => field.onChange(parseFloat(value) || '')}
                                    />
                                </FormControl>
                                <FormMessage className="ml-2" />
                            </FormItem>
                        )}
                    />

                    <div className="flex justify-start">
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
            ))}
        </div>
    );
}
