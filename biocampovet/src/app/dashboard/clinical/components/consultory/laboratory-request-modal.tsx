"use client";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addClinicalAttentionLaboratorySchema, AddClinicalAttentionLaboratoryRequest } from "../../types/clinical-attention-request";
import { LabRequestStatus } from "@/app/dashboard/clinical/enums/lab-request-status";
import { ClinicalAttentionService } from "../../service/clinical-attention-service";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState, useCallback } from "react";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { ClinicalAttentionDetailResponse } from "../../types/clinical-attention-response";
import { LaboratoryTestQuickSearchResponse } from "../../types/laboratory-test-response";
import LaboratoryTestService from "../../service/laboratory-test-service";
import { debounce } from "lodash";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { LaboratoryResponse } from "../../../branche/types/laboratory-response";
import LaboratoryService from "../../../branche/services/laboratory-service";
import { useUser } from "@/context/user-context";

type CommonProps = { id: number; onClose: () => void; onAdded: (data: ClinicalAttentionDetailResponse) => void };

export function LaboratoryRequestModal({ id, onClose, onAdded }: CommonProps) {
    const { userInfo } = useUser();
    const [laboratories, setLaboratories] = useState<LaboratoryResponse[]>([]);
    const form = useForm<AddClinicalAttentionLaboratoryRequest>({
        resolver: zodResolver(addClinicalAttentionLaboratorySchema),
        defaultValues: {
            requestingEmployeeId: userInfo?.employeeId || null,
            status: LabRequestStatus.REQUESTED,
            createdAt: new Date().toISOString(),
            clinicalNotes: "",
            items: [],
        },
        mode: "onChange",
    });

    const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });
    const [submitting, setSubmitting] = useState(false);

    // State for adding items
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<LaboratoryTestQuickSearchResponse[]>([]);
    const [selectedTest, setSelectedTest] = useState<LaboratoryTestQuickSearchResponse | null>(null);
    const [itemQty, setItemQty] = useState<string>("1");
    const [itemNotes, setItemNotes] = useState("");
    const [popoverOpen, setPopoverOpen] = useState(false);

    const laboratoryId = form.watch("laboratoryId");

    useEffect(() => {
        if (userInfo?.employeeId) {
            form.setValue("requestingEmployeeId", userInfo.employeeId);
        }
    }, [userInfo, form]);

    useEffect(() => {
        LaboratoryService.listAll().then(setLaboratories);
    }, []);

    const debouncedSearch = useCallback(
        debounce(async (query: string, labId?: number) => {
            if (query.length < 2 || !labId) {
                setSearchResults([]);
                return;
            }
            const results = await LaboratoryTestService.quickSearch(query, labId);
            setSearchResults(results);
        }, 300),
        []
    );

    useEffect(() => {
        debouncedSearch(searchQuery, laboratoryId);
    }, [searchQuery, laboratoryId, debouncedSearch]);

    const addItem = () => {
        if (!selectedTest) return;
        const qty = itemQty.trim() === "" ? 1 : Number(itemQty);
        append({
            testId: selectedTest.id,
            unitPrice: selectedTest.price,
            quantity: qty,
            notes: itemNotes || null,
        });
        setSelectedTest(null);
        setSearchQuery("");
        setItemQty("1");
        setItemNotes("");
        setSearchResults([]);
    };

    const onSubmit = async (values: AddClinicalAttentionLaboratoryRequest) => {
        setSubmitting(true);
        try {
            const res = await ClinicalAttentionService.addLaboratoryRequest(id, values);
            onAdded(res);
            onClose();
        } finally {
            setSubmitting(false);
        }
    };

    const laboratoryOptions = laboratories.map(l => ({ value: String(l.id), label: l.name }));

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Registrar solicitud de laboratorio</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                        <FormField
                            control={form.control}
                            name="laboratoryId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <FloatingLabelSelect
                                            id="laboratoryId"
                                            label="Laboratorio"
                                            options={laboratoryOptions}
                                            value={field.value ? String(field.value) : ""}
                                            onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="clinicalNotes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Textarea id="clinicalNotes" rows={2} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.value)} placeholder="Notas clínicas" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="rounded-md border p-3">
                            <div className="mb-2 text-sm font-medium">Añadir Pruebas</div>
                            <div className="grid gap-2 sm:grid-cols-12">
                                <div className="sm:col-span-5">
                                    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button variant="outline" role="combobox" className="w-full justify-between" disabled={!laboratoryId}>
                                                    {selectedTest ? selectedTest.name : "Buscar prueba..."}
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="p-0 w-[--radix-popover-trigger-width]">
                                            <Command>
                                                <CommandInput placeholder="Buscar por nombre o código..." onValueChange={setSearchQuery} />
                                                <CommandList>
                                                    <CommandEmpty>No se encontraron pruebas.</CommandEmpty>
                                                    <CommandGroup>
                                                        {searchResults.map((test) => (
                                                            <CommandItem
                                                                key={test.id}
                                                                value={test.name}
                                                                onSelect={() => {
                                                                    setSelectedTest(test);
                                                                    setSearchQuery(test.name);
                                                                    setPopoverOpen(false);
                                                                }}
                                                            >
                                                                {test.name} ({test.code})
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="sm:col-span-2">
                                    <FloatingLabelInput id="unitPrice" label="Precio" type="number" value={selectedTest?.price.toFixed(2) ?? ""} disabled />
                                </div>
                                <div className="sm:col-span-2">
                                    <FloatingLabelInput id="quantity" label="Cantidad" type="number" value={itemQty} onChange={setItemQty} />
                                </div>
                                <div className="sm:col-span-3">
                                    <FloatingLabelInput id="notes" label="Notas" value={itemNotes} onChange={setItemNotes} />
                                </div>
                            </div>
                            <div className="mt-2">
                                <Button type="button" variant="outline" onClick={addItem} disabled={!selectedTest}>
                                    Agregar prueba
                                </Button>
                            </div>
                            <div className="mt-3 space-y-2">
                                {fields.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Sin pruebas añadidas.</p>
                                ) : (
                                    fields.map((item, index) => (
                                        <div key={item.id} className="rounded-md border p-2 text-sm">
                                            <div className="flex items-center justify-between">
                                                <span>Test ID: {item.testId}</span>
                                                <span>{(Number(item.quantity) * Number(item.unitPrice)).toFixed(2)}</span>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>Eliminar</Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? "Guardando..." : "Guardar"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}