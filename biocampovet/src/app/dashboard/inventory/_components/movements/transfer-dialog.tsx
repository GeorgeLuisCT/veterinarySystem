"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { PlusCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelSelect } from "@/components/floating-label-select";

import {
  transferCreateSchema,
  transferProductSchema,
  type TransferCreateRequest,
} from "../../_types/inventory-movement-request";
import { ProductUnitType, ProductUnitTypeLabels } from "../../_enums/product-unit-type";
import ProductService from "../../_service/product-service";
import InventoryMovementService from "../../_service/inventory-movement-service";
import type { ProductQuickSearchResponse } from "../../_types/product-response";
import type { BranchResponse } from "@/app/dashboard/branche/types/branch-response";
import { getAaxiosErrorMessage } from "@/helpers/error";
import { SearchPopover } from "./search-popover";
import { useDebouncedSearch } from "./use-debounced-search";
import type { TransferProductDraft } from "./types";

const transferFormSchema = z.object({
  sourceBranchId: z.number({ required_error: "Selecciona la sucursal de origen" }).min(1),
  targetBranchId: z.number({ required_error: "Selecciona la sucursal de destino" }).min(1),
  description: z
    .string()
    .trim()
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

type TransferFormValues = z.infer<typeof transferFormSchema>;
type TransferProductFormValues = z.infer<typeof transferProductSchema>;

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchOptions: BranchResponse[];
  onCreated: () => void;
}

export function TransferDialog({ open, onOpenChange, branchOptions, onCreated }: TransferDialogProps) {
  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      sourceBranchId: undefined,
      targetBranchId: undefined,
      description: "",
    },
  });

  const [products, setProducts] = useState<TransferProductDraft[]>([]);

  useEffect(() => {
    if (!open) {
      form.reset({ sourceBranchId: undefined, targetBranchId: undefined, description: "" });
      setProducts([]);
    }
  }, [form, open]);

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!values.sourceBranchId || !values.targetBranchId) {
      toast.error("Selecciona las sucursales de origen y destino");
      return;
    }
    if (products.length === 0) {
      toast.error("Agrega al menos un producto");
      return;
    }

    const payload: TransferCreateRequest = {
      sourceBranchId: values.sourceBranchId,
      targetBranchId: values.targetBranchId,
      description: values.description,
      products: products.map((product) => ({
        productId: product.productId,
        batchId: product.batchId,
        quantity: product.quantity,
        unitType: product.unitType,
      })),
    };

    try {
      await InventoryMovementService.createTransfer(payload);
      toast.success("Transferencia registrada");
      onCreated();
      onOpenChange(false);
    } catch (error) {
      toast.error(getAaxiosErrorMessage(error) ?? "No se pudo registrar la transferencia");
    }
  });

  const sourceBranchId = form.watch("sourceBranchId");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Registrar transferencia</DialogTitle>
          <DialogDescription>Desplaza stock entre sucursales.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={(event) => event.preventDefault()}>
            <FormField
              control={form.control}
              name="sourceBranchId"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelSelect
                      id="sourceBranchId"
                      label="Sucursal de origen"
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(value) => field.onChange(Number(value))}
                      options={branchOptions.map((branch) => ({
                        value: String(branch.id),
                        label: branch.name,
                      }))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetBranchId"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelSelect
                      id="targetBranchId"
                      label="Sucursal de destino"
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(value) => field.onChange(Number(value))}
                      options={branchOptions.map((branch) => ({
                        value: String(branch.id),
                        label: branch.name,
                      }))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormControl>
                    <FloatingLabelInput {...field} id="description" label="Notas (opcional)" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <ProductsTable
          products={products}
          onAdd={(item) => setProducts((prev) => [...prev, item])}
          onRemove={(index) => setProducts((prev) => prev.filter((_, idx) => idx !== index))}
          sourceBranchId={sourceBranchId}
        />

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="mr-2">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Guardando..." : "Guardar Transferencia"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ProductsTableProps {
  products: TransferProductDraft[];
  onAdd: (product: TransferProductDraft) => void;
  onRemove: (index: number) => void;
  sourceBranchId?: number;
}

