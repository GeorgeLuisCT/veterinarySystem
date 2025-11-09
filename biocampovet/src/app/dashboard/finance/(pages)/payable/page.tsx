// app/dashboard/finance/(pages)/accounts-payable/page.tsx
"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayoutSection from "@/app/dashboard/dashboard-layout-section";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";
import type { PaginatedResponse } from "@/types/paginated-response";
import AccountsPayableFilters from "../../_components/accounts-payable-filters";
import AccountsPayableTable from "../../_components/accounts-payable-table";
import RegisterPaymentDialog from "../../_components/register-payment-dialog";
import AccountPayableDetailCard from "../../_components/account-payable-detail-card";
import { AccountPayableDetail, AccountPayableStatus, AccountPayableSummary } from "../../_types/account-payable";
import { TreasuryAccountResponse } from "../../_types/treasury-account";
import AccountPayableService, { AccountPayableListParams, CreateAccountPayablePayload, RegisterPaymentPayload } from "../../_services/account-payable-service";
import TreasuryAccountService from "../../_services/treasury-account-service";
import AccountPayableCreateDialog from "../../_components/account-payable-create-dialog";
import { PlusCircle } from "lucide-react";

const PEN = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", minimumFractionDigits: 2 });

export default function AccountsPayablePage() {
  const { toast } = useToast();

  const [pageData, setPageData] = useState<PaginatedResponse<AccountPayableSummary> | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<{ status?: AccountPayableStatus; search?: string }>({});

  const [loadingList, setLoadingList] = useState(true);
  const [selected, setSelected] = useState<AccountPayableDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [treasuryAccounts, setTreasuryAccounts] = useState<TreasuryAccountResponse[]>([]);

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

  const loadTreasuryAccounts = useCallback(async () => {
    try {
      const response = await TreasuryAccountService.list();
      setTreasuryAccounts(response);
    } catch (error) {
      toast({
        title: "No se pudieron obtener las cuentas",
        description: getAaxiosErrorMessage(error) ?? "Intenta nuevamente",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    loadPage({ page: pageIndex, size: pageSize, status: filters.status, search: filters.search });
  }, [pageIndex, pageSize, filters.status, filters.search, loadPage]);

  useEffect(() => {
    loadTreasuryAccounts();
  }, [loadTreasuryAccounts]);

  useEffect(() => {
    if (!pageData) return;
    if (!pageData.content.length) {
      setSelected(null);
      return;
    }
    loadDetail(pageData.content[0].id);
  }, [pageData, loadDetail]);

  const outstanding = useMemo(() => {
    if (!selected) return 0;
    return Math.max(selected.totalAmount - selected.amountPaid, 0);
  }, [selected]);

  const handleCreate = async (values: CreateAccountPayablePayload) => {
    try {
      await AccountPayableService.create(values);
      toast({ title: "Cuenta por pagar creada" });
      setCreateOpen(false);
      setPageIndex(0);
      loadPage({ page: 0, size: pageSize, status: filters.status, search: filters.search });
    } catch (error) {
      toast({
        title: "No se pudo crear",
        description: getAaxiosErrorMessage(error) ?? "Revisa los campos e intenta nuevamente",
        variant: "destructive",
      });
    }
  };

  const handleRegisterPayment = async (values: RegisterPaymentPayload) => {

    console.log(values);
    if (!selected) return;
    try {
      const updated = await AccountPayableService.registerPayment(selected.id, values);
      toast({ title: "Pago registrado" });
      setSelected(updated);
      setPaymentOpen(false);
      loadPage({ page: pageIndex, size: pageSize, status: filters.status, search: filters.search });
    } catch (error) {
      toast({
        title: "No se pudo registrar el pago",
        description: getAaxiosErrorMessage(error) ?? "Intenta nuevamente",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayoutSection>
      <div className="h-full bg-gray-50 p-4 sm:p-6">
        <div className="mx-auto flex h-full max-w-8xl flex-col overflow-auto">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Cuentas por pagar</h1>
              <p className="mt-1 text-gray-600">
                Registra obligaciones con proveedores y controla los pagos desde tus cuentas de tesorería.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => setCreateOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nueva cuenta por pagar
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-4 flex-1">

            <AccountsPayableFilters
              value={filters}
              onChange={(f) => {
                setFilters(f);
                setPageIndex(0);
              }}
              onReset={() => {
                setFilters({});
                setPageIndex(0);
              }}
            />

            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <Card className="h-full w-full md:w-3/5 flex flex-col">
                <CardHeader>
                  <CardTitle>Listado</CardTitle>
                  <CardDescription>
                    Selecciona una fila para ver el detalle y registrar pagos.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <AccountsPayableTable
                    pageData={pageData}
                    loading={loadingList}
                    pageIndex={pageIndex}
                    pageSize={pageSize}
                    onPageIndexChange={setPageIndex}
                    onPageSizeChange={(s) => {
                      setPageSize(s);
                      setPageIndex(0);
                    }}
                    onRowClick={(row) => loadDetail(row.id)}
                  />
                </CardContent>
              </Card>

              <Card className="h-full w-full md:w-2/5">
                <CardHeader>
                  <CardTitle>Detalle</CardTitle>
                  <CardDescription>
                    Pagos registrados y saldo pendiente.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AccountPayableDetailCard
                    detail={selected}
                    loading={detailLoading}
                    outstanding={outstanding}
                    onRegisterPayment={() => setPaymentOpen(true)}
                    canRegisterPayment={treasuryAccounts.length > 0}
                  />
                </CardContent>
              </Card>
            </div>
            <div />
            <AccountPayableCreateDialog
              open={createOpen}
              onOpenChange={setCreateOpen}
              onSubmit={handleCreate}
            />

            <RegisterPaymentDialog
              open={paymentOpen && Boolean(selected)}
              onOpenChange={setPaymentOpen}
              outstanding={outstanding}
              accounts={treasuryAccounts}
              onSubmit={handleRegisterPayment}
            />
          </div>
        </div>
      </div>
    </DashboardLayoutSection>
  );
}
