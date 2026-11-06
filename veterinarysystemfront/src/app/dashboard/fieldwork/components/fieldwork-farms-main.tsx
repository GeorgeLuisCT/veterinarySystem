"use client";

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import DataTable from '@/components/data-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { PaginatedResponse } from '@/types/paginated-response';
import { GeoZoneListParams, GeoZoneSummaryResponse } from '../types/geo-zone-response';
import { FarmListParams, FarmSummaryResponse } from '../types/farm-response';
import { GeoZoneService } from '../services/geo-zone-service';
import { FarmService } from '../services/farm-service';
import GeoZoneForm from './geo-zone-form';
import FarmForm from './farm-form';
import { GeoZoneType, GeoZoneTypeLabels } from '../enums/geo-zone-type';

type TabKey = 'zones' | 'farms';

export default function FieldworkFarmsMain() {
  const [tab, setTab] = React.useState<TabKey>('zones');
  return (
    <div className='flex h-full flex-col gap-3'>
        <div className='inline-flex rounded-md border'>
          <Button variant={tab === 'zones' ? 'default' : 'ghost'} className='rounded-r-none' onClick={() => setTab('zones')}>Zonas</Button>
          <Button variant={tab === 'farms' ? 'default' : 'ghost'} className='rounded-l-none' onClick={() => setTab('farms')}>Granjas</Button>
        </div>
        
        {tab === 'zones' ? <ZonesTable /> : <FarmsTable />}
      
      </div>
  );
}

function usePaged<T, P extends { page?: number; size?: number }>(fetcher: (params: P) => Promise<PaginatedResponse<T>>) {
  const fetcherRef = React.useRef(fetcher);
  fetcherRef.current = fetcher;

  const [pageData, setPageData] = React.useState<PaginatedResponse<T> | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);

  const load = React.useCallback(async (params: P) => {
    setLoading(true);
    try {
      const resp = await fetcherRef.current(params);
      setPageData(resp);
    } finally {
      setLoading(false);
    }
  }, []);

  return { pageData, loading, pageIndex, setPageIndex, pageSize, setPageSize, load };
}