function ProductsTable({ products, onAdd, onRemove, sourceBranchId }: ProductsTableProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductQuickSearchResponse | null>(null);

  const productForm = useForm<TransferProductFormValues>({
    resolver: zodResolver(transferProductSchema),
    defaultValues: {
      productId: undefined,
      batchId: undefined,
      quantity: 1,
      unitType: ProductUnitType.UNIT,
    },
  });

  const {
    options: productOptions,
    setOptions: setProductOptions,
    loading: productLoading,
    search: searchProduct,
    cancel: cancelProductSearch,
  } = useDebouncedSearch<ProductQuickSearchResponse>((query) =>
    ProductService.searchProducts(query, sourceBranchId)
  );

  const unitOptions = useMemo(
    () =>
      Object.values(ProductUnitType).map((unit) => ({
        value: unit,
        label: ProductUnitTypeLabels[unit] ?? unit,
      })),
    []
  );

  useEffect(() => {
    if (!isOpen) {
      productForm.reset({
        productId: undefined,
        batchId: undefined,
        quantity: 1,
        unitType: ProductUnitType.UNIT,
      });
      setSelectedProduct(null);
      cancelProductSearch();
      setProductOptions([]);
    }
  }, [isOpen, productForm, cancelProductSearch, setProductOptions]);

  const handleAddProduct = (data: TransferProductFormValues) => {
    if (!selectedProduct) {
      productForm.setError("productId", { message: "Selecciona un producto" });
      toast.error("Selecciona un producto");
      return;
    }

    onAdd({
      ...data,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      sku: selectedProduct.sku,
    });

    productForm.reset({
      productId: undefined,
      batchId: undefined,
      quantity: 1,
      unitType: ProductUnitType.UNIT,
    });
    setSelectedProduct(null);
    cancelProductSearch();
    setProductOptions([]);
    setIsOpen(false);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground">Productos ({products.length})</h3>
          <CollapsibleTrigger asChild>
            <Button size="sm" variant="outline" disabled={!sourceBranchId}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir producto
            </Button>
          </CollapsibleTrigger>
        </div>
        {!sourceBranchId && (
          <p className="text-xs text-muted-foreground">Selecciona la sucursal de origen para elegir productos.</p>
        )}
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Lote ID</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead className="w-14" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                    Aún no has añadido productos.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product, index) => (
                  <TableRow key={`${product.productId}-${index}`}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{product.productName}</span>
                        {product.sku && (
                          <span className="text-xs text-muted-foreground">SKU: {product.sku}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{product.batchId}</TableCell>
                    <TableCell>{product.quantity}</TableCell>
                    <TableCell>{ProductUnitTypeLabels[product.unitType]}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => onRemove(index)} title="Eliminar">
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <CollapsibleContent className="mt-2 space-y-4 rounded-md border p-4">
        <h4 className="text-sm font-semibold">Detalles del nuevo producto</h4>
        <Form {...productForm}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            {/* INICIO DE LA CORRECCIÓN */}
            <div className="space-y-2">
              <SearchPopover
                selected={selectedProduct}
                onSelect={(option) => {
                  setSelectedProduct(option);
                  productForm.setValue("productId", option.id, { shouldValidate: true });
                  productForm.clearErrors("productId");
                }}
                placeholder="Buscar producto"
                search={searchProduct}
                cancel={cancelProductSearch}
                options={productOptions}
                loading={productLoading}
                getOptionLabel={(option) => option.name}
                getOptionDescription={(option) => (option.sku ? `SKU: ${option.sku}` : undefined)}
                onClosed={() => setProductOptions([])}
              />
              <FormField
                control={productForm.control}
                name="productId"
                render={() => (
                  <FormItem>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* FIN DE LA CORRECCIÓN */}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={productForm.control}
                name="batchId"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelInput
                        {...field}
                        id="batchId"
                        label="ID de lote"
                        type="number"
                        placeholder="Ej. 1024"
                        onChange={(value) =>
                          field.onChange(value === "" ? undefined : parseInt(value, 10))
                        }
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Usa el identificador interno del lote.</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={productForm.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelInput
                        {...field}
                        id="quantity"
                        label="Cantidad"
                        type="number"
                        step="0.01"
                        onChange={(value) =>
                          field.onChange(value === "" ? undefined : parseFloat(value))
                        }
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={productForm.control}
                name="unitType"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelSelect
                        id="unitType"
                        label="Unidad"
                        value={field.value ?? ProductUnitType.UNIT}
                        onValueChange={(value) => field.onChange(value as ProductUnitType)}
                        options={unitOptions}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={productForm.handleSubmit(handleAddProduct)}>
                Agregar a la lista
              </Button>
            </div>
          </form>
        </Form>
      </CollapsibleContent>
    </Collapsible>
  );
}