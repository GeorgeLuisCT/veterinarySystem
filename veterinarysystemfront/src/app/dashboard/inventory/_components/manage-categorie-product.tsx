"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { CategoryProductRequest, categorySchema } from "../_types/category-product-request";
import { categoryService } from "../_service/category-product-service";
import { Ban, Check, Pencil, Trash, X, RotateCw, Loader2 } from "lucide-react";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { CategoryProductResponse } from "../_types/category-product-response";



export function ManageCategorieProduct() {
    const [categories, setCategories] = React.useState<CategoryProductResponse[]>([]);
    const [editingId, setEditingId] = React.useState<number | null>(null);
    const [loadingIds, setLoadingIds] = React.useState<Set<number>>(new Set());
    const [isLoading, setIsLoading] = React.useState<boolean>(true);

    const form = useForm<CategoryProductRequest>({
        resolver: zodResolver(categorySchema),
        defaultValues: { name: "" },
    });

    React.useEffect(() => {
        setIsLoading(true);
        categoryService.getAll()
            .then(setCategories)
            .finally(() => setIsLoading(false));
    }, []);

    const handleAction = async (id: number, action: "edit" | "softDelete" | "hardDelete" | "restore", name?: string) => {
        setLoadingIds(prev => new Set(prev).add(id));
        try {
            if (action === "edit" && name) {
                await categoryService.updateName(id, name);
                setCategories(categories.map(cat => (cat.id === id ? { ...cat, name } : cat)));
                setEditingId(null);
                toast.success("Categoría actualizada exitosamente!");
            } else if (action === "softDelete") {
                setEditingId(null);
                await categoryService.softDelete(id);
                setCategories(categories.map(cat => (cat.id === id ? { ...cat, active: false } : cat)));
                toast.success("Categoría desactivada correctamente");
            } else if (action === "hardDelete") {
                setEditingId(null);
                await categoryService.hardDelete(id);
                setCategories(categories.filter(cat => cat.id !== id));
                toast.success("Categoría eliminada permanentemente");
            } else if (action === "restore") {
                setEditingId(null);
                await categoryService.restore(id);
                setCategories(categories.map(cat => (cat.id === id ? { ...cat, active: true } : cat)));
                toast.success("Categoría activada correctamente");
            }
        } catch {
            toast.error("Error al procesar la acción");
        } finally {
            setLoadingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
            });
        }
    };

    return (
        <div className="max-h-[500px] w-full overflow-auto border p-4 rounded-md">
            {isLoading ? (
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <ScrollArea>
                    <div className="space-y-4">
                        {categories.map(category => (
                            <div key={category.id} className="flex items-center justify-between border p-2 rounded">
                                {editingId === category.id ? (
                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit((data) => handleAction(category.id, "edit", data.name))} className="flex w-full space-x-2">
                                            <FormField
                                                control={form.control}
                                                name="name"
                                                defaultValue={category.name}
                                                render={({ field }) => (
                                                    <FormItem className="flex-grow">
                                                        <FormControl>
                                                            <Input {...field} autoFocus className="w-full" disabled={!category.active} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <Button variant="ghost" size="icon" type="submit" disabled={loadingIds.has(category.id)}>
                                                <Check className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setEditingId(null)} disabled={loadingIds.has(category.id)}>
                                                <X className="w-4 h-4" />
                                            </Button>

                                        </form>
                                    </Form>
                                ) : (
                                    <span className={`${!category.active ? "text-muted-foreground line-through" : ""} pl-4`}>{category.name}</span>
                                )}
                                <div className="flex space-x-2">
                                    {loadingIds.has(category.id) ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (

                                        <>
                                            {editingId !== category.id && category.active && (
                                                <Button variant="ghost" size="icon" onClick={() => { setEditingId(category.id); form.setValue("name", category.name); }}>
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                            )}
                                            {category.active ? (
                                                <Button variant="ghost" size="icon" onClick={() => handleAction(category.id, "softDelete")}>
                                                    <Ban className="w-4 h-4" />
                                                </Button>
                                            ) : (
                                                <Button variant="ghost" size="icon" onClick={() => handleAction(category.id, "restore")}>
                                                    <RotateCw className="w-4 h-4" />
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" onClick={() => handleAction(category.id, "hardDelete")}>
                                                <Trash className="w-4 h-4" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            )}
        </div>
    );
}
