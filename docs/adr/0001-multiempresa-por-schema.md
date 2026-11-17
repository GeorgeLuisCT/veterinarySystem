# ADR 0001 — Multiempresa con un schema de PostgreSQL por empresa

- **Estado:** aceptada
- **Fecha:** 2026-11-16
- **Contexto de la decisión:** migración del backend de Java/Spring Boot 2.7 a .NET 8 (mismo stack que GaedetHotel)

## Contexto

El sistema era de una sola clínica. Debe atender a varias empresas (clínicas) desde un único despliegue, con sus datos
aislados. El hotel (GaedetHotel) usaba columnas `tenant_id` en las tablas de negocio; **para este proyecto (y para la
futura migración del hotel) eso está explícitamente prohibido.**

## Decisión

Cada empresa tiene su propio **schema de PostgreSQL**; las tablas de negocio **no tienen columna `tenant_id`**.

| Elemento | Dónde vive |
|---|---|
| Empresas (`tenants`) y superadministradores (`platform_admins`) | schema `platform` |
| Datos de negocio de la empresa `<slug>` | schema `t_<slug>` (`-` → `_`; slug `^[a-z][a-z0-9-]{1,38}[a-z0-9]$`) |
| Historial de migraciones de cada empresa | `t_<slug>.__ef_migrations_history` |

Cómo se aplica en el código (`backend/src/VetSaas/Shared/Infrastructure`):

1. **Resolución de la empresa** (`Tenancy/TenantRegistry.cs`, `TenantMiddleware`):
   - con sesión: claim `tenant` del JWT (manda siempre sobre cabeceras);
   - sin sesión (login, `/api/public/**`): `company` en el cuerpo del login → cabecera `X-Tenant` → `?company=` →
     subdominio (`Tenancy:BaseDomain`) → la única empresa activa, si solo hay una.
2. **Aislamiento** (`Persistence/TenantSchemaSupport.cs`): `TenantSchemaConnectionInterceptor` ejecuta
   `SET search_path TO "t_<slug>", public` al abrir cada conexión del `TenantDbContext`. Sin empresa resuelta no se
   abre conexión de negocio (excepción). El nombre del schema se valida siempre contra la expresión del slug.
3. **Alta de empresas** (`Tenancy/TenantProvisioner.cs`): crea el schema, aplica las migraciones y ejecuta los
   *seeders* (roles, compañía, sede, administrador, catálogos). Si algo falla, borra el schema.
4. **Migraciones**: un solo modelo EF (`TenantDbContext`) aplicado a todos los schemas al arrancar (`MigrateAllAsync`).
   Las consultas SQL crudas (reportes, bloqueos `FOR UPDATE`) usan nombres de tabla sin schema y heredan el `search_path`.
5. **Tokens separados**: el token de plataforma (`is_superadmin`) no sirve en rutas de empresa y viceversa.

## Consecuencias

**A favor**
- Aislamiento fuerte: una consulta olvidada sin filtro no puede ver datos de otra empresa.
- El código de negocio no lleva `WHERE tenant_id = …` en ningún lado; las consultas son las mismas que en la versión
  de una sola empresa.
- Respaldo, restauración o baja de una empresa = un schema (`pg_dump -n t_<slug>`, `DROP SCHEMA`).

**En contra / a vigilar**
- Las migraciones se aplican N veces (una por empresa); el arranque crece con el número de empresas.
- Los reportes entre empresas requieren consultar schema por schema (solo la plataforma lo necesitaría).
- El pool de conexiones es compartido: el interceptor **debe** fijar el `search_path` en cada apertura (no confiar en
  el estado previo de la conexión).
- El límite de intentos del portal público es en memoria por instancia; con varias réplicas habría que moverlo a un
  almacén compartido.

## Alternativas descartadas

- **Columna `tenant_id` + filtros globales** (como el hotel): prohibida por requisito; además un filtro omitido en SQL
  crudo filtra datos entre empresas.
- **Una base de datos por empresa**: aislamiento máximo, pero multiplica conexiones, respaldos y configuración; el
  schema da el aislamiento necesario con un solo servidor y una sola cadena de conexión.
