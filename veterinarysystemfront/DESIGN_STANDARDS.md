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
| Card | `rounded-lg border bg-card shadow-xs` (ya es el default de `ui/card`). No añadir sombras ni bordes de grosor >1px |
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
