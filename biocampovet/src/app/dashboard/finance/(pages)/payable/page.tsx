"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import DashboardLayoutSection from "@/app/dashboard/dashboard-layout-section";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";
import AccountPayableService, {
  AccountPayableListParams,
  CreateAccountPayablePayload,
  RegisterPaymentPayload,
} from "../../_services/account-payable-service";
import {
  AccountPayableDetail,
  AccountPayablePage,
  AccountPayableStatus,
  AccountPayableSummary,
} from "../../_types/account-payable";
import TreasuryAccountService from "../../_services/treasury-account-service";
import { TreasuryAccountResponse } from "../../_types/treasury-account";
import { accountPayableSchema, AccountPayableFormValues } from "../../_schemas/account-payable-schema";
import { registerPaymentSchema, RegisterPaymentFormValues } from "../../_schemas/payment-schema";

const PEN = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", minimumFractionDigits: 2 });
const DATE_FMT = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium" });

export default function AccountsPayablePage() {
  const { toast } = useToast();
  const [pageData, setPageData] = useState<AccountPayablePage | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [filters, setFilters] = useState<{ status?: AccountPayableStatus; search?: string }>({});
  const [searchText, setSearchText] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [selected, setSelected] = useState<AccountPayableDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [treasuryAccounts, setTreasuryAccounts] = useState<TreasuryAccountResponse[]>([]);

  const createForm = useForm<AccountPayableFormValues>({
    resolver: zodResolver(accountPayableSchema),
    defaultValues: {
      supplierId: undefined,
      description: "",
      issueDate: new Date().toISOString().slice(0, 10),
      totalAmount: 0,
    },
  });

  const paymentForm = useForm<RegisterPaymentFormValues>({
    resolver: zodResolver(registerPaymentSchema),
    defaultValues: {
      amount: 0,
      treasuryAccountId: undefined,
      paymentDate: new Date().toISOString().slice(0, 10),
    },
  });

  const loadTreasuryAccounts = useCallback(async () => {
    try {
      const response = await TreasuryAccountService.list();
      setTreasuryAccounts(response);
      if (response.length) {
        paymentForm.setValue("treasuryAccountId", response[0].id);
      }
    } catch (error) {
      toast({
        title: "No se pudieron obtener las cuentas",
        description: getAaxiosErrorMessage(error) ?? "Intenta nuevamente",
        variant: "destructive",
      });
    }
  }, [paymentForm, toast]);

  const loadPage = useCallback(
    async (params: AccountPayableListParams) => {
      setLoadingList(true);
      try {
        const response = await AccountPayableService.list(params);
        setPageData(response);
      } catch (error) {
        toast({
          title: "No se pudieron cargar las cuentas por pagar",
          description: getAaxiosErrorMessage(error) ?? "Intenta nuevamente",
          variant: "destructive",
        });
      } finally {
        setLoadingList(false);
      }
    },
    [toast]
  );

  const loadDetail = useCallback(
    async (id: number) => {
      setDetailLoading(true);
      try {
        const response = await AccountPayableService.getDetail(id);
        setSelected(response);
      } catch (error) {
        toast({
          title: "No se pudo cargar el detalle",
          description: getAaxiosErrorMessage(error) ?? "Intenta nuevamente",
          variant: "destructive",
        });
      } finally {
        setDetailLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    loadPage({ page: pageIndex, size: 10, status: filters.status, search: filters.search });
  }, [pageIndex, filters.status, filters.search, loadPage]);

  useEffect(() => {
    setSearchText(filters.search ?? "");
  }, [filters.search]);

  useEffect(() => {
    if (!pageData) return;
    if (!pageData.content.length) {
      setSelected(null);
      return;
    }
    loadDetail(pageData.content[0].id);
  }, [pageData, loadDetail]);

  useEffect(() => {
    loadTreasuryAccounts();
  }, [loadTreasuryAccounts]);


  const outstanding = useMemo(() => {
    if (!selected) return 0;
    return Math.max(selected.totalAmount - selected.amountPaid, 0);
  }, [selected]);


  useEffect(() => {
    if (paymentOpen && selected) {
      paymentForm.setValue("amount", Number(outstanding.toFixed(2)));
    }
  }, [paymentOpen, selected, outstanding, paymentForm]);

  const handleCreate = createForm.handleSubmit(async (values) => {
    const payload: CreateAccountPayablePayload = {
      supplierId: Number.isFinite(values.supplierId) ? values.supplierId : undefined,
      description: values.description.trim(),
      issueDate: values.issueDate,
      totalAmount: values.totalAmount,
    };
    try {
      await AccountPayableService.create(payload);
      toast({ title: "Cuenta por pagar creada" });
      setCreateOpen(false);
      createForm.reset({
        supplierId: undefined,
        description: "",
        issueDate: new Date().toISOString().slice(0, 10),
        totalAmount: 0,
      });
      loadPage({ page: 0, size: 10, status: filters.status, search: filters.search });
      setPageIndex(0);
    } catch (error) {
      toast({
        title: "No se pudo crear",
        description: getAaxiosErrorMessage(error) ?? "Revisa los campos e intenta nuevamente",
        variant: "destructive",
      });
    }
  });

  const handlePayment = paymentForm.handleSubmit(async (values) => {
    if (!selected) return;
    const payload: RegisterPaymentPayload = {
      amount: values.amount,
      treasuryAccountId: values.treasuryAccountId,
      paymentDate: values.paymentDate,
      notes: values.notes?.trim() || undefined,
    };
    try {
      const updated = await AccountPayableService.registerPayment(selected.id, payload);
      toast({ title: "Pago registrado" });
      setSelected(updated);
      setPaymentOpen(false);
      paymentForm.reset({
        amount: 0,
        treasuryAccountId: values.treasuryAccountId,
        paymentDate: new Date().toISOString().slice(0, 10),
      });
      loadPage({ page: pageIndex, size: 10, status: filters.status, search: filters.search });
    } catch (error) {
      toast({
        title: "No se pudo registrar el pago",
        description: getAaxiosErrorMessage(error) ?? "Intenta nuevamente",
        variant: "destructive",
      });
    }
  });

  return (
    <DashboardLayoutSection>
      <div className="h-full bg-gray-50 p-4 sm:p-6">
        <div className="mx-auto flex h-full max-w-7xl flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold">Cuentas por pagar</h1>
            <p className="text-muted-foreground">
              Registra obligaciones con proveedores y controla los pagos parciales o totales desde tus cuentas de tesorería.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Label className="text-sm">Estado</Label>
              <Select
                value={filters.status ?? "ALL"}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, status: value === "ALL" ? undefined : (value as AccountPayableStatus) }))
                }
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value={AccountPayableStatus.PENDING}>Pendientes</SelectItem>
                  <SelectItem value={AccountPayableStatus.PARTIALLY_PAID}>Parciales</SelectItem>
                  <SelectItem value={AccountPayableStatus.PAID}>Pagadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Input placeholder="Buscar por descripción" value={searchText} onChange={(event) => setSearchText(event.target.value)} />
              <Button
                variant="outline"
                onClick={() => {
                  setFilters((prev) => ({ ...prev, search: searchText || undefined }));
                  setPageIndex(0);
                }}
              >
                Buscar
              </Button>
            </div>
            <Button className="ml-auto" onClick={() => setCreateOpen(true)}>
              Nueva cuenta por pagar
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Listado</CardTitle>
                <CardDescription>Selecciona una fila para ver el detalle y registrar pagos.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-medium">Descripción</th>
                        <th className="px-4 py-3 font-medium">Proveedor</th>
                        <th className="px-4 py-3 font-medium text-right">Total</th>
                        <th className="px-4 py-3 font-medium text-right">Pagado</th>
                        <th className="px-4 py-3 font-medium">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingList && (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                            Cargando...
                          </td>
                        </tr>
                      )}
                      {!loadingList && pageData?.content.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                            No hay registros.
                          </td>
                        </tr>
                      )}
                      {!loadingList &&
                        pageData?.content.map((item) => (
                          <tr
                            key={item.id}
                            className={`cursor-pointer border-t transition hover:bg-muted/60 ${selected?.id === item.id ? "bg-muted" : ""}`}
                            onClick={() => loadDetail(item.id)}
                          >
                            <td className="px-4 py-3">
                              <div className="font-medium">{item.description}</div>
                              <div className="text-xs text-muted-foreground">{DATE_FMT.format(new Date(item.issueDate))}</div>
                            </td>
                            <td className="px-4 py-3">{item.supplierName || "Sin proveedor"}</td>
                            <td className="px-4 py-3 text-right">{PEN.format(item.totalAmount)}</td>
                            <td className="px-4 py-3 text-right">{PEN.format(item.amountPaid)}</td>
                            <td className="px-4 py-3">
                              <Badge
                                variant={
                                  item.status === AccountPayableStatus.PAID
                                    ? "default"
                                    : item.status === AccountPayableStatus.PARTIALLY_PAID
                                      ? "secondary"
                                      : "outline"
                                }
                              >
                                {item.status === AccountPayableStatus.PAID
                                  ? "Pagada"
                                  : item.status === AccountPayableStatus.PARTIALLY_PAID
                                    ? "Parcial"
                                    : "Pendiente"}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pageIndex === 0}
                    onClick={() => setPageIndex((value) => Math.max(value - 1, 0))}
                  >
                    Anterior
                  </Button>
                  <span>
                    Página {pageIndex + 1} de {pageData?.totalPages ?? 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!!pageData && pageIndex + 1 >= pageData.totalPages}
                    onClick={() => setPageIndex((value) => value + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Detalle</CardTitle>
                <CardDescription>Pagos registrados y saldo pendiente.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {detailLoading && <p className="text-center text-muted-foreground">Cargando detalle...</p>}
                {!detailLoading && !selected && (
                  <p className="text-center text-muted-foreground">Selecciona una cuenta por pagar.</p>
                )}
                {selected && !detailLoading && (
                  <>
                    <div className="rounded-lg border p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Descripción</p>
                          <p className="font-medium">{selected.description}</p>
                        </div>
                        <Badge variant="outline">
                          {selected.status === AccountPayableStatus.PAID
                            ? "Pagada"
                            : selected.status === AccountPayableStatus.PARTIALLY_PAID
                              ? "Parcial"
                              : "Pendiente"}
                        </Badge>
                      </div>
                      <div className="grid gap-2 text-sm sm:grid-cols-2">
                        <div>
                          <p className="text-muted-foreground">Proveedor</p>
                          <p>{selected.supplierName || "No asignado"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Emisión</p>
                          <p>{DATE_FMT.format(new Date(selected.issueDate))}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total</p>
                          <p className="font-semibold">{PEN.format(selected.totalAmount)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Pendiente</p>
                          <p className="font-semibold text-orange-600">{PEN.format(outstanding)}</p>
                        </div>
                      </div>
                      {selected.status !== AccountPayableStatus.PAID && (
                        <Button className="w-full" onClick={() => setPaymentOpen(true)} disabled={!treasuryAccounts.length}>
                          Registrar pago
                        </Button>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <p className="font-medium">Historial de pagos</p>
                        <span className="text-sm text-muted-foreground">{selected.payments.length} registros</span>
                      </div>
                      <Separator className="my-3" />
                      <ScrollArea className="h-[280px]">
                        {selected.payments.length === 0 && (
                          <p className="text-center text-sm text-muted-foreground">Aún no hay pagos registrados.</p>
                        )}
                        <div className="space-y-3">
                          {selected.payments.map((payment) => (
                            <div key={payment.id} className="rounded-lg border p-3 text-sm">
                              <div className="flex items-center justify-between">
                                <span>{DATE_FMT.format(new Date(payment.paymentDate))}</span>
                                <span className="font-semibold">{PEN.format(payment.amount)}</span>
                              </div>
                              <div className="text-muted-foreground">
                                {payment.treasuryAccountName || `Cuenta #${payment.treasuryAccountId}`}
                              </div>
                              {payment.notes && <p className="text-xs text-muted-foreground">{payment.notes}</p>}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva cuenta por pagar</DialogTitle>
            <DialogDescription>Registra manualmente una obligación con proveedor.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label>ID de proveedor (opcional)</Label>
              <Input type="number" placeholder="Ej. 5" {...createForm.register("supplierId", { valueAsNumber: true })} />
            </div>
            <div>
              <Label>Descripción</Label>
              <Input placeholder="Ej. Factura #123" {...createForm.register("description")} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Fecha emisión</Label>
                <Input type="date" {...createForm.register("issueDate")} />
              </div>
              <div>
                <Label>Total</Label>
                <Input type="number" step="0.01" min="0" {...createForm.register("totalAmount", { valueAsNumber: true })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createForm.formState.isSubmitting}>
                {createForm.formState.isSubmitting ? "Guardando..." : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={paymentOpen && Boolean(selected)} onOpenChange={setPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar pago</DialogTitle>
            <DialogDescription>
              Descuenta el monto desde una cuenta de tesorería. Saldo pendiente: {PEN.format(outstanding)}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePayment} className="space-y-4">
            <div>
              <Label>Monto</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...paymentForm.register("amount", { valueAsNumber: true })}
                placeholder={outstanding ? outstanding.toString() : "0"}
              />
            </div>
            <div>
              <Label>Cuenta de tesorería</Label>
              <Select
                value={paymentForm.watch("treasuryAccountId") ? String(paymentForm.watch("treasuryAccountId")) : undefined}
                onValueChange={(value) => paymentForm.setValue("treasuryAccountId", Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una cuenta" />
                </SelectTrigger>
                <SelectContent>
                  {treasuryAccounts.map((account) => (
                    <SelectItem key={account.id} value={String(account.id)}>
                      {account.name} ({PEN.format(account.currentBalance)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Fecha</Label>
                <Input type="date" {...paymentForm.register("paymentDate")} />
              </div>
              <div>
                <Label>Notas</Label>
                <Input placeholder="Opcional" {...paymentForm.register("notes")} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPaymentOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={paymentForm.formState.isSubmitting}>
                {paymentForm.formState.isSubmitting ? "Registrando..." : "Registrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayoutSection>
  );
}
