"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { type PurchaseCreateRequest } from "../../_types/inventory-movement-request";
import { ProductUnitType, ProductUnitTypeLabels } from "../../_enums/product-unit-type";
import { useDebouncedSearch } from "./use-debounced-search";
import ProductService from "../../_service/product-service";
import SupplierService from "../../_service/supplier-service";
import type { ProductQuickSearchResponse } from "../../_types/product-response";
import type { SupplierQuickSearchResponse } from "../../_types/supplier-response";
import type { BranchResponse } from "@/app/dashboard/branche/types/branch-response";
import InventoryMovementService from "../../_service/inventory-movement-service";
import { getAaxiosErrorMessage } from "@/helpers/error";
import type { PurchaseProductDraft } from "./types";
import { AddProductPurchaseForm } from "./add-product-pucharse-form";
import { PurchaseForm, purchaseFormSchema, PurchaseFormValues } from "./purchase-form";
import { ProductListTable } from "./product-pucharse-list-table";
import { useToast } from "@/hooks/use-toast";

function pad2(n: number) { return String(n).padStart(2, "0"); }
function getNowLocalNaive(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mi = pad2(d.getMinutes());
  const ss = pad2(d.getSeconds());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`;
}
function normalizeLocalDateTimeStrict(v?: string): string {
  if (!v) return "";
  let s = v.trim();
  s = s.replace(/[Zz]$/, "").replace(/([+-]\d{2}:\d{2})$/, "");
  s = s.replace(/\.\d{1,3}$/, "");
  const m = s.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})(?:$|[^:])/);
  if (m) return `${m[1]}:00`;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(s)) return s.slice(0, 19);
  return s;
}
function normalizeDateOnly(v?: string): string | undefined {
  if (!v) return undefined;
  const m = v.trim().match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : v;
}

interface PurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchOptions: BranchResponse[];
  defaultBranchId?: number;
  onCreated: () => void;
}

export function PurchaseDialog({
  open,
  onOpenChange,
  branchOptions,
  defaultBranchId,
  onCreated,
}: PurchaseDialogProps) {
  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      branchId: defaultBranchId,
      supplierId: undefined,
      date: getNowLocalNaive(),
      description: "",
    },
  });

  const {
    options: supplierOptions,
    setOptions: setSupplierOptions,
    loading: supplierLoading,
    search: searchSupplier,
    cancel: cancelSupplierSearch,
  } = useDebouncedSearch(SupplierService.searchSuppliers);

  const {
    options: productOptions,
    setOptions: setProductOptions,
    loading: productLoading,
    search: searchProduct,
    cancel: cancelProductSearch,
  } = useDebouncedSearch<ProductQuickSearchResponse>((query) =>
    ProductService.searchProducts(query, form.getValues("branchId"))
  );

  const [selectedSupplier, setSelectedSupplier] = useState<SupplierQuickSearchResponse | null>(null);
  const [products, setProducts] = useState<PurchaseProductDraft[]>([]);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    if (!open) {
      setSelectedSupplier(null);
      setProducts([]);
      setSupplierOptions([]);
      setProductOptions([]);
      cancelSupplierSearch();
      cancelProductSearch();
      setIsAddProductOpen(false);
      form.reset({
        branchId: defaultBranchId,
        supplierId: undefined,
        date: getNowLocalNaive(),
        description: "",
      });
    }
  }, [
    cancelProductSearch,
    cancelSupplierSearch,
    defaultBranchId,
    form,
    open,
    setProductOptions,
    setSupplierOptions,
  ]);

  const unitOptions = useMemo(
    () =>
      Object.values(ProductUnitType).map((unit) => ({
        value: unit,
        label: ProductUnitTypeLabels[unit] ?? unit,
      })),
    []
  );

  const onSubmit = form.handleSubmit(async (values) => {
    if (!values.branchId) {
      toast({ variant: "destructive", title: "Error", description: "Selecciona una sucursal" });
      return;
    }
    if (!values.supplierId) {
      toast({ variant: "destructive", title: "Error", description: "Selecciona un proveedor" });
      return;
    }
    if (products.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Agrega al menos un producto" });
      return;
    }

    const payload: PurchaseCreateRequest = {
      branchId: values.branchId,
      supplierId: values.supplierId,
      date: normalizeLocalDateTimeStrict(values.date),
      description: values.description?.trim() || undefined,
      products: products.map((product) => ({
        productId: product.productId,
        batchNumber: product.batchNumber,
        expirationDate: normalizeDateOnly(product.expirationDate),
        quantity: product.quantity,
        unitType: product.unitType,
        unitCost: product.unitCost,
      })),
    };

    try {
      await InventoryMovementService.createPurchase(payload);
      toast({ variant: "default", title: "Éxito", description: "Compra registrada correctamente" });
      onCreated();
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: getAaxiosErrorMessage(error) ?? "No se pudo registrar la compra",
      });
    }
  });

  const handleAddProduct = (product: PurchaseProductDraft) => {
    setProducts((prev) => [...prev, product]);
    setIsAddProductOpen(false);
  };

  const handleDeleteProduct = (index: number) => {
    setProducts((prev) => prev.filter((_, idx) => idx !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Registrar compra</DialogTitle>
          <DialogDescription>Ingresa los detalles de la compra.</DialogDescription>
        </DialogHeader>

        <PurchaseForm
          form={form}
          branchOptions={branchOptions}
          selectedSupplier={selectedSupplier}
          setSelectedSupplier={setSelectedSupplier}
          supplierOptions={supplierOptions}
          setSupplierOptions={setSupplierOptions}
          supplierLoading={supplierLoading}
          searchSupplier={searchSupplier}
          cancelSupplierSearch={cancelSupplierSearch}
        />

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Productos ({products.length})
            </h3>
            <Collapsible open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
              <CollapsibleTrigger asChild>
                <Button size="sm" variant="outline">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Añadir producto
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 overflow-hidden rounded-md border p-4 shadow-sm">
                <AddProductPurchaseForm
                  onAdd={handleAddProduct}
                  onCancel={() => setIsAddProductOpen(false)}
                  unitOptions={unitOptions}
                  productOptions={productOptions}
                  searchProduct={searchProduct}
                  cancelProductSearch={cancelProductSearch}
                  setProductOptions={setProductOptions}
                  productLoading={productLoading}
                  isOpen={isAddProductOpen}
                />
              </CollapsibleContent>
            </Collapsible>
          </div>

          <ProductListTable products={products} onDelete={handleDeleteProduct} />
        </section>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSubmit}>Registrar compra</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
