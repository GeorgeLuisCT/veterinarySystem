"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, PlusCircle, Edit, Power, Trash2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";

import VehicleService from "../../services/vehicle-service";
import { VehicleResponse } from "../../types/vehicle-response";
import { createVehicleSchema, CreateVehicleRequest, updateVehicleSchema, UpdateVehicleRequest } from "../../types/vehicle-request";
import { EmployeeService } from "@/app/dashboard/staff/service/employee-service";
import { EmployeeQuickSearchResponse } from "@/app/dashboard/staff/types/employee-quick-search-response";
import { BranchService } from "@/app/dashboard/branche/services/branch-service";
import { BranchResponse } from "@/app/dashboard/branche/types/branch-response";

export default function VehicleManagementPage() {
  const { toast } = useToast();
  const [vehicles, setVehicles] = React.useState<VehicleResponse[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [modalState, setModalState] = React.useState<{ mode: 'create' | 'edit'; vehicle?: VehicleResponse } | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState<VehicleResponse | null>(null);
  const [busyVehicleId, setBusyVehicleId] = React.useState<number | null>(null);

  const loadVehicles = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await VehicleService.list();
      setVehicles(response);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: getAaxiosErrorMessage(error) ?? "No se pudieron obtener los vehículos." });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  const handleToggleActive = async (vehicle: VehicleResponse) => {
    setBusyVehicleId(vehicle.id);
    try {
      await VehicleService.update(vehicle.id, {
        name: vehicle.name,
        licensePlate: vehicle.licensePlate ?? undefined,
        assignedVetEmployeeId: vehicle.assignedVetEmployeeId ?? undefined,
        homeBranchId: vehicle.homeBranchId ?? undefined,
        active: !vehicle.active,
      });
      toast({ title: 'Vehículo actualizado', description: `${vehicle.name} ahora está ${vehicle.active ? 'inactivo' : 'activo'}.` });
      loadVehicles();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: getAaxiosErrorMessage(error) ?? "No se pudo actualizar el vehículo." });
    } finally {
      setBusyVehicleId(null);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setBusyVehicleId(pendingDelete.id);
    try {
      await VehicleService.delete(pendingDelete.id);
      toast({ title: 'Vehículo eliminado', description: `${pendingDelete.name} fue eliminado.` });
      setPendingDelete(null);
      loadVehicles();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: getAaxiosErrorMessage(error) ?? "No se pudo eliminar el vehículo." });
    } finally {
      setBusyVehicleId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>Vehículos de campo</CardTitle>
          <CardDescription>Gestiona los vehículos asignados al equipo veterinario.</CardDescription>
        </div>
        <Button onClick={() => setModalState({ mode: 'create' })}>
          <PlusCircle className="mr-2 h-4 w-4" /> Nuevo vehículo
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando vehículos…
          </div>
        ) : vehicles.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay vehículos registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b">
                  <th className="py-2 pr-4">Nombre</th>
                  <th className="py-2 pr-4">Placa</th>
                  <th className="py-2 pr-4">Veterinario asignado</th>
                  <th className="py-2 pr-4">Sucursal base</th>
                  <th className="py-2 pr-4">Estado</th>
                  <th className="py-2 pr-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{vehicle.name}</td>
                    <td className="py-2 pr-4">{vehicle.licensePlate ?? '—'}</td>
                    <td className="py-2 pr-4">{vehicle.assignedVetName ?? '—'}</td>
                    <td className="py-2 pr-4">{vehicle.homeBranchName ?? '—'}</td>
                    <td className="py-2 pr-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ${vehicle.active ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                        {vehicle.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-2 pr-0">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setModalState({ mode: 'edit', vehicle })}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(vehicle)}
                          disabled={busyVehicleId === vehicle.id}
                          title={vehicle.active ? 'Desactivar' : 'Activar'}
                        >
                          <Power className={`h-4 w-4 ${vehicle.active ? 'text-orange-500' : ''}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPendingDelete(vehicle)}
                          disabled={busyVehicleId === vehicle.id}
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <Dialog open={modalState !== null} onOpenChange={(open) => !open && setModalState(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{modalState?.mode === 'edit' ? 'Editar vehículo' : 'Nuevo vehículo'}</DialogTitle>
            <DialogDescription>Define los datos del vehículo y sus asignaciones.</DialogDescription>
          </DialogHeader>
          {modalState && (
            <VehicleForm
              vehicle={modalState.vehicle}
              onCancel={() => setModalState(null)}
              onSuccess={(vehicle) => {
                setModalState(null);
                toast({ title: 'Vehículo guardado', description: `${vehicle.name} está actualizado.` });
                loadVehicles();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar vehículo</DialogTitle>
            <DialogDescription>
              Esta acción eliminará el vehículo <strong>{pendingDelete?.name}</strong>. ¿Deseas continuar?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPendingDelete(null)} disabled={busyVehicleId === pendingDelete?.id}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={busyVehicleId === pendingDelete?.id}>
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function VehicleForm({ vehicle, onCancel, onSuccess }: { vehicle?: VehicleResponse; onCancel: () => void; onSuccess: (vehicle: VehicleResponse) => void }) {
  const isEdit = !!vehicle;
  const schema = React.useMemo(() => (isEdit ? updateVehicleSchema : createVehicleSchema), [isEdit]);
  const form = useForm<CreateVehicleRequest | UpdateVehicleRequest>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      licensePlate: '',
      assignedVetEmployeeId: undefined,
      homeBranchId: undefined,
      active: true,
    },
  });
  const { toast } = useToast();
  const [submitting, setSubmitting] = React.useState(false);
  const [employeeOptions, setEmployeeOptions] = React.useState<EmployeeQuickSearchResponse[]>([]);
  const [branchOptions, setBranchOptions] = React.useState<BranchResponse[]>([]);

  React.useEffect(() => {
    if (!isEdit || !vehicle) return;
    form.reset({
      name: vehicle.name,
      licensePlate: vehicle.licensePlate ?? '',
      assignedVetEmployeeId: vehicle.assignedVetEmployeeId ?? undefined,
      homeBranchId: vehicle.homeBranchId ?? undefined,
      active: vehicle.active,
    });
    if (vehicle.assignedVetEmployeeId && vehicle.assignedVetName) {
      setEmployeeOptions([{ id: vehicle.assignedVetEmployeeId, name: vehicle.assignedVetName, documentNumber: '' } as any]);
    }
    if (vehicle.homeBranchId && vehicle.homeBranchName) {
      setBranchOptions([{ id: vehicle.homeBranchId, name: vehicle.homeBranchName, location: '' }]);
    }
  }, [isEdit, vehicle, form]);

  const handleSearchEmployees = React.useCallback(async (query: string) => {
    try {
      const resp = await EmployeeService.searchEmployees(query.trim());
      setEmployeeOptions(resp);
    } catch {
      setEmployeeOptions([]);
    }
  }, []);

  const handleSearchBranches = React.useCallback(async (query: string) => {
    try {
      const resp = await BranchService.getBranches(query);
      setBranchOptions(resp);
    } catch {
      setBranchOptions([]);
    }
  }, []);

  const onSubmit = async (data: CreateVehicleRequest | UpdateVehicleRequest) => {
    setSubmitting(true);
    try {
      const payload = { ...data, licensePlate: data.licensePlate?.trim() || undefined };
      const response = isEdit && vehicle ? await VehicleService.update(vehicle.id, payload as UpdateVehicleRequest) : await VehicleService.create(payload as CreateVehicleRequest);
      onSuccess(response);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: getAaxiosErrorMessage(error) ?? "No se pudo guardar el vehículo." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form {...(form as any)}>
      <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <FloatingLabelInput id="name" label="Nombre" value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="licensePlate"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <FloatingLabelInput id="licensePlate" label="Placa" value={(field.value as string) ?? ''} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="assignedVetEmployeeId"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <FloatingLabelSelect
                  id="assignedVetEmployeeId"
                  label="Veterinario asignado"
                  value={field.value ? String(field.value) : ''}
                  onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}
                  options={employeeOptions.map((emp) => ({ value: String(emp.id), label: emp.fullName }))}
                  onSearch={handleSearchEmployees}
                  emptyMessage="Sin resultados"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="homeBranchId"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <FloatingLabelSelect
                  id="homeBranchId"
                  label="Sucursal base"
                  value={field.value ? String(field.value) : ''}
                  onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}
                  options={branchOptions.map((branch) => ({ value: String(branch.id), label: branch.name }))}
                  onSearch={handleSearchBranches}
                  emptyMessage="Sin resultados"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="active"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <div>
                  <div className="text-sm font-medium">Vehículo activo</div>
                  <p className="text-xs text-muted-foreground">Controla si el vehículo está disponible para asignaciones.</p>
                </div>
                <Switch checked={field.value ?? true} onCheckedChange={field.onChange} />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Guardar
          </Button>
        </div>
      </form>
    </Form>
  );
}
