"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/context/user-context";
import { saleFormSchema, SaleFormValues } from "../../../_schemas/sale-form-schema";
import { usePosCart, PosCartItem } from "../../../_hooks/usePosCart";
import { usePaymentCollector, PaymentEntry } from "../../../_hooks/usePaymentCollector";
import CartTable from "../../../_components/cart-table";
import ProductSearchDialog from "../../../_components/product-search-dialog";
import AddPaymentDialog from "../../../_components/add-payment-dialog";
import PaymentTable from "../../../_components/payment-table";
import TotalsSummary from "../../../_components/totals-summary";
import SalesService from "../../../_service/sales.service";
import { CreateSaleRequest } from "../../../_types/sale-request";
import { SalesDocumentType, SaleItemKind, SaleStatus } from "../../../_types/sale-enums";
import { SaleDetailResponse, SalePaymentResponse, SaleResponse, SaleSummaryResponse } from "../../../_types/sale-response";

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

const generateId = () => Math.random().toString(36).slice(2, 11);

export default function PointOfSalePage() {
  const { userInfo } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const saleIdParam = searchParams.get("saleId");

  const branchId = userInfo?.selectedBranch?.id ?? 0;
  const sellerId = userInfo?.userId ?? 0;

  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });

  const {
    items,
    addProduct,
    updateQuantity,
    updateUnitPrice,
    removeItem,
    resetCart,
    setCartItems,
    totals,
    toSaleItems,
  } = usePosCart();

  const {
    payments,
    addPayment,
    removePayment,
    resetPayments,
    setPaymentEntries,
    totals: paymentTotals,
    toSalePayments,
  } = usePaymentCollector();

  const [submitting, setSubmitting] = useState(false);
  const [loadingSale, setLoadingSale] = useState(false);
  const [currentSaleId, setCurrentSaleId] = useState<number | undefined>(saleIdParam ? Number(saleIdParam) : undefined);
  const [currentStatus, setCurrentStatus] = useState<SaleStatus | null>(null);
  const [pendingSales, setPendingSales] = useState<SaleSummaryResponse[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [autoSavingNewSale, setAutoSavingNewSale] = useState(false);

  const mapDetailToCartItem = useCallback((detail: SaleDetailResponse): PosCartItem => {
    if (detail.productId) {
      return {
        id: generateId(),
        kind: SaleItemKind.PRODUCT,
        productId: detail.productId,
        productBatchId: detail.productBatchId,
        saleModeId: detail.saleModeId,
        unitPrice: detail.unitPrice,
        quantity: detail.quantity,
        unitType: detail.unitType,
        taxRate: detail.taxRate,
        taxAmount: detail.taxAmount,
        name: detail.description,
        metadataJson: detail.metadataJson,
        quantityEquivalent: detail.quantityEquivalent ?? undefined,
        lineSubtotal: detail.lineSubtotal,
        saleModeLabel: detail.unitType,
      };
    }

    if (detail.serviceType) {
      return {
        id: generateId(),
        kind: SaleItemKind.SERVICE,
        serviceType: detail.serviceType,
        serviceItemId: detail.serviceItemId,
        unitPrice: detail.unitPrice,
        quantity: detail.quantity,
        taxRate: detail.taxRate,
        taxAmount: detail.taxAmount,
        name: detail.description,
        metadataJson: detail.metadataJson,
        lineSubtotal: detail.lineSubtotal,
      };
    }

    // Fallback to treat as generic item
    return {
      id: generateId(),
      kind: SaleItemKind.PRODUCT,
      productId: detail.productId,
      productBatchId: detail.productBatchId,
      saleModeId: detail.saleModeId,
      unitPrice: detail.unitPrice,
      quantity: detail.quantity,
      unitType: detail.unitType,
      taxRate: detail.taxRate,
      taxAmount: detail.taxAmount,
      name: detail.description,
      metadataJson: detail.metadataJson,
      quantityEquivalent: detail.quantityEquivalent ?? undefined,
      lineSubtotal: detail.lineSubtotal,
      saleModeLabel: detail.unitType,
    };
  }, []);

  const mapPaymentToEntry = useCallback((payment: SalePaymentResponse): PaymentEntry => ({
    id: generateId(),
    amount: payment.amount,
    method: payment.method,
    paidAt: payment.paidAt,
    reference: payment.reference,
    notes: payment.notes,
  }), []);

  const applySaleToForm = useCallback((sale: SaleResponse) => {
    setCurrentSaleId(sale.id);
    setCurrentStatus(sale.status);

    form.setValue("documentType", sale.documentType);
    form.setValue("documentNumber", sale.documentNumber);
    form.setValue("customerId", sale.customerId ?? undefined);
    form.setValue("notes", sale.notes ?? "");

    setCartItems(sale.details.map(mapDetailToCartItem));
    setPaymentEntries(sale.payments.map(mapPaymentToEntry));
  }, [form, mapDetailToCartItem, mapPaymentToEntry, setCartItems, setPaymentEntries]);

  const loadPendingSales = useCallback(async () => {
    try {
      setLoadingPending(true);
      const drafts = await SalesService.listPendingSales(branchId || undefined);
      setPendingSales(drafts.filter((draft) => draft.status === SaleStatus.DRAFT));
    } catch (error) {
      console.error(error);
      toast({ title: "No se pudieron obtener las ventas en borrador", variant: "destructive" });
    } finally {
      setLoadingPending(false);
    }
  }, [branchId, toast]);

  useEffect(() => {
    if (!saleIdParam) {
      setCurrentSaleId(undefined);
      setCurrentStatus(null);
      resetCart();
      resetPayments();
      form.reset(DEFAULT_FORM_VALUES);
      return;
    }

    const parsedId = Number(saleIdParam);
    if (Number.isNaN(parsedId)) {
      return;
    }

    setLoadingSale(true);
    SalesService.getSale(parsedId)
      .then(applySaleToForm)
      .catch((error) => {
        console.error(error);
        toast({ title: "No se pudo cargar la venta seleccionada", variant: "destructive" });
        router.replace("/dashboard/pos/new");
      })
      .finally(() => setLoadingSale(false));
  }, [applySaleToForm, form, resetCart, resetPayments, router, saleIdParam, toast]);

  useEffect(() => {
    loadPendingSales();
  }, [loadPendingSales]);

  const handleAddPayment = useCallback(
    (payment: Omit<PaymentEntry, "id">) => {
      addPayment({ ...payment });
    },
    [addPayment]
  );

  const performSave = useCallback(async (mode: SubmitMode, values: SaleFormValues, options: { skipDraftContext?: boolean } = {}) => {
    const { skipDraftContext = false } = options;
    const finalizeSale = mode === "final";
    const saleItems = toSaleItems();

    if (saleItems.length === 0) {
      toast({
        title: "Agrega productos o servicios",
        description: "Necesitas al menos un ítem en la venta",
        variant: "destructive",
      });
      return null;
    }

    const salePayments = toSalePayments();
    if (finalizeSale && salePayments.length === 0) {
      toast({
        title: "Registra un pago",
        description: "Añade al menos un pago para completar la venta",
        variant: "destructive",
      });
      return null;
    }

    const payload: CreateSaleRequest = {
      saleId: currentSaleId,
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

    try {
      setSubmitting(true);
      const sale = await SalesService.saveSale(payload);
      await loadPendingSales();

      if (finalizeSale) {
        toast({ title: "Venta finalizada", description: `Se generó la venta #${sale.id}` });
        resetCart();
        resetPayments();
        form.reset(DEFAULT_FORM_VALUES);
        setCurrentSaleId(undefined);
        setCurrentStatus(sale.status);
        router.push("/dashboard/pos/history");
      } else if (!skipDraftContext) {
        applySaleToForm(sale);
        toast({ title: "Borrador guardado", description: `Venta #${sale.id} en progreso` });
        router.replace(`/dashboard/pos/new?saleId=${sale.id}`);
      } else {
        toast({ title: "Borrador guardado", description: `Venta #${sale.id} en progreso` });
      }

      return sale;
    } catch (error) {
      console.error(error);
      toast({
        title: finalizeSale ? "Error al completar la venta" : "Error al guardar el borrador",
        description: "Revisa los datos e intenta nuevamente",
        variant: "destructive",
      });
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [applySaleToForm, branchId, currentSaleId, form, loadPendingSales, resetCart, resetPayments, router, sellerId, toSaleItems, toSalePayments, toast]);

  const handleSave = useCallback(
    (mode: SubmitMode) =>
      form.handleSubmit(async (values) => {
        await performSave(mode, values);
      }),
    [form, performSave]
  );

  const handleStartNewSale = useCallback(async () => {
    if (autoSavingNewSale) return;
    setAutoSavingNewSale(true);
    await form
      .handleSubmit(async (values) => {
        const sale = await performSave("draft", values, { skipDraftContext: true });
        if (sale) {
          resetCart();
          resetPayments();
          form.reset(DEFAULT_FORM_VALUES);
          setCurrentSaleId(undefined);
          setCurrentStatus(null);
          router.replace("/dashboard/pos/new");
          toast({ title: "Nuevo borrador creado", description: `Venta #${sale.id} guardada.` });
        }
      })()
      .finally(() => setAutoSavingNewSale(false));
  }, [autoSavingNewSale, form, performSave, resetCart, resetPayments, toast]);

  const totalDue = useMemo(() => totals.grandTotal, [totals]);
  const isFinalized = currentStatus === SaleStatus.COMPLETED;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {currentSaleId ? `Venta #${currentSaleId}` : "Nueva venta"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Sucursal: {userInfo?.selectedBranch?.name ?? "No asignada"}
          </p>
          {isFinalized && (
            <p className="text-sm text-green-600">Venta completada. No es posible editarla.</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={handleStartNewSale}
            disabled={submitting || autoSavingNewSale}
          >
            {autoSavingNewSale ? "Guardando..." : "Nueva venta"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Ventas en borrador</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loadingPending ? (
            <p className="text-sm text-muted-foreground">Cargando borradores...</p>
          ) : pendingSales.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay ventas en borrador.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {pendingSales.map((sale) => (
                <Button
                  key={sale.id}
                  variant={sale.id === currentSaleId ? "default" : "outline"}
                  size="sm"
                  onClick={() => router.push(`/dashboard/pos/new?saleId=${sale.id}`)}
                >
                  #{sale.id} • {sale.documentType}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {loadingSale ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">Cargando venta...</CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSave("final")} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">1. Detalles de la venta</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Tipo de comprobante</Label>
                    <Select
                      value={form.watch("documentType")}
                      onValueChange={(value) => form.setValue("documentType", value as SalesDocumentType)}
                      disabled={isFinalized}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                      <SelectContent>
                        {DOCUMENT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Número de comprobante</Label>
                    <Input
                      value={form.watch("documentNumber")}
                      onChange={(event) => form.setValue("documentNumber", event.target.value)}
                      placeholder="Serie-correlativo"
                      disabled={isFinalized}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>ID Cliente (opcional)</Label>
                    <Input
                      type="number"
                      value={form.watch("customerId") ?? ""}
                      onChange={(event) =>
                        form.setValue(
                          "customerId",
                          event.target.value ? Number(event.target.value) : undefined
                        )
                      }
                      placeholder="Buscar cliente (pendiente)"
                      disabled={isFinalized}
                    />
                  </div>
                  <div className="md:col-span-3 space-y-2">
                    <Label>Notas</Label>
                    <Input
                      value={form.watch("notes") ?? ""}
                      onChange={(event) => form.setValue("notes", event.target.value)}
                      placeholder="Observaciones de la venta"
                      disabled={isFinalized}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">2. Agregar productos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Busca productos para añadirlos a la venta. Los servicios estarán disponibles en la siguiente fase.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <ProductSearchDialog
                      branchId={branchId}
                      onSelect={(product, saleMode) => addProduct(product, saleMode)}
                    />
                    <Button variant="outline" disabled>
                      Agregar servicio
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">3. Ítems en la venta</CardTitle>
                </CardHeader>
                <CardContent>
                  <CartTable
                    items={items}
                    onQuantityChange={updateQuantity}
                    onUnitPriceChange={updateUnitPrice}
                    onRemove={removeItem}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="lg:sticky lg:top-24">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Resumen del pedido</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Revisa los montos antes de finalizar la venta.
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <TotalsSummary
                    subtotal={totals.subtotal}
                    taxTotal={totals.taxTotal}
                    grandTotal={totals.grandTotal}
                    paidAmount={paymentTotals.totalPaid}
                  />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">Pagos registrados</span>
                      {!isFinalized && (
                        <AddPaymentDialog
                          totalDue={Math.max(totalDue - paymentTotals.totalPaid, 0)}
                          onAdd={handleAddPayment}
                        />
                      )}
                    </div>
                    {isFinalized && payments.length === 0 && (
                      <p className="text-xs text-muted-foreground">Esta venta no tiene pagos registrados.</p>
                    )}
                    <PaymentTable
                      payments={payments}
                      onRemove={(id) => {
                        if (!isFinalized) {
                          removePayment(id);
                        }
                      }}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSave("draft")()}
                    disabled={submitting || isFinalized}
                  >
                    Guardar borrador
                  </Button>
                  <Button type="submit" disabled={submitting || isFinalized}>
                    {submitting ? "Procesando..." : isFinalized ? "Venta finalizada" : "Finalizar venta"}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