function ZonesTable() {
  const { toast } = useToast();
  const [q, setQ] = React.useState<string>('');
  const [type, setType] = React.useState<string>('ALL');
  const [active, setActive] = React.useState<string>('ALL');

  const { pageData, loading, pageIndex, setPageIndex, pageSize, setPageSize, load } = usePaged<GeoZoneSummaryResponse, GeoZoneListParams>(
    GeoZoneService.list
  );

  const params = React.useMemo<GeoZoneListParams>(() => ({
    page: pageIndex,
    size: pageSize,
    q: q || undefined,
    type: (type === 'ALL' ? undefined : (type as GeoZoneType)),
    active: active === 'ALL' ? undefined : active === 'true',
  }), [pageIndex, pageSize, q, type, active]);

  React.useEffect(() => {
    load(params);
  }, [load, params]);

  const [activeModal, setActiveModal] = React.useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = React.useState<GeoZoneSummaryResponse | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState<GeoZoneSummaryResponse | null>(null);

  const columns = React.useMemo<ColumnDef<GeoZoneSummaryResponse>[]>(() => [
    { accessorKey: 'name', header: 'Nombre' },
    {
      accessorKey: 'type',
      header: 'Tipo',
      cell: ({ row }) => GeoZoneTypeLabels[row.original.type as GeoZoneType] ?? row.original.type,
    },
    { accessorKey: 'parentName', header: 'Padre', cell: ({ row }) => row.original.parentName ?? '—' },
    { accessorKey: 'active', header: 'Activo', cell: ({ row }) => (row.original.active ? 'Sí' : 'No') },
  ], []);

  const actions = React.useMemo(() => [
    { label: 'Editar', type: 'direct' as const, icon: <Edit className='h-4 w-4' />, onClick: (row: GeoZoneSummaryResponse) => { setSelected(row); setActiveModal('edit'); } },
    { label: 'Eliminar', icon: <Trash2 className='h-4 w-4' />, onClick: (row: GeoZoneSummaryResponse) => setPendingDelete(row) },
  ], []);

  const onSearch = (query: string) => { setQ(query); setPageIndex(0); };

  const headerRight = (
    <div className='flex flex-wrap items-center gap-2'>
      <Select
        value={type}
        onValueChange={(val) => { setType(val); setPageIndex(0); }}
      >
        <SelectTrigger className='w-56'>
          <SelectValue placeholder='Tipo de zona' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='ALL'>Todos</SelectItem>
          {(Object.values(GeoZoneType) as GeoZoneType[]).map((t) => (
            <SelectItem key={t} value={t}>{GeoZoneTypeLabels[t]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={active}
        onValueChange={(val) => { setActive(val); setPageIndex(0); }}
      >
        <SelectTrigger className='w-40'>
          <SelectValue placeholder='Estado' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='ALL'>Todos</SelectItem>
          <SelectItem value='true'>Activos</SelectItem>
          <SelectItem value='false'>Inactivos</SelectItem>
        </SelectContent>
      </Select>

      <Button onClick={() => { setSelected(null); setActiveModal('create'); }}>
        <PlusCircle className='mr-2 h-4 w-4' />Nueva zona
      </Button>
    </div>
  );

  return (
    <>
      <DataTable<GeoZoneSummaryResponse>
        pageData={pageData}
        columns={columns}
        actions={actions}
        loading={loading}
        onSearch={onSearch}
        pageIndex={pageIndex}
        pageSize={pageSize}
        onPageIndexChange={setPageIndex}
        onPageSizeChange={setPageSize}
        searchPlaceholder='Buscar por nombre…'
        getRowKey={(row) => row.id}
        headerSlotRight={headerRight}
      />

      <Dialog open={activeModal === 'create'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>Nueva zona</DialogTitle>
            <DialogDescription>Registra una nueva zona geográfica.</DialogDescription>
          </DialogHeader>
          <GeoZoneForm setOpen={() => setActiveModal(null)} onSuccess={() => load(params)} />
        </DialogContent>
      </Dialog>

      <Dialog open={activeModal === 'edit'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>Editar zona</DialogTitle>
            <DialogDescription>Actualiza la información de la zona.</DialogDescription>
          </DialogHeader>
          {selected && (
            <GeoZoneForm setOpen={() => setActiveModal(null)} zoneId={selected.id} onSuccess={() => load(params)} />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title='¿Eliminar zona?'
        description={<span>Esta acción eliminará <strong>{pendingDelete?.name}</strong>.</span>}
        confirmText='Eliminar'
        confirmVariant='destructive'
        onConfirm={async () => {
          if (!pendingDelete) return;
          try { await GeoZoneService.delete(pendingDelete.id); } catch { toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar.' }); }
          setPendingDelete(null);
          load(params);
        }}
      />
    </>
  );
}

function FarmsTable() {
  const { toast } = useToast();
  const [q, setQ] = React.useState<string>('');

  const { pageData, loading, pageIndex, setPageIndex, pageSize, setPageSize, load } = usePaged<FarmSummaryResponse, FarmListParams>(
    FarmService.list
  );

  const params = React.useMemo<FarmListParams>(() => ({
    page: pageIndex,
    size: pageSize,
    q: q || undefined,
  }), [pageIndex, pageSize, q]);

  React.useEffect(() => {
    load(params);
  }, [load, params]);

  const [activeModal, setActiveModal] = React.useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = React.useState<FarmSummaryResponse | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState<FarmSummaryResponse | null>(null);

  const columns = React.useMemo<ColumnDef<FarmSummaryResponse>[]>(() => [
    { accessorKey: 'name', header: 'Nombre' },
    { accessorKey: 'customerName', header: 'Cliente', cell: ({ row }) => row.original.customerName ?? '—' },
    { accessorKey: 'zoneName', header: 'Zona', cell: ({ row }) => row.original.zoneName ?? '—' },
  ], []);

  const actions = React.useMemo(() => [
    { label: 'Editar', type: 'direct' as const, icon: <Edit className='h-4 w-4' />, onClick: (row: FarmSummaryResponse) => { setSelected(row); setActiveModal('edit'); } },
    { label: 'Eliminar', icon: <Trash2 className='h-4 w-4' />, onClick: (row: FarmSummaryResponse) => setPendingDelete(row) },
  ], []);

  const onSearch = (query: string) => { setQ(query); setPageIndex(0); };

  const headerRight = (
    <div>
      <Button onClick={() => { setSelected(null); setActiveModal('create'); }}><PlusCircle className='mr-2 h-4 w-4' />Nueva granja</Button>
    </div>
  );

  return (
    <>
      <DataTable<FarmSummaryResponse>
        pageData={pageData}
        columns={columns}
        actions={actions}
        loading={loading}
        onSearch={onSearch}
        pageIndex={pageIndex}
        pageSize={pageSize}
        onPageIndexChange={setPageIndex}
        onPageSizeChange={setPageSize}
        searchPlaceholder='Buscar por nombre o cliente…'
        getRowKey={(row) => row.id}
        headerSlotRight={headerRight}
      />

      <Dialog open={activeModal === 'create'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Nueva granja</DialogTitle>
            <DialogDescription>Registra una nueva finca/granja.</DialogDescription>
          </DialogHeader>
          <FarmForm setOpen={() => setActiveModal(null)} onSuccess={() => load(params)} />
        </DialogContent>
      </Dialog>

      <Dialog open={activeModal === 'edit'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Editar granja</DialogTitle>
            <DialogDescription>Actualiza la información de la granja.</DialogDescription>
          </DialogHeader>
          {selected && (
            <FarmForm setOpen={() => setActiveModal(null)} farmId={selected.id} onSuccess={() => load(params)} />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title='¿Eliminar granja?'
        description={<span>Esta acción eliminará <strong>{pendingDelete?.name}</strong>.</span>}
        confirmText='Eliminar'
        confirmVariant='destructive'
        onConfirm={async () => {
          if (!pendingDelete) return;
          try { await FarmService.delete(pendingDelete.id); } catch { toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar.' }); }
          setPendingDelete(null);
          load(params);
        }}
      />
    </>
  );
}
