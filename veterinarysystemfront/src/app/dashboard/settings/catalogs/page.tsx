"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, Ban, ListTree, Loader2, Pencil, PlusCircle, RotateCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import DashboardLayoutSection from "@/app/dashboard/dashboard-layout-section";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { PageContainer } from "@/components/page/page-container";
import { PageHeader } from "@/components/page/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SETTINGS_URL } from "@/config/settings";
import { useUser } from "@/context/user-context";
import { getAaxiosErrorMessage } from "@/helpers/error";
import { updateCatalog, type CatalogItem } from "@/lib/catalogs";
import { cn } from "@/lib/utils";
import CatalogService, { type CatalogSummary } from "@/services/catalog-service";

type Editing = { mode: "create" } | { mode: "edit"; item: CatalogItem } | null;
type Pending = { kind: "deactivate" | "delete"; item: CatalogItem } | null;

/** Catálogos editables: listas de negocio (especies, vías de administración…) que antes eran fijas en el código. */
export default function CatalogsSettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userInfo } = useUser();
  const roles: string[] = userInfo?.roles ?? [];
  const canEdit = roles.includes("ROLE_ADMIN") || roles.includes("ROLE_MANAGER");

  const [catalogs, setCatalogs] = React.useState<CatalogSummary[]>([]);
  const [items, setItems] = React.useState<CatalogItem[]>([]);
  const [loadingItems, setLoadingItems] = React.useState(false);
  const [busyId, setBusyId] = React.useState<number | null>(null);
  const [editing, setEditing] = React.useState<Editing>(null);
  const [pending, setPending] = React.useState<Pending>(null);

  const selectedKey = searchParams.get("catalogo") ?? catalogs[0]?.key ?? "";
  const selected = catalogs.find((c) => c.key === selectedKey);

  const loadCatalogs = React.useCallback(async () => {
    try {
      setCatalogs(await CatalogService.list());
    } catch (e) {
      toast.error(getAaxiosErrorMessage(e) || "No se pudieron cargar los catálogos");
    }
  }, []);

  const loadItems = React.useCallback(async (key: string) => {
    if (!key) return;
    setLoadingItems(true);
    try {
      const data = await CatalogService.items(key);
      setItems(data);
      updateCatalog(key, data); // el resto de la app ve el cambio sin recargar
    } catch (e) {
      toast.error(getAaxiosErrorMessage(e) || "No se pudieron cargar los valores");
    } finally {
      setLoadingItems(false);
    }
  }, []);

  React.useEffect(() => {
    void loadCatalogs();
  }, [loadCatalogs]);

  React.useEffect(() => {
    void loadItems(selectedKey);
  }, [selectedKey, loadItems]);

  const select = (key: string) => router.replace(`${SETTINGS_URL}/catalogs?catalogo=${key}`, { scroll: false });

  const refresh = async () => {
    await Promise.all([loadItems(selectedKey), loadCatalogs()]);
  };

  const run = async (id: number, action: () => Promise<unknown>, ok: string) => {
    setBusyId(id);
    try {
      await action();
      toast.success(ok);
      await refresh();
    } catch (e) {
      toast.error(getAaxiosErrorMessage(e) || "No se pudo completar la acción");
    } finally {
      setBusyId(null);
    }
  };

  const move = (item: CatalogItem, delta: number) => {
    const ids = items.map((i) => i.id);
    const from = ids.indexOf(item.id);
    const to = from + delta;
    if (to < 0 || to >= ids.length) return;
    [ids[from], ids[to]] = [ids[to], ids[from]];
    void run(item.id, () => CatalogService.reorder(selectedKey, ids), "Orden actualizado");
  };

  const groups = React.useMemo(() => {
    const map = new Map<string, CatalogSummary[]>();
    catalogs.forEach((c) => map.set(c.group, [...(map.get(c.group) ?? []), c]));
    return Array.from(map.entries());
  }, [catalogs]);

  return (
    <DashboardLayoutSection>
      <PageContainer>
        <PageHeader
          backHref={SETTINGS_URL}
          backLabel="Configuración"
          title="Catálogos"
          description="Las listas que se ofrecen al registrar datos. Puedes agregar valores, cambiar sus nombres, ordenarlos o dejar de ofrecerlos."
        />

        <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
          {/* Lista de catálogos */}
          <nav aria-label="Catálogos" className="space-y-5">
            {groups.map(([group, list]) => (
              <div key={group}>
                <p className="mb-1.5 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group}</p>
                <ul className="space-y-0.5">
                  {list.map((c) => (
                    <li key={c.key}>
                      <button
                        type="button"
                        onClick={() => select(c.key)}
                        className={cn(
                          "flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                          c.key === selectedKey ? "bg-primary/10 font-medium text-primary" : "hover:bg-muted"
                        )}
                      >
                        {c.title}
                        <span className="text-xs text-muted-foreground">{c.activeItems}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          {/* Valores del catálogo elegido */}
          <Card>
            <CardContent className="space-y-4">
              {selected ? (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="flex items-center gap-2 text-base font-semibold">
                        <ListTree className="h-4 w-4 text-primary" /> {selected.title}
                      </h2>
                      <p className="text-sm text-muted-foreground">{selected.description}</p>
                    </div>
                    {canEdit && (
                      <Button onClick={() => setEditing({ mode: "create" })}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Nuevo valor
                      </Button>
                    )}
                  </div>

                  <div className="relative overflow-x-auto rounded-lg border">
                    {loadingItems && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    )}
                    <Table>
                      <TableHeader className="bg-muted">
                        <TableRow>
                          {canEdit && <TableHead className="w-20">Orden</TableHead>}
                          <TableHead>Nombre</TableHead>
                          {selected.usesPlural && <TableHead>Plural</TableHead>}
                          {selected.usesAbbreviation && <TableHead>{selected.abbreviationLabel ?? "Abreviatura"}</TableHead>}
                          <TableHead>Estado</TableHead>
                          {canEdit && <TableHead className="w-32 text-center">Acciones</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item, index) => (
                          <TableRow key={item.id} className={cn(!item.active && "text-muted-foreground")}>
                            {canEdit && (
                              <TableCell>
                                <div className="flex">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    aria-label={`Subir ${item.label}`}
                                    disabled={index === 0 || busyId !== null}
                                    onClick={() => move(item, -1)}
                                  >
                                    <ArrowUp className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    aria-label={`Bajar ${item.label}`}
                                    disabled={index === items.length - 1 || busyId !== null}
                                    onClick={() => move(item, 1)}
                                  >
                                    <ArrowDown className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                            <TableCell>
                              <span className="font-medium text-foreground">{item.label}</span>
                              <span className="ml-2 font-mono text-[11px] text-muted-foreground" title="Código interno (no cambia)">
                                {item.code}
                              </span>
                            </TableCell>
                            {selected.usesPlural && <TableCell>{item.pluralLabel || "—"}</TableCell>}
                            {selected.usesAbbreviation && <TableCell>{item.abbreviation || "—"}</TableCell>}
                            <TableCell>
                              <Badge variant="outline" className={item.active ? "text-success-strong" : "text-muted-foreground"}>
                                {item.active ? "Activo" : "Inactivo"}
                              </Badge>
                            </TableCell>
                            {canEdit && (
                              <TableCell>
                                <div className="flex justify-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Editar"
                                    title="Editar"
                                    disabled={busyId !== null}
                                    onClick={() => setEditing({ mode: "edit", item })}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  {item.active ? (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      aria-label="Desactivar"
                                      title="Desactivar"
                                      disabled={busyId !== null}
                                      onClick={() => setPending({ kind: "deactivate", item })}
                                    >
                                      <Ban className="h-4 w-4 text-red-500" />
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      aria-label="Activar"
                                      title="Activar"
                                      disabled={busyId !== null}
                                      onClick={() =>
                                        void run(
                                          item.id,
                                          () => CatalogService.update(selectedKey, item.id, { ...toRequest(item), active: true }),
                                          "Valor activado"
                                        )
                                      }
                                    >
                                      <RotateCw className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Eliminar"
                                    title="Eliminar"
                                    disabled={busyId !== null}
                                    onClick={() => setPending({ kind: "delete", item })}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                        {!items.length && !loadingItems && (
                          <TableRow>
                            <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                              Este catálogo no tiene valores.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Los valores desactivados dejan de ofrecerse, pero los registros que ya los usan los conservan. Solo se puede
                    eliminar un valor que nadie usa.
                  </p>
                </>
              ) : (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Cargando catálogos…
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {selected && (
          <CatalogItemDialog
            catalog={selected}
            editing={editing}
            onClose={() => setEditing(null)}
            onSaved={async () => {
              setEditing(null);
              await refresh();
            }}
          />
        )}

        <ConfirmationDialog
          open={pending !== null}
          onClose={() => setPending(null)}
          title={pending?.kind === "delete" ? "¿Eliminar valor?" : "¿Desactivar valor?"}
          description={
            pending?.kind === "delete" ? (
              <span>
                Se eliminará <strong>{pending.item.label}</strong>. Si algún registro lo usa no se podrá eliminar; en ese caso,
                desactívalo.
              </span>
            ) : (
              <span>
                <strong>{pending?.item.label}</strong> dejará de ofrecerse en los formularios. Los registros que ya lo tienen lo
                conservan.
              </span>
            )
          }
          confirmText={pending?.kind === "delete" ? "Eliminar" : "Desactivar"}
          confirmVariant="destructive"
          onConfirm={() => {
            if (!pending) return;
            const { kind, item } = pending;
            setPending(null);
            void (kind === "delete"
              ? run(item.id, () => CatalogService.remove(selectedKey, item.id), "Valor eliminado")
              : run(item.id, () => CatalogService.update(selectedKey, item.id, { ...toRequest(item), active: false }), "Valor desactivado"));
          }}
        />
      </PageContainer>
    </DashboardLayoutSection>
  );
}

const toRequest = (item: CatalogItem) => ({
  label: item.label,
  pluralLabel: item.pluralLabel,
  abbreviation: item.abbreviation,
  active: item.active,
});

function CatalogItemDialog({
  catalog,
  editing,
  onClose,
  onSaved,
}: {
  catalog: CatalogSummary;
  editing: Editing;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [label, setLabel] = React.useState("");
  const [plural, setPlural] = React.useState("");
  const [abbreviation, setAbbreviation] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!editing) return;
    const item = editing.mode === "edit" ? editing.item : null;
    setLabel(item?.label ?? "");
    setPlural(item?.pluralLabel ?? "");
    setAbbreviation(item?.abbreviation ?? "");
    setError(null);
  }, [editing]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return setError("Escribe el nombre.");
    setSaving(true);
    setError(null);
    try {
      const body = {
        label: label.trim(),
        pluralLabel: catalog.usesPlural ? plural.trim() || null : null,
        abbreviation: catalog.usesAbbreviation ? abbreviation.trim() || null : null,
      };
      if (editing?.mode === "edit") {
        await CatalogService.update(catalog.key, editing.item.id, { ...body, active: editing.item.active });
        toast.success("Valor actualizado");
      } else {
        await CatalogService.create(catalog.key, body);
        toast.success("Valor agregado");
      }
      await onSaved();
    } catch (err) {
      setError(getAaxiosErrorMessage(err) || "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={editing !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing?.mode === "edit" ? "Editar valor" : "Nuevo valor"}</DialogTitle>
          <DialogDescription>{catalog.title}</DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <FloatingLabelInput id="catalog-label" label="Nombre" value={label} onChange={setLabel} disabled={saving} />
          {catalog.usesPlural && (
            <FloatingLabelInput id="catalog-plural" label="Plural (opcional)" value={plural} onChange={setPlural} disabled={saving} />
          )}
          {catalog.usesAbbreviation && (
            <FloatingLabelInput
              id="catalog-abbreviation"
              label={`${catalog.abbreviationLabel ?? "Abreviatura"} (opcional)`}
              value={abbreviation}
              onChange={setAbbreviation}
              disabled={saving}
            />
          )}
          {editing?.mode === "edit" && (
            <p className="text-xs text-muted-foreground">
              Código interno: <span className="font-mono">{editing.item.code}</span> (no cambia, así los registros guardados siguen
              enlazados).
            </p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
