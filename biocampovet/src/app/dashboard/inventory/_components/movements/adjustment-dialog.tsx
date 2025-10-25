"use client";

import { useEffect, useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import {
  adjustmentCreateSchema,
  adjustmentProductSchema,
  type AdjustmentCreateRequest,
} from "../../_types/inventory-movement-request";
import { ProductUnitType, ProductUnitTypeLabels } from "../../_enums/product-unit-type";
import { AdjustmentType, AdjustmentTypeLabels } from "../../_enums/adjustment-type";
import ProductService from "../../_service/product-service";
import InventoryMovementService from "../../_service/inventory-movement-service";
import type { ProductQuickSearchResponse } from "../../_types/product-response";
import type { BranchResponse } from "@/app/dashboard/branche/types/branch-response";
import { getAaxiosErrorMessage } from "@/helpers/error";
import { SearchPopover } from "./search-popover";
import { useDebouncedSearch } from "./use-debounced-search";
import type { AdjustmentProductDraft } from "./types";

const adjustmentFormSchema = z.object({
  branchId: z.number({ required_error: "Selecciona una sucursal" }).min(1),
  description: z
    .string()
    .trim()
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

type AdjustmentFormValues = z.infer<typeof adjustmentFormSchema>;

interface AdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchOptions: BranchResponse[];
  defaultBranchId?: number;
  onCreated: () => void;
}

export function AdjustmentDialog({
  open,
  onOpenChange,
  branchOptions,
  defaultBranchId,
  onCreated,
}: AdjustmentDialogProps) {
  const form = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentFormSchema),
    defaultValues: {
      branchId: defaultBranchId,
      description: "",
    },
  });

  const [products, setProducts] = useState<AdjustmentProductDraft[]>([]);
  const [productDialogOpen, setProductDialogOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      form.reset({ branchId: defaultBranchId, description: "" });
      setProducts([]);
    }
  }, [defaultBranchId, form, open]);

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!values.branchId) {
      toast.error("Selecciona la sucursal");
      return;
    }
    if (products.length === 0) {
      toast.error("Agrega al menos un producto");
      return;
    }

    const payload: AdjustmentCreateRequest = {
      branchId: values.branchId,
      description: values.description,
      products: products.map((product) => ({
        productId: product.productId,
        batchId: product.batchId,
        quantity: product.quantity,
        unitType: product.unitType,
        adjustmentType: product.adjustmentType,
        reason: product.reason,
      })),
    };

    try {
      await InventoryMovementService.createAdjustment(payload);
      toast.success("Ajuste registrado");
      onCreated();
      onOpenChange(false);
    } catch (error) {
      toast.error(getAaxiosErrorMessage(error) ?? "No se pudo registrar el ajuste");
    }
  });

  const branchId = form.watch("branchId");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Registrar ajuste</DialogTitle>
          <DialogDescription>Ajusta el stock de la sucursal seleccionada.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={(event) => event.preventDefault()}>
            <FormField
              control={form.control}
              name="branchId"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <Label>Sucursal</Label>
                  <Select
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una sucursal" />
                    </SelectTrigger>
                    <SelectContent>
                      {branchOptions.map((branch) => (
                        <SelectItem key={branch.id} value={String(branch.id)}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <Label>Notas (opcional)</Label>
                  <FormControl>
                    <Textarea {...field} rows={3} placeholder="Motivo general del ajuste" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground">Productos ({products.length})</h3>
            <Button size="sm" onClick={() => setProductDialogOpen(true)} disabled={!branchId}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir producto
            </Button>
          </div>
          {!branchId && (
            <p className="text-xs text-muted-foreground">Selecciona primero la sucursal.</p>
          )}

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Lote ID</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Tipo de ajuste</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead className="w-14" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
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
                      <TableCell>{AdjustmentTypeLabels[product.adjustmentType]}</TableCell>
                      <TableCell>{product.reason || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => setProducts((prev) => prev.filter((_, idx) => idx !== index))}>
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

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Registrar ajuste</Button>
        </div>
      </DialogContent>

      <AdjustmentProductDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        onAdd={(product) => setProducts((prev) => [...prev, product])}
        branchId={branchId}
      />
    </Dialog>
  );
}

interface AdjustmentProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (product: AdjustmentProductDraft) => void;
  branchId?: number;
}

