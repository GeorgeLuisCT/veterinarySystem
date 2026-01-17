"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { CategoryProductRequest, categorySchema } from "../_types/category-product-request";
import { categoryService } from "../_service/category-product-service";

interface CategoryFormProps {
    setOpen: (open: boolean) => void;
}

export function CategoryForm({ setOpen }: CategoryFormProps) {
    const form = useForm<CategoryProductRequest>({
        resolver: zodResolver(categorySchema),
        defaultValues: { name: "" },
    });

    const onSubmit = async (data: CategoryProductRequest) => {
        try {
            await categoryService.save(data);
            toast.success("Categoría creada exitosamente!");
            form.reset();
            setOpen(false);
        } catch (error) {
            console.error(error);
            form.setError("name", { message: "Error al crear la categoría, intenta nuevamente." });
            toast.error("Error al crear la categoría");
        }
    };

    return (

        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <Input {...field} placeholder="Ingresa el nombre de la categoría" disabled={form.formState.isSubmitting} />
                            </FormControl>
                            <FormMessage className="left-4" />
                        </FormItem>
                    )}
                />

                <div className="flex justify-center">
                    <Button type="submit" disabled={form.formState.isSubmitting} className="w-48">
                        {form.formState.isSubmitting && <Loader2 className="animate-spin mr-2" size={16} />}
                        Guardar
                    </Button>
                </div>
            </form>
        </Form>
    );
}
