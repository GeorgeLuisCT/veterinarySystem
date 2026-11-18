# Preferencias

Opciones que cada persona, sucursal o empresa puede cambiar sin tocar código. Pantalla: **Configuración → Preferencias**
(`/dashboard/settings/preferences`). El diseño es el mismo que el del hotel, adaptado a un schema por empresa.

## Niveles

| Nivel | Quién lo cambia | Alcance | Ejemplos |
|---|---|---|---|
| **Mías** (`PrefScope.User`) | cada usuario | solo él, en cualquier computador | tamaño de letra, densidad de tablas, pantalla de inicio |
| **Sucursal** (`PrefScope.Branch`) | ADMIN, MANAGER | todo el personal de esa sucursal | duración sugerida de citas, módulos ocultos |
| **Empresa** (`PrefScope.Company`) | ADMIN | toda la empresa | cierre de sesión por inactividad |

Las de sucursal **heredan**: valor de la sucursal → valor «para todas las sucursales» (nivel empresa) → predeterminado.
Los predeterminados son siempre el comportamiento de antes: nada cambia hasta que alguien toque una preferencia.

## Cómo funciona

- **Una sola declaración** por preferencia, en `backend/src/VetSaas/Modules/Preferences/Preferences.cs` (campo estático
  `PreferenceDef` en `Prefs`). `PreferenceRegistry` las descubre por reflexión y **la API no arranca** si hay claves repetidas,
  grupos inexistentes u opciones/valores por defecto inválidos.
- Solo se guardan los valores que alguien **cambió** (tabla `preference_values` del schema de cada empresa, sin columna de empresa).
  Agregar una preferencia no requiere migración.
- La pantalla recibe la definición del servidor y dibuja el control según el tipo (`Bool`, `Int`, `Choice`, `MultiChoice`):
  no hay que tocar el frontend para que aparezca.
- La app lee todo ya resuelto con `GET /api/preferences/effective?branchId=` al entrar, al cambiar de sucursal y al volver a la
  pestaña (`context/preferences-context.tsx`).

| Endpoint | Roles |
|---|---|
| `GET/PUT/DELETE /api/preferences/me[/{key}]` | cualquier usuario con sesión |
| `GET /api/preferences/effective` | cualquier usuario con sesión |
| `GET/PUT/DELETE /api/branches/{id}/preferences[/{key}]` | ADMIN, MANAGER |
| `GET/PUT/DELETE /api/preferences/company[/{key}]` | ADMIN |

## Agregar una preferencia nueva

1. **Declarar** en `Prefs` (y, si hace falta, un grupo nuevo en `PrefGroups`):
   ```csharp
   public static readonly PreferenceDef MiRegla = PreferenceDef.Bool("modulo.miRegla", "schedule", PrefScope.Branch,
       "Título corto", "Qué hace, en una frase.", @default: false);
   ```
2. **Backend** (si bloquea o cambia datos): `if (await prefs.BoolAsync(Prefs.MiRegla)) …` en el servicio. Las reglas que
   bloquean se validan **siempre en el backend**; el frontend solo avisa antes.
3. **Frontend** (si cambia la interfaz): añadir `miRegla: k("modulo.miRegla", false)` a `src/config/preferences.ts` y leer
   `usePref(PREF.miRegla)`. Mientras llegan del servidor vale ese valor por defecto (debe coincidir con el del backend).

## Catálogo actual

| Grupo | Preferencia | Nivel | Dónde se aplica |
|---|---|---|---|
| Apariencia | tamaño de letra (`ui.fontSize`), densidad de tablas (`ui.density`) | persona | `preferences-context.tsx` + `styles/globals.css` |
| Inicio | pantalla de inicio (`start.home`) | persona | login y selección de sucursal (`resolveHomePage`) |
| Agenda | duración sugerida de una cita (`schedule.defaultDurationMinutes`) | sucursal | modal «Nueva cita» |
| Agenda | duración asumida de una cita sin duración (`schedule.assumedDurationMinutes`, 30) | sucursal | choques de horario en `AppointmentService` |
| Agenda | margen para agendar en el pasado (`schedule.pastToleranceMinutes`, 30) | sucursal | `AppointmentService` |
| Menú | módulos ocultos (`interface.hiddenModules`) | sucursal | menú lateral e Inicio (solo oculta; los permisos no cambian) |
| Seguridad | cierre de sesión por inactividad (`security.idleTimeoutMinutes`) | empresa | `preferences-context.tsx` |
| Portal público | intentos permitidos (`portal.maxAttempts`, 10) y ventana (`portal.windowMinutes`, 10) | empresa | límite de consultas del portal |

> Las preferencias hacen el papel de **variables** del sistema: todo valor fijo que convenga ajustar sin tocar código se declara aquí
> (con tipo, rango y valor por defecto), en vez de una tabla libre clave-valor.
