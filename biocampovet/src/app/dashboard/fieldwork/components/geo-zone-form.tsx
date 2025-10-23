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

import { GeoZoneService } from '../services/geo-zone-service';
import { GeoZoneResponse, GeoZoneSummaryResponse } from '../types/geo-zone-response';
import { CreateGeoZoneRequest, UpdateGeoZoneRequest, createGeoZoneSchema, updateGeoZoneSchema } from '../types/geo-zone-request';

interface Props {
  setOpen: (open: boolean) => void;
  zoneId?: number;
  onSuccess?: (zone: GeoZoneResponse) => void;
}

export default function GeoZoneForm({ setOpen, zoneId, onSuccess }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState<boolean>(!!zoneId);
  const [parentOptions, setParentOptions] = React.useState<GeoZoneSummaryResponse[]>([]);

  const schema = zoneId ? updateGeoZoneSchema : createGeoZoneSchema;
  const form = useForm<CreateGeoZoneRequest | UpdateGeoZoneRequest>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      type: 'SECTOR' as any,
      parentId: undefined,
      gpsCoordinates: undefined,
      active: true,
    },
  });

  React.useEffect(() => {
    async function load() {
      if (!zoneId) return;
      setLoading(true);
      try {
        const data = await GeoZoneService.get(zoneId);
        form.reset({
          name: data.name,
          type: data.type as any,
          parentId: data.parentId ?? undefined,
          gpsCoordinates: data.gpsCoordinates ?? undefined,
          active: data.active,
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [zoneId, form]);

  const handleSearchParent = React.useCallback(async (q: string) => {
    const resp = await GeoZoneService.list({ q, size: 10, page: 0 });
    setParentOptions(resp.content);
  }, []);

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);
      const normalized = {
        ...data,
        name: String(data.name ?? '').trim(),
      } as CreateGeoZoneRequest;
      const resp = zoneId
        ? await GeoZoneService.update(zoneId, normalized)
        : await GeoZoneService.create(normalized);
      onSuccess?.(resp);
      setOpen(false);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e?.message ?? 'No se pudo guardar la zona.' });
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

        <FormField
          control={form.control}
          name='type'
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <FloatingLabelSelect
                  id='type'
                  label='Tipo'
                  value={String(field.value)}
                  onValueChange={field.onChange}
                  options={[
                    { value: 'COUNTRY', label: 'País' },
                    { value: 'REGION', label: 'Región' },
                    { value: 'PROVINCE', label: 'Provincia' },
                    { value: 'DISTRICT', label: 'Distrito' },
                    { value: 'SECTOR', label: 'Sector' },
                    { value: 'CUSTOM', label: 'Personalizado' },
                  ]}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='parentId'
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <FloatingLabelSelect
                  id='parentId'
                  label='Zona padre (opcional)'
                  value={String(field.value ?? '')}
                  onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}
                  options={parentOptions.map((z) => ({ value: String(z.id), label: `${z.name}${z.parentName ? ` – ${z.parentName}` : ''}` }))}
                  onSearch={handleSearchParent}
                  emptyMessage='Sin resultados'
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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

