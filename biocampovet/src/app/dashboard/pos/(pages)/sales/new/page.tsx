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
  FinalizeSaleRequest, // Importar
  finalizeSaleRequestSchema, // Importar
} from "../../../_types/sale-request";
import { Form } from "@/components/ui/form";
import PendingSalesSheet from "../../../_components/pending-sales-sheet";
import { SaleDetailResponse, SalePaymentResponse, SaleResponse } from "../../../_types/sale-response";
import { ProductQuickSearchResponse, SaleModeSummary } from "@/app/dashboard/inventory/_types/product-response";
import DashboardLayoutSection from "@/app/dashboard/dashboard-layout-section";
import { getAaxiosErrorMessage } from "@/helpers/error";

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

// --- Componente Interno para usar Suspense con useSearchParams ---
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
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false); // Para evitar parpadeo

  const isEditing = useMemo(() => sale?.status === SaleStatus.DRAFT, [sale]);
  const isFinalized = useMemo(() => sale !== null && sale.status !== SaleStatus.DRAFT, [sale]);

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

  const refreshSaleState = useCallback(
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
          router.push("/dashboard/pos"); // Redirigir a nueva venta
          return;
        }
        refreshSaleState(data, true);
        toast({ title: "Borrador cargado", description: `Venta #${data.id} lista para editar.` });
      } catch {
        toast({
          title: "Error al cargar la venta",
          description: "No se pudo obtener el detalle de la venta.",
          variant: "destructive",
        });
        setSale(null);
        router.push("/dashboard/pos"); // Redirigir si falla
      } finally {
        setSubmitting(false);
      }
    },
    [refreshSaleState, toast, router]
  );

  const handleReset = useCallback(() => {
    setSale(null);
    cart.resetCart();
    paymentCollector.resetPayments();
    form.reset(DEFAULT_FORM_VALUES);
    clearSectionErrors();
    // Navegar para limpiar el query param
    router.push("/dashboard/pos");
  }, [cart, paymentCollector, form, clearSectionErrors, router]);

  // --- Efecto para cargar la venta desde la URL ---
  useEffect(() => {
    const saleIdParam = searchParams.get("saleId");
    const id = saleIdParam ? parseInt(saleIdParam, 10) : 0;

    if (id > 0) {
      if (sale?.id !== id) {
        loadSale(id);
      }
    } else {
      if (sale) {
        handleReset();
      }
    }
    setIsInitialLoadDone(true); // Marcar que la verificación inicial se hizo
    // 'loadSale' y 'handleReset' tienen dependencias, 'sale' y 'searchParams' son los disparadores
  }, [loadSale, handleReset, searchParams, sale]);

  // --- Handler para Auto-Guardado de Cabecera ---
  const handleHeaderUpdate = useCallback(
    async (values: SaleFormValues) => {
      if (!isEditing || !sale) return;

      setIsUpdatingHeader(true);
      const payload: UpdateSaleRequest = {
        ...values,
        branchId: sale.branchId,
        sellerId: sale.sellerId,
        // Asumiendo que sourceAttentionId no se maneja en este formulario
      };

      try {
        await SalesService.updateSale(sale.id, payload);
        toast({ title: "Cambios guardados", description: "Detalles de la venta actualizados." });
        form.reset(values, { keepValues: true }); // Marcar como 'no sucio'
      } catch {
        toast({ title: "Error al auto-guardar", variant: "destructive" });
      } finally {
        setIsUpdatingHeader(false);
      }
    },
    [isEditing, sale, toast, form]
  );

  // --- Handlers de Ítems (Lógica bifurcada) ---
  const handleAddProductClick = useCallback(async (product: ProductQuickSearchResponse, saleMode: SaleModeSummary) => {
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
      refreshSaleState(updatedSale, false);
      toast({ title: "Producto agregado" });
    } catch {
      toast({ title: "Error al agregar producto", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }, [isEditing, sale, cart, refreshSaleState, toast]);

  const handleItemQuantityChange = useCallback(async (itemId: string, quantity: number) => {
    if (!isEditing || !sale) {
      cart.updateQuantity(itemId, quantity);
      return;
    }
    const item = cart.findItemByClientId(itemId);
    if (!item || !item.detailId) return;
    const payload: SaleItemRequest = { ...item, quantity };
    setSubmitting(true);
    try {
      const updatedSale = await SalesService.updateSaleDetail(sale.id, item.detailId, payload);
      refreshSaleState(updatedSale, false);
    } catch {
      toast({ title: "Error al actualizar cantidad", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }, [isEditing, sale, cart, refreshSaleState, toast]);

  const handleItemPriceChange = useCallback(async (itemId: string, unitPrice: number) => {
    if (!isEditing || !sale) {
      cart.updateUnitPrice(itemId, unitPrice);
      return;
    }
    const item = cart.findItemByClientId(itemId);
    if (!item || !item.detailId) return;
    const payload: SaleItemRequest = { ...item, unitPrice };
    setSubmitting(true);
    try {
      const updatedSale = await SalesService.updateSaleDetail(sale.id, item.detailId, payload);
      refreshSaleState(updatedSale, false);
    } catch {
      toast({ title: "Error al actualizar precio", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }, [isEditing, sale, cart, refreshSaleState, toast]);

  const handleItemRemove = useCallback(async (itemId: string) => {
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
      refreshSaleState(updatedSale, false);
      toast({ title: "Ítem eliminado" });
    } catch {
      toast({ title: "Error al eliminar ítem", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }, [isEditing, sale, cart, refreshSaleState, toast]);

  // --- Handlers de Pagos (Lógica bifurcada) ---
  const handleAddPayment = useCallback(async (payment: Omit<PaymentEntry, "id" | "paymentId">) => {
    if (!isEditing || !sale) {
      paymentCollector.addPayment(payment);
      return;
    }
    const payload: SalePaymentRequest = { ...payment };
    setSubmitting(true);
    try {
      const updatedSale = await SalesService.addPaymentToSale(sale.id, payload);
      refreshSaleState(updatedSale, false);
      toast({ title: "Pago agregado" });
    } catch {
      toast({ title: "Error al agregar pago", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }, [isEditing, sale, paymentCollector, refreshSaleState, toast]);

  const handleRemovePayment = useCallback(async (id: string) => {
    if (!isEditing || !sale) {
      paymentCollector.removePayment(id);
      return;
    }
    const payment = paymentCollector.findPaymentByClientId(id);
    if (!payment || !payment.paymentId) return;
    setSubmitting(true);
    try {
      await SalesService.deleteSalePayment(sale.id, payment.paymentId);
      const updatedSale = await SalesService.getSale(sale.id);
      refreshSaleState(updatedSale, false);
      toast({ title: "Pago eliminado" });
    } catch {
      toast({ title: "Error al eliminar pago", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }, [isEditing, sale, paymentCollector, refreshSaleState, toast]);

  // --- Lógica de Acciones Principales ---

  // #1: SOLO para crear una nueva venta (borrador o final)
  const handleCreateSale = useCallback(
    async (mode: SubmitMode, values: SaleFormValues) => {
      clearSectionErrors();
      const finalizeSale = mode === "final";
      const saleItems = cart.toSaleItems();
      const salePayments = paymentCollector.toSalePayments();

      const payload: CreateSaleRequest = {
        finalizeSale,
        branchId,
        sellerId,
        customerId: values.customerId,
        documentType: values.documentType,
        documentNumber: values.documentNumber,
        notes: values.notes,
        items: saleItems,
        payments: salePayments,
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
          router.push("/dashboard/pos/history");
        } else {
          toast({ title: "Borrador guardado", description: `Venta #${savedSale.id} creada.` });
          router.push(`/dashboard/pos/sales/new?saleId=${savedSale.id}`);
        }
        return savedSale;
      } catch(err: unknown) {
        toast({ title: "Error al crear la venta",
          description: getAaxiosErrorMessage(err),
          variant: "destructive" });
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [branchId, sellerId, cart, paymentCollector, handleReset, router, toast, clearSectionErrors, form]
  );

  // #2: SOLO para finalizar un borrador existente
  const handleFinalizeSale = useCallback(async () => {
    if (!sale) return;

    if (paymentCollector.payments.length === 0) {
      setPaymentsError("Para finalizar la venta debes registrar al menos un pago");
      return;
    }
    clearSectionErrors();
    setSubmitting(true);

    const salePayments = paymentCollector.toSalePayments();
    const payload: FinalizeSaleRequest = {
      payments: salePayments,
    };

    const parsed = finalizeSaleRequestSchema.safeParse(payload);
    if (!parsed.success) {
      setPaymentsError("Error al validar los pagos para finalizar.");
      setSubmitting(false);
      return;
    }

    try {
      const finalizedSale = await SalesService.finalizeSale(sale.id, parsed.data);
      toast({ title: "Venta finalizada", description: `Se procesó la venta #${finalizedSale.id}` });
      handleReset(); // Esto navegará a /dashboard/pos (limpio)
      router.push("/dashboard/pos/history");
    } catch (err: any) {
      toast({
        title: "Error al finalizar la venta",
        description: err?.response?.data?.message || "No se pudo finalizar el borrador.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }, [sale, paymentCollector, handleReset, router, toast, clearSectionErrors]);

  // --- Handlers de Formulario ---
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

  // No renderizar nada hasta que sepamos si cargamos una venta o no
  if (!isInitialLoadDone) {
    // Puedes poner un spinner/skeleton aquí
    return <div className="p-6">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{isEditing ? `Editando Venta #${sale?.id}` : "Nueva venta"}</h1>
          <p className="text-sm text-muted-foreground">
            Sucursal: {userInfo?.selectedBranch?.name ?? "No asignada"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Este componente ya no necesita 'onSaleSelect' */}
          <PendingSalesSheet branchId={branchId} />
          <Button
            variant="secondary"
            // handleReset ahora limpia la URL
            onClick={handleReset}
            disabled={isBusy}
          >
            Nueva venta
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={onSubmitFinal} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="space-y-6">
              <SaleDetailsSection
                form={form}
                isFinalized={isFinalized}
                isEditing={isEditing}
                documentOptions={DOCUMENT_OPTIONS}
                onHeaderUpdate={handleHeaderUpdate}
              />
              <AddProductsSection
                branchId={branchId}
                onAddProduct={handleAddProductClick}
                disabled={isFinalized || isBusy}
              />
              <SaleItemsSection
                items={cart.items}
                onQuantityChange={handleItemQuantityChange}
                onUnitPriceChange={handleItemPriceChange}
                onRemove={handleItemRemove}
                errorMessage={itemsError}
                disabled={isFinalized || isBusy}
              />
            </div>

            <OrderSummarySection
              isFinalized={isFinalized}
              submitting={isBusy}
              totals={cart.totals}
              paymentTotals={paymentCollector.totals}
              payments={paymentCollector.payments}
              totalDue={totalDue}
              onAddPayment={handleAddPayment}
              onRemovePayment={handleRemovePayment}
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
        <div className="h-full bg-gray-50 p-4 sm:p-6">
          <div className="mx-auto flex h-full max-w-8xl flex-col">
            <PointOfSaleContent />
          </div>
        </div>
      </DashboardLayoutSection>
    </Suspense>
  );
}