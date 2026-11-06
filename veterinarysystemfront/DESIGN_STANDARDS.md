# Estándares de diseño del dashboard

Objetivo: que todas las secciones se vean como un mismo sistema clínico — sobrio, plano y legible.
Reglas cortas; si una pantalla las rompe, se corrige la pantalla, no la regla.

## 1. Estructura de pantalla (obligatoria)

```tsx
<DashboardLayoutSection>
  <PageContainer>
    <PageHeader title="…" description="…" actions={<Button>…</Button>} />
    <FilterBar>…</FilterBar>        {/* si hay filtros */}
    {/* contenido: DataTable, grilla de tarjetas, etc. */}
  </PageContainer>
</DashboardLayoutSection>
```

- `components/page/page-container.tsx`: padding `p-4 sm:p-6`, ancho `max-w-screen-2xl`, `gap-4` vertical. **No pintar fondo propio**: el lienzo lo da `SidebarInset`.
- `components/page/page-header.tsx`: título `text-2xl font-semibold tracking-tight`, descripción `text-sm text-muted-foreground`, acciones a la derecha. Detalle: usar `backHref`.
- `components/page/filter-bar.tsx`: `rounded-lg border bg-card p-3`. Sin blur, sin sombra.
- Pantallas de detalle: raíz `h-full overflow-y-auto`, cabecera sticky `border-b bg-card px-4 py-3 sm:px-6`, cuerpo `p-4 sm:p-6`. Nunca `min-h-screen`/`h-screen` dentro del dashboard.

## 2. Superficies

| Elemento | Regla |
|---|---|
| Fondo | Contenido **blanco** plano. El tono de color vive solo en la barra lateral (`--sidebar`) |
| Cajas | **Menos cards.** Filtros: fila plana (`FilterBar`), sin caja. Tablas: su propio borde, nunca dentro de un `Card`. Secciones: `PageSection` (título + contenido, sin caja). Nunca card dentro de card |
| Card | Solo para un bloque autónomo y pequeño (resumen, formulario, tarjeta de un ítem de lista). `rounded-lg border`, sin sombra |
| Radio | Contenedores `rounded-lg`; controles `rounded-md`; solo avatares/chips `rounded-full`. **Prohibido** `rounded-xl/2xl/3xl` |
| Sombras | Solo `shadow-xs`/`shadow-sm`. Prohibido `shadow-md+` y `shadow-[...]` |
| Efectos | Prohibido `backdrop-blur`, degradados (`bg-gradient-*`) y `ring-1` decorativos |

## 3. Color

- Solo tokens: `bg-background`, `bg-card`, `bg-muted`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `text-destructive`.
- **Prohibido** `gray-*`, `slate-*`, `zinc-*`, `bg-white` y colores crudos para estados.
- Estados: `success | warning | info | danger | neutral`.
  - Badge: `<Badge variant="success">…</Badge>` (fondo suave + texto fuerte).
  - Acento de tarjeta: `border border-l-4 ${toneBorderLeft[tone]}` desde `components/page/status-tone.ts`.
  - Tokens en `globals.css`: `--success|warning|info` con `-soft` y `-strong` (claro y oscuro).
- Los colores por especie (`AnimalSpeciesDetails`) son identidad, no estado: se mantienen.

## 4. Tipografía

- Título de página `text-2xl font-semibold`; sección `text-base font-semibold` (`CardTitle`); texto de apoyo `text-sm text-muted-foreground`; micro-texto `text-xs`.
- No usar `font-bold` salvo cifras destacadas.

## 5. Botones

- Una sola acción primaria por zona (`variant="default"`); el resto `outline`/`ghost`. Nada de `bg-emerald-600 …` a mano: para "guardar" se usa el primario.

## 6. Densidad de información: modales, formularios, detalle

| Situación | Patrón |
|---|---|
| Una tarea, ≤ 5 campos | `Dialog` pequeño (`max-w-lg`) |
| 6–10 campos | `Dialog` con secciones (`FormSection`) |
| > 10 campos o filas repetibles (productos, grupos…) | `Dialog` con `Tabs` (pie fijo con Guardar) o página propia. Las tabs se mantienen para partir un formulario |
| Elegir un tipo excluyente (tipo de cita, medicamento/instrucción) | `SegmentedControl` (botones), no Tabs. Solo en estos casos de elección |
| Confirmaciones | `ConfirmationDialog`; **nunca un modal sobre otro modal** |
| Formulario largo | `FormSection` por bloque; lo opcional/avanzado con `collapsible` |
| Información extensa (consulta, detalle) | `CollapsibleSection` con resumen a la derecha ("Completo", "3 registros") |
| Datos clave de un detalle | `SummaryPanel` + `SummaryItem` (una sola superficie suave con icono, etiqueta y valor destacado; descripción en el pie). `DescriptionList` para pares secundarios |
| Registros homogéneos con ≥ 4 atributos | Tabla (`DataTable`); cards solo para tableros operativos |

Componentes en `components/page/`: `SegmentedControl`, `SummaryPanel`, `PageContainer`, `PageHeader`, `PageSection`, `CollapsibleSection`, `FormSection`, `DescriptionList`, `FilterBar`, `status-tone`.
Pilotos de referencia: consulta clínica (`consultation-form.tsx`), `fieldwork/.../service-item-dialog.tsx`, detalle de movimiento de inventario.
