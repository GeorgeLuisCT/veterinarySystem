"use client";

import { useCallback, useMemo, useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/context/user-context";
import { PosCartItem, usePosCart } from "../../../_hooks/usePosCart";
import { PaymentEntry, usePaymentCollector } from "../../../_hooks/usePaymentCollector";
import SalesService from "../../../_service/sales.service";
import { SaleItemKind, SaleStatus, SalesDocumentType } from "../../../_types/sale-enums";
import SaleDetailsSection from "../../../_components/sale-details-section";
import AddProductsSection from "../../../_components/add-products-section";
import SaleItemsSection from "../../../_components/sale-items-section";
import OrderSummarySection from "../../../_components/order-summary-section";
import {
  createSaleRequestSchema,
  CreateSaleRequest,
  saleFormSchema,
  SaleFormValues,
  SaleItemRequest,
  SalePaymentRequest,
  UpdateSaleRequest,
  FinalizeSaleRequest,
  finalizeSaleRequestSchema,
} from "../../../_types/sale-request";
import { Form } from "@/components/ui/form";
import PendingSalesSheet from "../../../_components/pending-sales-sheet";
import { SaleDetailResponse, SalePaymentResponse, SaleResponse } from "../../../_types/sale-response";
import { ProductQuickSearchResponse, SaleModeSummary } from "@/app/dashboard/inventory/_types/product-response";
import DashboardLayoutSection from "@/app/dashboard/dashboard-layout-section";
import { getAaxiosErrorMessage } from "@/helpers/error";
import { Box, BoxIcon, ClipboardList, PlusCircle, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SubmitMode = "draft" | "final";

const DOCUMENT_OPTIONS: { value: SalesDocumentType; label: string }[] = [
  { value: SalesDocumentType.BOLETA, label: "Boleta" },
  { value: SalesDocumentType.FACTURA, label: "Factura" },
  { value: SalesDocumentType.NOTA_VENTA, label: "Nota de venta" },
];

const DEFAULT_FORM_VALUES: SaleFormValues = {
  documentType: SalesDocumentType.BOLETA,
  documentNumber: "",
  customerId: undefined,
  notes: "",
};

function PointOfSaleContent() {
  const { userInfo } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const branchId = userInfo?.selectedBranch?.id ?? 0;
  const sellerId = userInfo?.userId ?? 0;

  const [sale, setSale] = useState<SaleResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isUpdatingHeader, setIsUpdatingHeader] = useState(false);
  const [itemsError, setItemsError] = useState<string | undefined>(undefined);
  const [paymentsError, setPaymentsError] = useState<string | undefined>(undefined);
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);

  const isEditing = useMemo(() => sale?.status === SaleStatus.DRAFT, [sale]);
  const isFinalized = useMemo(() => !!sale && sale.status !== SaleStatus.DRAFT, [sale]);

  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: DEFAULT_FORM_VALUES,
    shouldFocusError: true,
    mode: "onSubmit",
  });

  const cart = usePosCart();
  const paymentCollector = usePaymentCollector();

  const clearSectionErrors = useCallback(() => {
    setItemsError(undefined);
    setPaymentsError(undefined);
  }, []);

  const syncFromSale = useCallback(
    (updatedSale: SaleResponse, resetForm = false) => {
      setSale(updatedSale);

      const mappedItems: PosCartItem[] = updatedSale.details.map((d: SaleDetailResponse) => ({
        id: `db-${d.id}`,
        detailId: d.id,
        name: d.description,
        kind: d.productId ? SaleItemKind.PRODUCT : SaleItemKind.SERVICE,
        productId: d.productId,
        saleModeId: d.saleModeId,
        serviceType: d.serviceType,
        serviceItemId: d.serviceItemId,
        unitPrice: d.unitPrice,
        quantity: d.quantity,
        unitType: d.unitType,
        taxRate: d.taxRate,
        taxAmount: d.taxAmount,
        descriptionOverride: d.description,
        metadataJson: d.metadataJson,
        lineSubtotal: d.lineSubtotal,
      }));
      cart.setCartItems(mappedItems);

      const mappedPayments: PaymentEntry[] = updatedSale.payments.map((p: SalePaymentResponse) => ({
        id: `db-p-${p.id}`,
        paymentId: p.id,
        amount: p.amount,
        method: p.method,
        paidAt: p.paidAt,
        reference: p.reference,
        notes: p.notes,
      }));
      paymentCollector.setPayments(mappedPayments);

      if (resetForm) {
        form.reset({
          documentType: updatedSale.documentType,
          documentNumber: updatedSale.documentNumber,
          customerId: updatedSale.customerId,
          notes: updatedSale.notes,
        });
      }

      clearSectionErrors();
    },
    [cart, paymentCollector, form, clearSectionErrors]
  );

  const loadSale = useCallback(
    async (id: number) => {
      setSubmitting(true);
      try {
        const data = await SalesService.getSale(id);
        if (data.status !== SaleStatus.DRAFT) {
          toast({ title: "Venta no editable", description: "Esta venta ya ha sido procesada.", variant: "destructive" });
          router.push("/dashboard/pos/sales/history");
          return;
        }
        syncFromSale(data, true);
        toast({ title: "Borrador cargado", description: `Venta #${data.id} lista para editar.` });
      } catch {
        toast({ title: "Error al cargar la venta", description: "No se pudo obtener el detalle de la venta.", variant: "destructive" });
        setSale(null);
        router.push("/dashboard/pos/sales/history");
      } finally {
        setSubmitting(false);
      }
    },
    [syncFromSale, toast, router]
  );

  const handleReset = useCallback(() => {
    setSale(null);
    cart.resetCart();
    paymentCollector.resetPayments();
    form.reset(DEFAULT_FORM_VALUES);
    clearSectionErrors();
    router.push("/dashboard/pos/sales/new");
  }, [cart, paymentCollector, form, clearSectionErrors, router]);

  useEffect(() => {
    const id = Number(searchParams.get("saleId") ?? 0);
    if (id > 0) {
      if (sale?.id !== id) loadSale(id);
    } else if (sale) {
      handleReset();
    }
    setIsInitialLoadDone(true);
  }, [loadSale, handleReset, searchParams, sale]);

  const handleHeaderUpdate = useCallback(
    async (values: SaleFormValues) => {
      if (!isEditing || !sale) return;
      setIsUpdatingHeader(true);
      const payload: UpdateSaleRequest = {
        ...values,
        branchId: sale.branchId,
        sellerId: sale.sellerId,
      };
      try {
        await SalesService.updateSale(sale.id, payload);
        toast({ title: "Cambios guardados", description: "Detalles de la venta actualizados." });
        form.reset(values, { keepValues: true });
      } catch {
        toast({ title: "Error al auto-guardar", variant: "destructive" });
      } finally {
        setIsUpdatingHeader(false);
      }
    },
    [isEditing, sale, toast, form]
  );

  const addProductDeclarative = useCallback(
    async (product: ProductQuickSearchResponse, saleMode: SaleModeSummary) => {
      if (!isEditing || !sale) {
        cart.addProduct(product, saleMode);
        return;
      }
      setSubmitting(true);
      try {
        const payload: SaleItemRequest = {
          kind: SaleItemKind.PRODUCT,
          productId: product.id,
          saleModeId: saleMode.id,
          unitPrice: saleMode.price ?? 0,
          quantity: 1,
          unitType: saleMode.unitType,
        };
        const updatedSale = await SalesService.addDetailToSale(sale.id, payload);
        syncFromSale(updatedSale, false);
        toast({ title: "Producto agregado" });
      } catch {
        toast({ title: "Error al agregar producto", variant: "destructive" });
      } finally {
        setSubmitting(false);
      }
    },
    [isEditing, sale, cart, syncFromSale, toast]
  );

  const patchItem = useCallback(
    async (itemId: string, patch: Partial<Pick<PosCartItem, "quantity" | "unitPrice">>) => {
      if (!isEditing || !sale) {
        if (patch.quantity !== undefined) cart.updateQuantity(itemId, patch.quantity);
        if (patch.unitPrice !== undefined) cart.updateUnitPrice(itemId, patch.unitPrice);
        return;
      }
      const item = cart.findItemByClientId(itemId);
      if (!item || !item.detailId) return;

      const original = { quantity: item.quantity, unitPrice: item.unitPrice };
      if (patch.quantity !== undefined) cart.updateQuantity(itemId, patch.quantity);
      if (patch.unitPrice !== undefined) cart.updateUnitPrice(itemId, patch.unitPrice);

      setSubmitting(true);
      try {
        const payload: SaleItemRequest = { ...item, ...patch };
        const updatedSale = await SalesService.updateSaleDetail(sale.id, item.detailId, payload);
        syncFromSale(updatedSale, false);
      } catch (error: unknown) {
        toast({ title: "Error al actualizar ítem", description: getAaxiosErrorMessage(error), variant: "destructive" });
        cart.updateQuantity(itemId, original.quantity);
        cart.updateUnitPrice(itemId, original.unitPrice);
      } finally {
        setSubmitting(false);
      }
    },
    [isEditing, sale, cart, syncFromSale, toast]
  );

  const removeItemDeclarative = useCallback(
    async (itemId: string) => {
      if (!isEditing || !sale) {
        cart.removeItem(itemId);
        return;
      }
      const item = cart.findItemByClientId(itemId);
      if (!item || !item.detailId) return;
      setSubmitting(true);
      try {
        await SalesService.deleteSaleDetail(sale.id, item.detailId);
        const updatedSale = await SalesService.getSale(sale.id);
        syncFromSale(updatedSale, false);
        toast({ title: "Ítem eliminado" });
      } catch {
        toast({ title: "Error al eliminar ítem", variant: "destructive" });
      } finally {
        setSubmitting(false);
      }
    },
    [isEditing, sale, cart, syncFromSale, toast]
  );

  const addPaymentDeclarative = useCallback(
    async (payment: Omit<PaymentEntry, "id" | "paymentId">) => {
      if (!isEditing || !sale) {
        paymentCollector.addPayment(payment);
        return;
      }

      setSubmitting(true);
      try {
        const payload: SalePaymentRequest = { ...payment };
        const updatedSale = await SalesService.addPaymentToSale(sale.id, payload);

        syncFromSale(updatedSale, false);

        toast({ title: "Pago agregado" });
      } catch (error: unknown) {
        toast({
          title: "Error al agregar pago",
          description: getAaxiosErrorMessage(error),
          variant: "destructive",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [isEditing, sale, paymentCollector, toast, syncFromSale]
  );

  const removePaymentDeclarative = useCallback(
    async (id: string) => {
      if (!isEditing || !sale) {
        paymentCollector.removePayment(id);
        return;
      }
      const payment = paymentCollector.findPaymentByClientId(id);
      if (!payment) return;
      if (!payment.paymentId) {
        paymentCollector.removePayment(id);
        return;
      }
      const originalPayments = [...paymentCollector.payments];
      paymentCollector.removePayment(id);
      setSubmitting(true);
      try {
        await SalesService.deleteSalePayment(sale.id, payment.paymentId);
        toast({ title: "Pago eliminado" });
      } catch (error: unknown) {
        toast({ title: "Error al eliminar pago", description: getAaxiosErrorMessage(error), variant: "destructive" });
        paymentCollector.setPayments(originalPayments);
      } finally {
        setSubmitting(false);
      }
    },
    [isEditing, sale, paymentCollector, toast]
  );

  const handleCreateSale = useCallback(
    async (mode: SubmitMode, values: SaleFormValues) => {
      clearSectionErrors();
      const finalizeSale = mode === "final";
      const payload: CreateSaleRequest = {
        finalizeSale,
        branchId,
        sellerId,
        customerId: values.customerId,
        documentType: values.documentType,
        documentNumber: values.documentNumber,
        notes: values.notes,
        items: cart.toSaleItems(),
        payments: paymentCollector.toSalePayments(),
      };
      const parsed = createSaleRequestSchema.safeParse(payload);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          const path0 = issue.path?.[0];
          if (path0 === "documentType" || path0 === "documentNumber" || path0 === "customerId" || path0 === "notes") {
            form.setError(path0 as keyof SaleFormValues, { type: "zod", message: issue.message });
          } else if (path0 === "items") {
            setItemsError(issue.message);
          } else if (path0 === "payments") {
            setPaymentsError(issue.message);
          }
        }
        return null;
      }
      try {
        setSubmitting(true);
        const savedSale = await SalesService.saveSale(parsed.data);
        if (finalizeSale) {
          toast({ title: "Venta finalizada", description: `Se generó la venta #${savedSale.id}` });
          handleReset();
          router.push("/dashboard/pos/sales/new");
        } else {
          toast({ title: "Borrador guardado", description: `Venta #${savedSale.id} creada.` });
          router.push(`/dashboard/pos/sales/new?saleId=${savedSale.id}`);
        }
        return savedSale;
      } catch (err: unknown) {
        toast({ title: "Error al crear la venta", description: getAaxiosErrorMessage(err), variant: "destructive" });
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [branchId, sellerId, cart, paymentCollector, handleReset, router, toast, clearSectionErrors, form]
  );

  const handleFinalizeSale = useCallback(async () => {
    if (!sale) return;
    if (paymentCollector.payments.length === 0) {
      setPaymentsError("Para finalizar la venta debes registrar al menos un pago");
      return;
    }
    clearSectionErrors();
    setSubmitting(true);
    const payload: FinalizeSaleRequest = { payments: paymentCollector.toSalePayments() };
    const parsed = finalizeSaleRequestSchema.safeParse(payload);
    if (!parsed.success) {
      setPaymentsError("Error al validar los pagos para finalizar.");
      setSubmitting(false);
      return;
    }
    try {
      const finalizedSale = await SalesService.finalizeSale(sale.id, parsed.data);
      toast({ title: "Venta finalizada", description: `Se procesó la venta #${finalizedSale.id}` });
      handleReset();
      router.push("/dashboard/pos/sales/new");
    } catch (err: unknown) {
      toast({ title: "Error al finalizar la venta", description: getAaxiosErrorMessage(err), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }, [sale, paymentCollector, handleReset, router, toast, clearSectionErrors]);

  const onSubmitFinal = form.handleSubmit(async (values) => {
    if (isEditing && sale) {
      await handleFinalizeSale();
    } else {
      await handleCreateSale("final", values);
    }
  });

  const onSubmitDraft = form.handleSubmit(async (values) => {
    if (!isEditing) {
      await handleCreateSale("draft", values);
    }
  });

  const totalDue = useMemo(() => cart.totals.grandTotal, [cart.totals]);
  const isBusy = submitting || isUpdatingHeader;

  if (!isInitialLoadDone) return <div className="p-6">Cargando...</div>;

  return (
    <div className="space-y-6 flex-1 flex flex-col">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl p-2 bg-gradient-to-br from-primary/15 to-primary/5 text-primary shadow-[0_2px_10px_-6px_rgb(0_0_0/0.3)]">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {isEditing ? (
                <>
                  Editando Venta <span className="text-slate-400">#{sale?.id}</span>
                </>
              ) : (
                "Nueva venta"
              )}
            </h1>
            <p className="mt-1 text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Realiza una nueva o edita una guardada como borrador.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PendingSalesSheet branchId={branchId} />
          <Button onClick={handleReset} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Nueva Venta
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={onSubmitFinal} className="space-y-6 flex-1">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] h-full">
            <div className="space-y-6 flex flex-col">
              <SaleDetailsSection
                form={form}
                isFinalized={isFinalized}
                isEditing={isEditing}
                documentOptions={DOCUMENT_OPTIONS}
                onHeaderUpdate={handleHeaderUpdate}
              />
              <Card className="surface-card flex-1 gap-4">
                <CardHeader className="flex items-center gap-2 flex-row">
                  <BoxIcon className="h-4 w-4" />
                  <CardTitle>Artículos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 flex flex-col flex-1">
                  <AddProductsSection branchId={branchId} onAddProduct={addProductDeclarative} disabled={isFinalized || isBusy} />
                  <SaleItemsSection
                    items={cart.items}
                    onQuantityChange={(id, q) => patchItem(id, { quantity: q })}
                    onUnitPriceChange={(id, p) => patchItem(id, { unitPrice: p })}
                    onRemove={removeItemDeclarative}
                    errorMessage={itemsError}
                    disabled={isFinalized || isBusy}
                  />
                </CardContent>
              </Card>
            </div>

            <OrderSummarySection
              isFinalized={isFinalized}
              submitting={isBusy}
              totals={cart.totals}
              paymentTotals={paymentCollector.totals}
              payments={paymentCollector.payments}
              totalDue={totalDue}
              onAddPayment={addPaymentDeclarative}
              onRemovePayment={removePaymentDeclarative}
              onSaveDraft={onSubmitDraft}
              paymentsErrorMessage={paymentsError}
              isEditing={isEditing}
            />
          </div>
        </form>
      </Form>
    </div>
  );
}

export default function PointOfSalePage() {
  return (
    <Suspense fallback={<div className="p-6">Cargando venta...</div>}>
      <DashboardLayoutSection>
        <div className="h-full">
          <div className="mx-auto flex h-full max-w-8xl flex-col">
            <PointOfSaleContent />
          </div>
        </div>
      </DashboardLayoutSection>
    </Suspense>
  );
}
