"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ban, Loader2, Pencil, PlusCircle, RotateCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import DashboardLayoutSection from "@/app/dashboard/dashboard-layout-section";
import { categoryService } from "@/app/dashboard/inventory/_service/category-product-service";
import { categorySchema, type CategoryProductRequest } from "@/app/dashboard/inventory/_types/category-product-request";
import type { CategoryProductResponse } from "@/app/dashboard/inventory/_types/category-product-response";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import DataTable, { type Action } from "@/components/data-table";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { PageContainer } from "@/components/page/page-container";
import { PageHeader } from "@/components/page/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SETTINGS_URL } from "@/config/settings";
import { getAaxiosErrorMessage } from "@/helpers/error";
import type { PaginatedResponse } from "@/types/paginated-response";

type Row = CategoryProductResponse;
type StatusFilter = "all" | "active" | "inactive";
type Pending = { kind: "deactivate" | "delete"; row: Row } | null;

const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Categorías de productos. La API devuelve la lista completa, así que la búsqueda, el filtro y la paginación son locales. */
export default function ProductCategoriesPage() {
  const [categories, setCategories] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);

  const [editing, setEditing] = React.useState<Row | "new" | null>(null);
  const [pending, setPending] = React.useState<Pending>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data: Row[] = await categoryService.getAll();
      setCategories([...data].sort((a, b) => a.name.localeCompare(b.name, "es")));
    } catch (error) {
      toast.error(getAaxiosErrorMessage(error) || "No se pudieron cargar las categorías");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const filtered = React.useMemo(() => {
    const q = normalize(search.trim());
    return categories.filter(
      (c) =>
        (status === "all" || (status === "active" ? c.active : !c.active)) && (!q || normalize(c.name).includes(q))
    );
  }, [categories, search, status]);

  const pageData: PaginatedResponse<Row> = React.useMemo(
    () => ({
      content: filtered.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
      totalElements: filtered.length,
      totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
      pageSize,
      currentPage: pageIndex,
    }),
    [filtered, pageIndex, pageSize]
  );

  const run = async (action: () => Promise<unknown>, success: string) => {
    try {
      await action();
      toast.success(success);
      await load();
    } catch (error) {
      toast.error(getAaxiosErrorMessage(error) || "No se pudo completar la acción");
    }
  };

  const columns: ColumnDef<Row>[] = React.useMemo(
    () => [
      { accessorKey: "name", header: "Nombre", cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
      {
        id: "status",
        header: "Estado",
        cell: ({ row }) => (
          <Badge variant="outline" className={row.original.active ? "text-success-strong" : "text-muted-foreground"}>
            {row.original.active ? "Activa" : "Inactiva"}
          </Badge>
        ),
      },
    ],
    []
  );

  const actions: Action<Row>[] = [
    { label: "Editar", type: "direct", icon: <Pencil className="h-4 w-4" />, onClick: (row) => setEditing(row) },
    {
      label: "Desactivar",
      type: "dropdown",
      icon: <Ban className="h-4 w-4 text-red-500" />,
      isVisible: (row) => row.active,
      onClick: (row) => setPending({ kind: "deactivate", row }),
    },
    {
      label: "Activar",
      type: "dropdown",
      icon: <RotateCw className="h-4 w-4" />,
      isVisible: (row) => !row.active,
      onClick: (row) => void run(() => categoryService.restore(row.id), "Categoría activada"),
    },
    {
      label: "Eliminar",
      type: "dropdown",
      icon: <Trash2 className="h-4 w-4 text-red-500" />,
      onClick: (row) => setPending({ kind: "delete", row }),
    },
  ];

  return (
    <DashboardLayoutSection>
      <PageContainer>
        <PageHeader
          backHref={SETTINGS_URL}
          backLabel="Configuración"
          title="Categorías de productos"
          description="Las categorías con las que se agrupan y filtran los productos del inventario."
          actions={
            <Button onClick={() => setEditing("new")}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nueva categoría
            </Button>
          }
        />

        <DataTable<Row>
          pageData={pageData}
          columns={columns}
          actions={actions}
          loading={loading}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPageIndexChange={setPageIndex}
          onPageSizeChange={(size) => {
            setPageIndex(0);
            setPageSize(size);
          }}
          onSearch={(q) => {
            setPageIndex(0);
            setSearch(q);
          }}
          searchPlaceholder="Buscar categoría..."
          headerSlotLeft={
            <Select
              value={status}
              onValueChange={(v) => {
                setPageIndex(0);
                setStatus(v as StatusFilter);
              }}
            >
              <SelectTrigger className="w-40" aria-label="Estado">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="active">Activas</SelectItem>
                <SelectItem value="inactive">Inactivas</SelectItem>
              </SelectContent>
            </Select>
          }
          getRowKey={(row) => row.id}
          emptyState={<span className="text-muted-foreground">No hay categorías que coincidan.</span>}
        />

        <CategoryDialog
          category={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await load();
          }}
        />

        <ConfirmationDialog
          open={pending !== null}
          onClose={() => setPending(null)}
          title={pending?.kind === "delete" ? "¿Eliminar categoría?" : "¿Desactivar categoría?"}
          description={
            pending?.kind === "delete" ? (
              <span>
                Se eliminará <strong>{pending.row.name}</strong> de forma definitiva. Si tiene productos asociados, mejor
                desactívala.
              </span>
            ) : (
              <span>
                <strong>{pending?.row.name}</strong> dejará de ofrecerse al registrar productos. Podrás activarla de nuevo.
              </span>
            )
          }
          confirmText={pending?.kind === "delete" ? "Eliminar" : "Desactivar"}
          confirmVariant="destructive"
          onConfirm={() => {
            if (!pending) return;
            const { kind, row } = pending;
            setPending(null);
            void (kind === "delete"
              ? run(() => categoryService.hardDelete(row.id), "Categoría eliminada")
              : run(() => categoryService.softDelete(row.id), "Categoría desactivada"));
          }}
        />
      </PageContainer>
    </DashboardLayoutSection>
  );
}

/** Crear o renombrar una categoría. */
function CategoryDialog({
  category,
  onClose,
  onSaved,
}: {
  category: Row | "new" | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const isNew = category === "new";
  const form = useForm<CategoryProductRequest>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "" },
  });

  React.useEffect(() => {
    if (category) form.reset({ name: category === "new" ? "" : category.name });
  }, [category, form]);

  const onSubmit = async ({ name }: CategoryProductRequest) => {
    try {
      if (category === "new") await categoryService.save({ name: name.trim() });
      else if (category) await categoryService.updateName(category.id, name.trim());
      toast.success(isNew ? "Categoría creada" : "Categoría actualizada");
      await onSaved();
    } catch (error) {
      form.setError("name", { message: getAaxiosErrorMessage(error) || "No se pudo guardar la categoría" });
    }
  };

  return (
    <Dialog open={category !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isNew ? "Nueva categoría" : "Editar categoría"}</DialogTitle>
          <DialogDescription>
            {isNew ? "Crea una categoría para organizar mejor tus productos." : "Cambia el nombre de la categoría."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelInput id="category-name" label="Nombre" value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={form.formState.isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
