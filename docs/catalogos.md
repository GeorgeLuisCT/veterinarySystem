# Catálogos editables

Listas de negocio que antes eran enums fijos y ahora cada empresa puede editar en **Configuración → Catálogos**
(`/dashboard/settings/catalogs`): agregar valores, cambiar su nombre (y abreviatura o plural), ordenarlos, desactivarlos o eliminarlos.

## Qué es catálogo y qué no

- **Catálogo**: listas que solo se guardan y se muestran; ninguna regla del sistema depende de un valor concreto.
  Hoy: especies, vías de administración, categorías de registro médico, tamaños de jaula, unidades de laboratorio,
  presentaciones de producto, tipos de proveedor, tipos de zona, prioridades de tarea y tipos de cuenta de tesorería.
- **Enum en el código** (no editable): estados y tipos de los que dependen reglas (estados de venta, caja, cita, atención,
  laboratorio, cirugía o visita; tipos de movimiento de kardex; roles…). Un estado nuevo no tendría reglas que lo traten.
- **Pendientes** (tienen valores con lógica, irán como catálogos con valores protegidos): causas de hospitalización, medios de pago,
  unidades de producto, categorías de servicio y tipos de recordatorio.

## Cómo funciona

- Tabla `catalog_items` en el schema de cada empresa: `catalog`, `code` (no cambia nunca; es lo que se guarda en los datos),
  `label`, `plural_label`, `abbreviation`, `sort_order`, `active`.
- Definiciones y valores por defecto en `backend/src/VetSaas/Modules/Catalogs/Catalogs.cs` (`CatalogKeys`). Cada catálogo se llena
  con sus valores por defecto la primera vez que la empresa lo usa; los códigos son los mismos que tenía el enum, así que los datos
  existentes siguen siendo válidos.
- **Validación central**: las propiedades marcadas con `[Catalog(CatalogKeys.X)]` se validan al guardar (`TenantCatalogSupport.cs`):
  un valor nuevo o cambiado debe existir y estar activo. Un registro que ya tenía un valor luego desactivado lo conserva.
- **Eliminar** solo se permite si ningún registro usa el código (se revisan todas las columnas marcadas con ese catálogo);
  si está en uso, se desactiva.
- **Frontend**: `src/lib/catalogs.ts`. Los archivos de enums (`AnimalSpecies`, `AnimalSpeciesLabels`, `AnimalSpeciesOptions`…)
  conservan sus nombres pero leen del catálogo: `Object.values(AnimalSpecies)` devuelve los códigos activos y
  `AnimalSpeciesLabels[code]` el nombre configurado. Se cargan una vez al entrar (`context/catalogs-context.tsx`).

## Agregar un catálogo nuevo

1. Backend: una entrada en `CatalogKeys.All` (clave, título, grupo y valores por defecto) y `[Catalog(CatalogKeys.X)] [MaxLength(60)]`
   en la propiedad de la entidad (tipo `string`).
2. Frontend: la clave en `CatalogKey` y el archivo del enum con `catalogEnum`, `catalogLabels` y `catalogOptions`.