function AdjustmentProductDialog({ open, onOpenChange, onAdd, branchId }: AdjustmentProductDialogProps) {
  const [selectedProduct, setSelectedProduct] = useState<ProductQuickSearchResponse | null>(null);
  const [batchId, setBatchId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitType, setUnitType] = useState<ProductUnitType>(ProductUnitType.UNIT);
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>(AdjustmentType.ENTRY);
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const {
    options: productOptions,
    setOptions: setProductOptions,
    loading: productLoading,
    search: searchProduct,
    cancel: cancelProductSearch,
  } = useDebouncedSearch<ProductQuickSearchResponse>((query) =>
    ProductService.searchProducts(query, branchId)
  );

  useEffect(() => {
    if (!open) {
      setSelectedProduct(null);
      setBatchId("");
      setQuantity("1");
      setUnitType(ProductUnitType.UNIT);
      setAdjustmentType(AdjustmentType.ENTRY);
      setReason("");
      setErrors({});
      cancelProductSearch();
      setProductOptions([]);
    }
  }, [cancelProductSearch, open, setProductOptions]);

  const handleSubmit = () => {
    if (!selectedProduct) {
      setErrors({ productId: "Selecciona un producto" });
      toast.error("Selecciona un producto");
      return;
    }

    const parsed = adjustmentProductSchema.safeParse({
      productId: selectedProduct.id,
      batchId: Number(batchId),
      quantity: Number(quantity),
      unitType,
      adjustmentType,
      reason: reason || undefined,
    });

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const key = String(issue.path[0] ?? "form");
        nextErrors[key] = issue.message;
      });
      setErrors(nextErrors);
      toast.error("Corrige los campos del producto");
      return;
    }

    onAdd({
      ...parsed.data,
      productName: selectedProduct.name,
      sku: selectedProduct.sku,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Agregar producto</DialogTitle>
          <DialogDescription>Registra el detalle del producto involucrado en el ajuste.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Producto</Label>
            <SearchPopover
              selected={selectedProduct}
              onSelect={(option) => {
                setSelectedProduct(option);
                setErrors((prev) => ({ ...prev, productId: "" }));
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
            {errors.productId && <p className="text-sm text-destructive">{errors.productId}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>ID de lote</Label>
              <Input
                type="number"
                min="1"
                value={batchId}
                onChange={(event) => setBatchId(event.target.value)}
                placeholder="Ej. 2041"
              />
              <p className="text-xs text-muted-foreground">Usa el identificador interno del lote a ajustar.</p>
              {errors.batchId && <p className="text-sm text-destructive">{errors.batchId}</p>}
            </div>

            <div className="space-y-2">
              <Label>Cantidad</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
              {errors.quantity && <p className="text-sm text-destructive">{errors.quantity}</p>}
            </div>

            <div className="space-y-2">
              <Label>Unidad</Label>
              <Select value={unitType} onValueChange={(value) => setUnitType(value as ProductUnitType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Unidad" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ProductUnitType).map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {ProductUnitTypeLabels[unit]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.unitType && <p className="text-sm text-destructive">{errors.unitType}</p>}
            </div>

            <div className="space-y-2">
              <Label>Tipo de ajuste</Label>
              <Select value={adjustmentType} onValueChange={(value) => setAdjustmentType(value as AdjustmentType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(AdjustmentType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {AdjustmentTypeLabels[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.adjustmentType && <p className="text-sm text-destructive">{errors.adjustmentType}</p>}
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label>Motivo (opcional)</Label>
              <Textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Describe la razón del ajuste"
              />
              {errors.reason && <p className="text-sm text-destructive">{errors.reason}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>Agregar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
