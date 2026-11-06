# Revisión del backend: reglas de negocio y decisiones

Este documento resume lo que se corrigió/completó en la revisión del backend, las reglas que ahora se aplican
y las **decisiones pendientes** que requieren definición del negocio. Cada regla tiene pruebas automáticas
(`mvn test`).

## Seguridad
| Antes | Ahora |
|---|---|
| `@PreAuthorize` declarado en ~10 controladores pero **nunca activado**: cualquier usuario autenticado podía hacer todo | `@EnableGlobalMethodSecurity` + reglas por módulo en `SecurityConfig` (finanzas, caja, ventas, campo, clínico, peluquería, reportes) |
| Roles de las anotaciones no coincidían con el uso real (almacén no podía editar productos; rol inexistente `DEPOSIT`) | Roles alineados con la navegación del frontend; eliminación definitiva solo admin/gerente |
| Usuario `admin` / `adminpassword` creado en cualquier entorno | Admin inicial solo con `BOOTSTRAP_ADMIN_USERNAME` y `BOOTSTRAP_ADMIN_PASSWORD` (mín. 12 caracteres); roles se siembran desde el enum; se eliminó la orden quirúrgica de ejemplo |
| Usuarios desactivados podían iniciar sesión | `disabled(!isActive)` en la autenticación |
| `/auth/select-branch` emitía token para **cualquier** sucursal | Valida que el empleado pertenezca a la sucursal y esté activa |
| No se podía impedir quedarse sin admin | No se puede desactivar/eliminar a uno mismo ni al último admin activo |
| Portal público: historia clínica con solo el documento, sin límite de intentos, mensajes que revelan clientes | Límite de 10 intentos/10 min por IP y por documento; mensaje uniforme |
| nginx con `Access-Control-Allow-Origin: *` y sin IP real | Sin CORS comodín (mismo origen); reenvía `X-Forwarded-For` |

## Errores HTTP
`EntityNotFoundException`→404, credenciales inválidas→401, `IllegalStateException` (regla de estado)→409,
bloqueo optimista/concurrencia→409, JSON inválido→400. Antes todo eso era **500**. Los `RuntimeException` de
negocio se reemplazaron por `EntityNotFoundException`/`BadRequestException`.

## Dinero
- **Caja**: efectivo esperado = apertura + ventas **en efectivo** de ventas **completadas** + ingresos − egresos.
  Antes sumaba tarjeta/transferencias, borradores y ventas anuladas. Cierre/apertura/movimientos con bloqueo de fila.
  Un egreso no puede superar el efectivo disponible.
- **Ventas**: todo cobro entra a la única caja abierta de la sucursal (antes solo la del mismo usuario que la abrió);
  vuelto (pago de más) solo contra efectivo y se registra neto; no se anula una venta cuyo cobro está en una caja ya
  cerrada; no se finaliza una venta vacía.
- **Tesorería**: bloqueo de fila, cuenta inactiva rechazada, no se permite saldo negativo.
- **Cuentas por pagar**: no se paga más que el saldo, no se paga una cuenta ya pagada, bloqueo de fila.

## Inventario
- `InventoryConsumptionService`: consumo FEFO por lotes vigentes, reparte entre lotes, falla explícitamente si no hay
  stock y puede revertir (`SERVICE_RETURN_ENTRY`).
- Ahora **descuentan inventario**: tratamientos hospitalarios (antes tomaba el primer lote, ignoraba faltantes y
  duplicaba/perdía al re-guardar), medicamentos y insumos de procedimientos de la consulta, materiales de peluquería,
  materiales y fármacos anestésicos de quirófano.
- Kardex exige lote y cantidad positiva; validación de listas anidadas (`@Valid`) en compras/transferencias/ajustes.

## Cobro de lo atendido (consulta → caja)
- `/api/sales/billable-items` devolvía siempre una lista vacía. Ahora lista cargos pendientes de: servicios clínicos
  (atención `READY_TO_BILL`), exámenes de laboratorio y sesiones de peluquería terminadas.
- `sale_detail_id` evita el doble cobro; anular la venta libera el cargo; el precio/cantidad los define el servidor.
- La atención pasa a `CLOSED` al cobrarse todo y vuelve a `READY_TO_BILL` si se anula la venta.

## Flujos clínicos
- **Atención clínica**: máquina de estados; cerrada/cancelada no admite cambios.
- **Citas**: sin cruces de horario (profesional, paciente, quirófano), sin fechas pasadas, estados sin retroceso.
- **Recepción**: sin doble recepción abierta del mismo tipo; solo se elimina en espera.
- **Hospitalización**: el alta **libera la jaula** (antes quedaba ocupada para siempre); un animal no puede estar
  internado dos veces; el registro es de solo lectura tras el alta; admisión con bloqueo de jaula.
- **Visitas de campo**: flujo PLANNED→IN_PROGRESS→COMPLETED/CANCELED; no se eliminan si ya empezaron; consumo de
  stock del vehículo con bloqueo.
- **Reportes**: el frontend llamaba a `/api/reports/graphql` pero el servidor lo publicaba en `/graphql`: el módulo no
  funcionaba en producción. Se fijó `spring.graphql.path`.

## Decisiones tomadas (revisar)
1. Una sola caja abierta por sucursal recibe los cobros de cualquier vendedor.
2. No se anula una venta con cobro en caja cerrada (hay que devolver desde tesorería).
3. Las cuentas de tesorería no pueden quedar en saldo negativo.
4. Los lotes sin fecha de vencimiento no se consumen automáticamente (igual que en el POS).

## Pendiente / requiere definición del negocio
- **Verificación del portal público**: el documento de identidad no es un secreto. Conviene un segundo dato
  (últimos dígitos del teléfono, fecha de nacimiento) o un código enviado por correo/SMS.
- **Cobro de medicamentos y de cirugía/hospitalización**: hoy no tienen precio asociado (solo servicios clínicos,
  laboratorio y peluquería son cobrables). Falta definir tarifa por día de hospitalización, cirugía y medicación.
- **Devolución de ventas ya cerradas** (nota de crédito contra tesorería).
- **Bloqueo de tokens** al desactivar un usuario (hoy el token vive hasta que expira `JWT_EXPIRATION`).
- Módulos revisados con menos profundidad: recordatorios, resultados de laboratorio, órdenes quirúrgicas,
  catálogo de productos/modos de venta.
