"use client";

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form';
import { FloatingLabelInput } from '@/components/floating-label-input';
import { FloatingLabelSelect } from '@/components/floating-label-select';
import { useToast } from '@/hooks/use-toast';

import { CustomerService } from '@/app/dashboard/customer/management/service/customer-service';
import { CustomerQuickSearchResponse } from '@/app/dashboard/customer/management/types/customer-quick-search-response';
import { GeoZoneService } from '../services/geo-zone-service';
import { GeoZoneSummaryResponse } from '../types/geo-zone-response';
import { FarmResponse } from '../types/farm-response';
import { CreateFarmRequest, UpdateFarmRequest, createFarmSchema, updateFarmSchema } from '../types/farm-request';
import { FarmService } from '../services/farm-service';

interface Props {
  setOpen: (open: boolean) => void;
  farmId?: number;
  onSuccess?: (farm: FarmResponse) => void;
}

export default function FarmForm({ setOpen, farmId, onSuccess }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState<boolean>(!!farmId);
  const [customerOptions, setCustomerOptions] = React.useState<CustomerQuickSearchResponse[]>([]);
  const [zoneOptions, setZoneOptions] = React.useState<GeoZoneSummaryResponse[]>([]);

  const schema = farmId ? updateFarmSchema : createFarmSchema;
  const form = useForm<CreateFarmRequest | UpdateFarmRequest>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerId: undefined as unknown as number,
      name: '',
      zoneId: undefined,
      locationDescription: undefined,
      gpsCoordinates: undefined,
      addressLabel: undefined,
    },
  });

  React.useEffect(() => {
    async function load() {
      if (!farmId) return;
      setLoading(true);
      try {
        const data = await FarmService.get(farmId);
        form.reset({
          customerId: (data.customerId ?? 0) as number,
          name: data.name ?? '',
          zoneId: data.zoneId ?? undefined,
          locationDescription: data.locationDescription ?? undefined,
          gpsCoordinates: data.gpsCoordinates ?? undefined,
          addressLabel: data.addressLabel ?? undefined,
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [farmId, form]);

  const handleSearchCustomer = React.useCallback(async (name: string) => {
    const resp = await CustomerService.searchCustomers(name);
    setCustomerOptions(resp);
  }, []);

  const handleSearchZone = React.useCallback(async (q: string) => {
    const resp = await GeoZoneService.list({ q, size: 10, page: 0 });
    setZoneOptions(resp.content);
  }, []);

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);
      const normalized = {
        ...data,
        name: String(data.name ?? '').trim(),
      } as CreateFarmRequest;
      const resp = farmId
        ? await FarmService.update(farmId, normalized)
        : await FarmService.create(normalized);
      onSuccess?.(resp);
      setOpen(false);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e?.message ?? 'No se pudo guardar la granja.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form className='space-y-3' onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <FloatingLabelInput id='name' label='Nombre' value={field.value as string} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
          <FormField
            control={form.control}
            name='customerId'
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FloatingLabelSelect
                    id='customerId'
                    label='Cliente'
                    value={String(field.value ?? '')}
                    onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}
                    options={customerOptions.map((c) => ({ value: String(c.id), label: `${c.name} *(${c.documentNumber})*` }))}
                    onSearch={handleSearchCustomer}
                    emptyMessage='Sin resultados'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='zoneId'
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FloatingLabelSelect
                    id='zoneId'
                    label='Zona (opcional)'
                    value={String(field.value ?? '')}
                    onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}
                    options={zoneOptions.map((z) => ({ value: String(z.id), label: `${z.name}${z.parentName ? ` – ${z.parentName}` : ''}` }))}
                    onSearch={handleSearchZone}
                    emptyMessage='Sin resultados'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name='locationDescription'
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <FloatingLabelInput id='locationDescription' label='Descripción de ubicación' value={(field.value as string) ?? ''} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
          <FormField
            control={form.control}
            name='gpsCoordinates'
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FloatingLabelInput id='gpsCoordinates' label='Coordenadas GPS' value={(field.value as string) ?? ''} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='addressLabel'
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FloatingLabelInput id='addressLabel' label='Etiqueta de dirección' value={(field.value as string) ?? ''} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className='flex justify-end gap-2 pt-2'>
          <Button type='button' variant='outline' onClick={() => setOpen(false)}>Cancelar</Button>
          <Button type='submit' disabled={loading}>
            {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}Guardar
          </Button>
        </div>
      </form>
    </Form>
  );
}

