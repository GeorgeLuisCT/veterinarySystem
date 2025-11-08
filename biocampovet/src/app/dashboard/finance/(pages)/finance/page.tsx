"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import DashboardLayoutSection from "@/app/dashboard/dashboard-layout-section";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";
import { Pencil, Trash2 } from "lucide-react";
import TreasuryAccountService, {
  ManualMovementPayload,
  TreasuryAccountPayload,
} from "../../_services/treasury-account-service";
import {
  AccountMovementResponse,
  CashboxTransferChannel,
  TreasuryAccountResponse,
  TreasuryAccountType,
} from "../../_types/treasury-account";
import { treasuryAccountSchema, TreasuryAccountFormValues } from "../../_schemas/treasury-account-schema";
import { manualMovementSchema, ManualMovementFormValues } from "../../_schemas/manual-movement-schema";

const PEN = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", minimumFractionDigits: 2 });
const DATE_TIME = new Intl.DateTimeFormat("es-PE", { dateStyle: "short", timeStyle: "short" });

export default function TreasuryAccountsPage() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<TreasuryAccountResponse[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<TreasuryAccountResponse | null>(null);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [movements, setMovements] = useState<AccountMovementResponse[]>([]);
  const [movementPage, setMovementPage] = useState(0);
  const [movementTotalPages, setMovementTotalPages] = useState(0);
  const [movementLoading, setMovementLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [confirmDelete, setConfirmDelete] = useState<TreasuryAccountResponse | null>(null);

  const accountForm = useForm<TreasuryAccountFormValues>({
    resolver: zodResolver(treasuryAccountSchema),
    defaultValues: { name: "", type: TreasuryAccountType.CASH, description: "" },
  });

  const movementForm = useForm<ManualMovementFormValues>({
    resolver: zodResolver(manualMovementSchema),
    defaultValues: { amount: 0, description: "", income: true },
  });

  const loadAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    try {
      const data = await TreasuryAccountService.list();
      setAccounts(data);
      setSelectedAccount((prev) => {
        if (!data.length) {
          return null;
        }
        if (!prev) {
          return data[0];
        }
        return data.find((item) => item.id === prev.id) ?? data[0];
      });
    } catch (error) {
      toast({
        title: "No se pudieron cargar las cuentas",
        description: getAaxiosErrorMessage(error) ?? "Intenta nuevamente",
        variant: "destructive",
      });
    } finally {
      setLoadingAccounts(false);
    }
  }, [toast]);

  const loadMovements = useCallback(
    async (accountId?: number, page: number = 0) => {
      if (!accountId) return;
      setMovementLoading(true);
      try {
        const response = await TreasuryAccountService.getMovements(accountId, { page, size: 10 });
        setMovements(response.content);
        setMovementPage(response.currentPage);
        setMovementTotalPages(response.totalPages);
      } catch (error) {
        toast({
          title: "No se pudieron cargar los movimientos",
          description: getAaxiosErrorMessage(error) ?? "Intenta nuevamente",
          variant: "destructive",
        });
      } finally {
        setMovementLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    if (selectedAccount) {
      loadMovements(selectedAccount.id, 0);
    }
  }, [selectedAccount, loadMovements]);

  const openCreateForm = () => {
    setFormMode("create");
    accountForm.reset({ name: "", type: TreasuryAccountType.CASH, description: "" });
    setFormOpen(true);
  };

  const openEditForm = (account: TreasuryAccountResponse) => {
    setFormMode("edit");
    accountForm.reset({
      name: account.name,
      type: account.type,
      description: account.description ?? "",
    });
    setSelectedAccount(account);
    setFormOpen(true);
  };

  const handleAccountSubmit = accountForm.handleSubmit(async (values) => {
    const payload: TreasuryAccountPayload = {
      name: values.name.trim(),
      type: values.type,
      description: values.description?.trim() || undefined,
    };
    try {
      let updated: TreasuryAccountResponse;
      if (formMode === "edit" && selectedAccount) {
        updated = await TreasuryAccountService.update(selectedAccount.id, payload);
      } else {
        updated = await TreasuryAccountService.create(payload);
      }
      toast({ title: "Cuenta guardada correctamente" });
      setFormOpen(false);
      accountForm.reset();
      await loadAccounts();
      setSelectedAccount(updated);
    } catch (error) {
      toast({
        title: "No se pudo guardar la cuenta",
        description: getAaxiosErrorMessage(error) ?? "Revisa los campos e intenta nuevamente",
        variant: "destructive",
      });
    }
  });

  const handleDeleteAccount = async () => {
    if (!confirmDelete) return;
    try {
      await TreasuryAccountService.remove(confirmDelete.id);
      toast({ title: "Cuenta eliminada" });
      setConfirmDelete(null);
      await loadAccounts();
      if (selectedAccount?.id === confirmDelete.id) {
        setSelectedAccount(null);
      }
    } catch (error) {
      toast({
        title: "No se pudo eliminar la cuenta",
        description: getAaxiosErrorMessage(error) ?? "Verifica que no tenga movimientos",
        variant: "destructive",
      });
    }
  };

  const handleManualMovement = movementForm.handleSubmit(async (values) => {
    if (!selectedAccount) return;
    const payload: ManualMovementPayload = {
      amount: values.amount,
      description: values.description?.trim() || undefined,
      income: values.income,
    };
    try {
      await TreasuryAccountService.registerManualMovement(selectedAccount.id, payload);
      toast({ title: "Movimiento registrado" });
      movementForm.reset({ amount: 0, description: "", income: values.income });
      await loadAccounts();
      await loadMovements(selectedAccount.id, movementPage);
    } catch (error) {
      toast({
        title: "No se pudo registrar el movimiento",
        description: getAaxiosErrorMessage(error) ?? "Intenta nuevamente",
        variant: "destructive",
      });
    }
  });

  const accountBadges = useMemo(
    () =>
    ({
      [TreasuryAccountType.CASH]: "bg-emerald-50 text-emerald-700",
      [TreasuryAccountType.BANK]: "bg-blue-50 text-blue-700",
      [TreasuryAccountType.DIGITAL]: "bg-purple-50 text-purple-700",
    } as Record<TreasuryAccountType, string>),
    []
  );

  return (
    <DashboardLayoutSection>
      <div className="h-full bg-gray-50 p-4 sm:p-6">
        <div className="mx-auto flex h-full max-w-7xl flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold">Tesorería</h1>
            <p className="text-muted-foreground">
              Administra las cuentas bancarias, cajas y billeteras digitales. Registra movimientos manuales y consulta el
              historial.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="h-fit">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Cuentas de tesorería</CardTitle>
                  <CardDescription>Listado general de cuentas activas.</CardDescription>
                </div>
                <Button onClick={openCreateForm}>Nueva cuenta</Button>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[520px]">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted/60 text-left text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-medium">Nombre</th>
                        <th className="px-4 py-3 font-medium">Tipo</th>
                        <th className="px-4 py-3 font-medium text-right">Saldo</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {loadingAccounts && (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                            Cargando cuentas...
                          </td>
                        </tr>
                      )}
                      {!loadingAccounts && accounts.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                            Aún no has registrado cuentas.
                          </td>
                        </tr>
                      )}
                      {!loadingAccounts &&
                        accounts.map((account) => (
                          <tr
                            key={account.id}
                            className={cn(
                              "cursor-pointer border-t transition hover:bg-muted/70",
                              selectedAccount?.id === account.id && "bg-muted"
                            )}
                            onClick={() => setSelectedAccount(account)}
                          >
                            <td className="px-4 py-3">
                              <div className="font-medium">{account.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {account.description || "Sin descripción"}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={cn("capitalize", accountBadges[account.type])}>
                                {account.type === TreasuryAccountType.CASH
                                  ? "Caja"
                                  : account.type === TreasuryAccountType.BANK
                                    ? "Banco"
                                    : "Digital"}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold">
                              {PEN.format(account.currentBalance)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex gap-2">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openEditForm(account);
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setConfirmDelete(account);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalle de cuenta</CardTitle>
                <CardDescription>
                  Registra ingresos o egresos manuales y revisa los últimos movimientos de la cuenta seleccionada.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedAccount ? (
                  <>
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Saldo actual</p>
                          <p className="text-2xl font-semibold">{PEN.format(selectedAccount.currentBalance)}</p>
                        </div>
                        <Badge>{selectedAccount.type}</Badge>
                      </div>
                      {selectedAccount.description && (
                        <p className="mt-2 text-sm text-muted-foreground">{selectedAccount.description}</p>
                      )}
                    </div>

                    <form onSubmit={handleManualMovement} className="rounded-lg border p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">Registrar movimiento manual</p>
                        <div className="flex gap-2 text-xs">
                          <Button
                            type="button"
                            variant={movementForm.watch("income") ? "default" : "outline"}
                            onClick={() => movementForm.setValue("income", true)}
                          >
                            Ingreso
                          </Button>
                          <Button
                            type="button"
                            variant={!movementForm.watch("income") ? "default" : "outline"}
                            onClick={() => movementForm.setValue("income", false)}
                          >
                            Egreso
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <Label>Monto</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            {...movementForm.register("amount", { valueAsNumber: true })}
                          />
                          <p className="text-xs text-muted-foreground">
                            Se registrará como {movementForm.watch("income") ? "ingreso" : "egreso"}.
                          </p>
                        </div>
                        <div>
                          <Label>Descripción</Label>
                          <Input placeholder="Ej. Ajuste manual" {...movementForm.register("description")} />
                        </div>
                      </div>
                      <Button type="submit" disabled={movementForm.formState.isSubmitting}>
                        {movementForm.formState.isSubmitting ? "Registrando..." : "Guardar movimiento"}
                      </Button>
                    </form>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">Últimos movimientos</p>
                        <div className="text-sm text-muted-foreground">
                          Página {movementPage + 1} de {Math.max(movementTotalPages, 1)}
                        </div>
                      </div>

                      <div className="rounded-lg border">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="px-4 py-2 text-left font-medium">Fecha</th>
                              <th className="px-4 py-2 text-left font-medium">Descripción</th>
                              <th className="px-4 py-2 text-left font-medium">Tipo</th>
                              <th className="px-4 py-2 text-right font-medium">Monto</th>
                            </tr>
                          </thead>
                          <tbody>
                            {movementLoading && (
                              <tr>
                                <td colSpan={4} className="px-4 py-4 text-center text-muted-foreground">
                                  Cargando movimientos...
                                </td>
                              </tr>
                            )}
                            {!movementLoading && movements.length === 0 && (
                              <tr>
                                <td colSpan={4} className="px-4 py-4 text-center text-muted-foreground">
                                  No hay movimientos.
                                </td>
                              </tr>
                            )}
                            {!movementLoading &&
                              movements.map((movement) => (
                                <tr key={movement.id} className="border-t">
                                  <td className="px-4 py-2">{DATE_TIME.format(new Date(movement.movementDate))}</td>
                                  <td className="px-4 py-2">
                                    <div>{movement.description || "Sin descripción"}</div>
                                    <div className="text-xs text-muted-foreground">{movement.reference ?? ""}</div>
                                  </td>
                                  <td className="px-4 py-2 capitalize">{movement.movementType.replace(/_/g, " ").toLowerCase()}</td>
                                  <td
                                    className={cn(
                                      "px-4 py-2 text-right font-medium",
                                      movement.amount >= 0 ? "text-emerald-600" : "text-red-600"
                                    )}
                                  >
                                    {PEN.format(movement.amount)}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={movementPage === 0 || movementLoading}
                          onClick={() => loadMovements(selectedAccount.id, movementPage - 1)}
                        >
                          Anterior
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={movementPage + 1 >= movementTotalPages || movementLoading}
                          onClick={() => loadMovements(selectedAccount.id, movementPage + 1)}
                        >
                          Siguiente
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg border bg-muted/30 p-6 text-center text-muted-foreground">
                    Selecciona una cuenta para ver el detalle.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{formMode === "create" ? "Nueva cuenta" : "Editar cuenta"}</DialogTitle>
            <DialogDescription>Completa los datos básicos de la cuenta de tesorería.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAccountSubmit} className="space-y-4">
            <div>
              <Label>Nombre</Label>
              <Input placeholder="Ej. BCP Soles" {...accountForm.register("name")} />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={accountForm.watch("type") ?? TreasuryAccountType.CASH} onValueChange={(value: TreasuryAccountType) => accountForm.setValue("type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TreasuryAccountType.CASH}>Caja</SelectItem>
                  <SelectItem value={TreasuryAccountType.BANK}>Banco</SelectItem>
                  <SelectItem value={TreasuryAccountType.DIGITAL}>Digital</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descripción</Label>
              <Input placeholder="Opcional" {...accountForm.register("description")} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={accountForm.formState.isSubmitting}>
                {accountForm.formState.isSubmitting ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(confirmDelete)} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar cuenta?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Solo se permiten eliminar cuentas sin movimientos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleDeleteAccount} variant="destructive">
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayoutSection>
  );
}
