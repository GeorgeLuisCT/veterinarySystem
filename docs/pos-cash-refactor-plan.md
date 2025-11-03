# Refactorización Módulos POS (sales/post) y Caja (payments/caja)

## 1. Alcance y objetivos
- Reemplazar por completo los módulos `sales`/`post` y `payments`/`caja` con una implementación alineada a los patrones de arquitectura que usan los módulos maduros (inventory, clinical, grooming, etc.).
- Cubrir todas las capas: entidades JPA, repositorios, servicios, mappers, DTOs, controladores, pruebas, y en frontend páginas, componentes, servicios de API, tipos y validaciones.
- Integrar el flujo de venta con inventario (descuento de stock) y con los servicios ya realizados (consultas, grooming, cirugía, hospitalización, laboratorio).
- Gestionar la caja diaria del cajero: apertura, movimientos adicionales, cierre y conciliación con lo vendido en efectivo.

## 2. Análisis de prerrequisitos (Tarea 01)

### 2.1 Inventario y stock
- **Producto y stock por sucursal**: `inventory.entity.Product` + `ProductBranch` definen el catálogo y activación por sucursal. Los productos usan `ProductUnitType` y `ProductSaleMode` para modos de venta alternos.
- **Movimientos**: `InventoryMovement` + `InventoryMovementProduct` generan entradas/salidas operativas (traslados, compras, ajustes).
- **Kardex**: `KardexMovement` registra salidas/entradas consolidadas por producto/sucursal/lote. `KardexService.registerMovement`:
  - Valida fecha, sucursal activa y stock suficiente.
  - Convierte a unidad base (usa `UnitConversionUtil` y `ProductSaleMode`).
  - Persiste `KardexMovement` con `originType` y `originId`.
- **Consulta de stock**: `KardexService.getStockForProducts` y `getAggregatedBranchStock` suministran inventario actual y por sucursal.
- **Implicación para ventas**: cada detalle que haga referencia a un `product_id` debe:
  1. Validar disponibilidad usando `KardexService`.
  2. Registrar un movimiento `KardexMovement` tipo salida (`KardexMovementType.SALE`) enlazando el `sale_detail_id` como `originId`.
  3. Manejar lote (`ProductBatch`) cuando se venda desde una compra específica (campo opcional en el DTO).

### 2.2 Servicios prestados (eventos consumibles por POS)
| Dominio | Entidad evento principal | Detalle/tabla clave | Observaciones para la venta |
|---------|--------------------------|---------------------|-----------------------------|
| Consultas | `ClinicalAttention` | `ClinicalServiceItem` (precio, cantidad, subtotal y relación con `ClinicalService`) | El POS debe vincularse al `ClinicalServiceItem` ya emitido. Validar que el ítem esté **facturable** (nuevo flag) y no asociado previamente a una venta. |
| Grooming | `GroomingSession` | El propio `GroomingSession` almacena `chargedPrice`; insumos en `GroomingMaterialUsed`. | Se debe poder facturar la sesión completa (`session_id`) y opcionalmente los insumos usados (si no se facturaron vía inventario). |
| Cirugías | `SurgicalReport` | `SurgicalReport` + materiales en `SurgicalMaterial`. | El POS se vincula al `surgical_report_id`; validar estado `COMPLETED` antes de cobrar. |
| Hospitalización | `Hospitalization` | `Hospitalization` + `TreatmentSchedule` para cargos periódicos. | Cada cargo programado deberá generar un “billable item” reutilizable por POS. |
| Laboratorio | `LaboratoryRequest` | `LaboratoryRequestItem` (pruebas asociadas). | Cada item representa un servicio facturable. |
| Medicamentos administrados | `MedicationAdministration` | Cada registro tiene producto, dosis y ruta. | Puede existir un `BillableMedication` que consolide precio desde inventario. |

> **Nota**: Los módulos actuales no exponen un concepto unificado de “ítem facturable”. Para la refactorización se propone crear un _view model_ `BillableServiceItem` que referencie cualquiera de las entidades anteriores mediante un discriminador (`BillableServiceType`), permitiendo al POS listar servicios pendientes de cobro por paciente/atención.

## 3. Backend – Nuevo módulo `sales`

### 3.1 Entidades
1. **Sale**
   - `id`, `branch` (`Branch`), `seller` (`User`), `customer` (`Customer`), `status` (`SaleStatus`: COMPLETED, VOIDED, DRAFT), `documentType` (`SalesDocumentType`), `documentNumber`, `subtotal`, `taxTotal`, `grandTotal`, `createdAt`, `updatedAt`, `voidedAt`, `voidReason`, `sourceAttentionId` (para agrupar por atención opcional).
2. **SaleDetail**
   - `id`, `sale`, `itemDescription`, `unitPrice`, `quantity`, `lineSubtotal`, `taxRate`, `taxAmount`, `product` (`Product`, nullable), `saleMode` (`ProductSaleMode`, nullable), `productBatch` (`ProductBatch`, nullable), `serviceItemType` (`BillableServiceType`, nullable), `serviceItemId` (`Long`, nullable), `metadata` (JSON embebido para snapshots de atributos relevantes).
   - Constraint de XOR: exactamente una de {product, serviceItem} debe estar informada.
3. **Payment**
   - `id`, `sale`, `amountPaid`, `paymentMethod` (`PaymentMethod` enum), `paidAt`, `reference`, `cashSession` (`CashSession`, nullable para enlazar cuando el método sea efectivo), `currency` (`CurrencyCode`, futuro).
4. **SaleAuditTrail** (opcional pero recomendado)
   - Permite registrar cambios de estado, anulaciones, devoluciones futuras.

### 3.2 Repositorios
- `SaleRepository` con métodos para filtrar por sucursal, rango de fechas, estado, cliente, vendedor.
- `SaleDetailRepository` con búsqueda por `serviceItemType/serviceItemId` (para marcar ítems como cobrados).
- `PaymentRepository` con agregaciones por método y sesión de caja.
- Usar interfaces `JpaRepository` + `JpaSpecificationExecutor` siguiendo patrón `inventory`.

### 3.3 DTOs y validaciones
- `dtos/request/CreateSaleRequest`:
  - `branchId`, `sellerId`, `customerId`, `document` (tipo + número), `items[]`, `payments[]`, `notes`.
  - Cada `item`: `kind` (`PRODUCT` | `SERVICE`), `productId` | (`serviceType`, `serviceItemId`), `descriptionOverride?`, `unitPrice`, `quantity`, `taxRate`, `productBatchId?`.
  - Validaciones con `javax.validation` (`@NotNull`, `@Positive`, `@Valid`). Custom validator para XOR de product vs service.
- `dtos/request/VoidSaleRequest` con `reason`.
- `dtos/response/SaleSummaryResponse`, `SaleDetailResponse`, `PaymentResponse`, `SaleHistoryResponse`.
- Reutilizar `PaginatedResponse`.

### 3.4 Servicios
- `SaleService`
  1. **saveSale(CreateSaleRequest)**:
     - Cargar sucursal, vendedor, cliente vía `EntityManager#getReference`.
     - Permitir crear o actualizar borradores (`saleId` opcional) manteniendo `SaleStatus.DRAFT` hasta que se solicite `finalizeSale=true`.
     - Resolver items:
       * `PRODUCT`: validar stock disponible al momento de finalizar, copiar `ProductSaleMode` seleccionado, descontar stock vía `KardexService.registerMovement` (`originType = "SALE_DETAIL"`).
       * `SERVICE`: consultar repositorio específico según `serviceType` (delegar en `BillableServiceLocator`) para validar existencia, estado facturable, pertenencia a sucursal/atención, y marcarlo como facturado (`BillableServiceRegistry` con campo `billedSaleDetailId`).
     - Calcular subtotal/tax/total. Sólo exigir pagos suficientes cuando se finaliza la venta; en borrador admitir pagos parciales o vacíos.
     - Persistir `Sale` cascada con `SaleDetail` y `SalePayment` (pagos se vinculan a `CashSession` al finalizar).
  2. **voidSale(id, reason)**:
     - Validar estado `COMPLETED`.
     - Revertir stock vía `KardexService.registerMovement` inverso (`type=RETURN`), solo para detalles de producto.
     - Revertir marca de facturación en servicios (`BillableServiceRegistry.unsetBilled`).
     - Actualizar `Sale` a `VOIDED`, desasociar pagos o marcarlos `reversed`.
  3. **getSaleDetail / listSales** con filtros, usando `Specification`.
- `PaymentService`
  - Crear pagos, registrar enlace a `CashSession` cuando `paymentMethod == CASH` (consultando `CashSessionService.getActiveSession(branch, seller)`).
  - Agregaciones por método/fecha para reportes.
- `BillableServiceRegistry`
  - Adaptador con beans por dominio (`ClinicalBillableAdapter`, `GroomingBillableAdapter`, etc.) que exponen métodos `validateBillableItem`, `markAsBilled`, `markAsUnbilled`, `summariesByFilters`.

### 3.5 Controladores
- `SaleController` (prefijo `/api/sales`):
  - `POST /` crear venta (request body validado).
  - `GET /{id}` detalle.
  - `GET /` listado paginado con filtros `branchId`, `sellerId`, `customerId`, `status`, rango de fechas, `documentNumber`.
- `POST /{id}/void` anular.
- `GET /pending` listar ventas en borrador para reanudarlas.
  - `GET /billable-items` (delegado a `BillableServiceRegistry`) filtrando por atención, animal, rango fechas.
- Gestionar seguridad con `@PreAuthorize("hasAuthority('POS_MANAGE')")` y permisos de supervisor para anulación.

### 3.6 Mappers
- `SaleMapper` para transformar entidades ↔ DTOs, replicando estilo de `inventory.mapper`.
- `PaymentMapper`, `BillableItemMapper`.
- Usar métodos estáticos y `@Builder` en respuestas.

### 3.7 Especificaciones y consultas
- `SaleSpecs` para filtros dinámicos con `JpaSpecificationExecutor`.
- `BillableServiceSpecs` en cada adaptador (p.ej. `ClinicalServiceItemRepository` con `isBillable = true AND billedSaleDetailId IS NULL`).

### 3.8 Pruebas
- **Unitarias**: `SaleServiceTest`, `PaymentServiceTest`, `BillableServiceRegistryTest` usando Mockito para repositorios/servicios externos.
- **Integración**: `SaleControllerIT` con `@SpringBootTest` + `@Sql` cargando datos de catálogo, productos, atenciones. Casos:
  1. Crear venta con productos (stock suficiente).
  2. Venta mixta productos + servicio.
  3. Validación de stock insuficiente.
  4. Anulación con reversión de stock.
  5. Listado filtrado por sucursal y rango.
- Reutilizar `db/BasicData.sql` y generar dataset `db/PosData.sql` con atenciones de prueba.

### 3.9 Consideraciones adicionales
- Transacciones: `@Transactional` a nivel `SaleService.saveSale` y `voidSale` para garantizar atomicidad (incluyendo movimientos de stock y marca de servicios facturados).
- Auditoría: aprovechar `Spring Data @CreatedDate/@LastModifiedDate` (habilitar `AuditingEntityListener`).
- Documentos: generar número correlativo por sucursal y tipo (`SalesDocumentSequencer`).
- Preparar endpoint para emitir comprobante electrónico en iteraciones futuras (no bloqueo actual).

## 4. Backend – Nuevo módulo `payments`

### 4.1 Entidades
1. **CashSession**
   - `id`, `branch` (`Branch`), `cashier` (`User`), `openedAt`, `openingAmount`, `closedAt`, `calculatedClosingAmount`, `countedClosingAmount`, `differenceAmount`, `closingNotes`, `status` (`CashSessionStatus`: OPEN, CLOSED, ARCHIVED), `version`.
2. **CashSessionMovement**
   - `id`, `cashSession`, `movementType` (`CashMovementType`: INCOME, EXPENSE), `amount`, `reason`, `registeredBy` (`User`), `registeredAt`, `reference`.
3. **CashSessionPaymentLink** (opcional):
   - Tabla puente `cash_session_payments` (`cash_session_id`, `payment_id`) para vincular pagos en efectivo (soporta que un pago se asocie a la sesión abierta al momento de registrar la venta).

### 4.2 Repositorios
- `CashSessionRepository` con consultas:
  - `findActiveByBranchAndCashier(branchId, userId)`
  - `findLatestClosedByBranch(branchId)`
  - `findAllByBranchAndDateRange(...)`.
- `CashSessionMovementRepository` y `CashSessionPaymentLinkRepository`.

### 4.3 Servicios
- `CashSessionService`
  1. **openSession(request)**: valida inexistencia de sesión abierta en sucursal, persiste con `status=OPEN`.
  2. **getActiveSession(branchId)**: retorna DTO con totales acumulados (`CashSessionSummary`).
  3. **closeSession(id, countedAmount, notes)**:
     - Obtiene total esperado: `openingAmount + sum(payments CASH) + sum(movements INCOME) - sum(movements EXPENSE)`.
     - Calcula `difference`, marca `status=CLOSED`, setea `closedAt`.
  4. **registerMovement(sessionId, request)**: agrega ingreso/egreso, recalcula totales.
  5. **listHistory(branchId, filters)**: devuelve paginado con diferencias, usuario, notas.
- Integración con ventas:
  - `PaymentService` notificará a `CashSessionService` para adjuntar pagos en efectivo a la sesión abierta (`registerCashPayment(payment)`).

### 4.4 Controladores
- `CashSessionController` (`/api/cash-sessions`):
  - `POST /` abrir.
  - `GET /active` obtener sesión activa (por sucursal, derivada del usuario autenticado).
  - `POST /{id}/movements` registrar ingreso/egreso.
  - `POST /{id}/close` cerrar sesión.
  - `GET /history` listado de cierres (filtros: sucursal, rango fechas, cajero, diferencia positiva/negativa).
- Seguridad: `@PreAuthorize("hasAuthority('CASHBOX_MANAGE')")`. Cierre solo para supervisor o responsable.

### 4.5 DTOs y mappers
- `CreateCashSessionRequest`, `CloseCashSessionRequest`, `RegisterMovementRequest`.
- `CashSessionSummaryResponse`, `CashSessionDetailResponse`, `CashSessionHistoryResponse`.
- `CashSessionMapper` para consolidar totales (`sumPaymentsByMethod` reutilizando `PaymentService`).

### 4.6 Pruebas
- `CashSessionServiceTest`: apertura duplicada, cierre con cálculo correcto, movimientos.
- `CashSessionControllerIT`: flujo completo abrir → registrar pagos simulados → movimientos → cerrar.

### 4.7 Consideraciones
- Bloquear eliminación/edición de sesiones cerradas.
- Manejo de arqueo manual: permitir cargar evidencia (campo `closingNotes`, attachments futuro).
- Preparar hook para exportar arqueo a PDF/Excel (no requerido inmediatamente).

## 5. Frontend – Rediseño POS (`post`) y Caja (`caja`)

### 5.1 Estructura de carpetas
- `src/app/dashboard/pos` (nuevo reemplazo):
  - `_components/`: `customer-search`, `product-search`, `service-search`, `sale-cart`, `payment-modal`, `totals-summary`.
  - `_hooks/`: `usePosCart`, `useBillableServices`.
  - `_service/`: `sales.service.ts`, `billable-services.service.ts`, `payments.service.ts`.
  - `_types/`: `sale-request.ts`, `sale-response.ts`, `billable-service.ts`, `payment.ts`.
  - `_schemas/`: `sale-form-schema.ts`, `payment-schema.ts`.
  - `new/page.tsx` (`PointOfSalePage`), `history/page.tsx` (`SalesHistoryPage`), `[saleId]/page.tsx` (detalle).
- `src/app/dashboard/cashbox`:
  - `_components/`: `open-session-modal`, `cash-dashboard`, `movement-list`, `close-session-modal`.
  - `_hooks/`: `useCashSession`, `useCashMovements`.
  - `_service/`: `cash-session.service.ts`.
  - `_types/`: `cash-session.ts`, `cash-movement.ts`.
  - `_schemas/`: `open-session-schema.ts`, `movement-schema.ts`, `close-session-schema.ts`.
  - `page.tsx` (`CurrentCashSessionPage`), `history/page.tsx`.

### 5.2 Servicios de API
- `sales.service.ts`
  - Métodos: `saveSale`, `getSale`, `listSales`, `voidSale`, `listBillableItems`, `listPayments`.
  - Usar `api` base (`axios`) y tipar respuestas según DTOs.
- `billable-services.service.ts`
  - `searchBillableItems({ attentionId?, patientId?, branchId?, pendingOnly = true })`.
- `cash-session.service.ts`
  - `openSession`, `getActive`, `registerMovement`, `closeSession`, `listHistory`.

### 5.3 Estados y hooks
- `usePosCart`
  - Gestiona items (productos, servicios) con estructura homogénea (`PosCartItem`), totales, impuestos, descuentos futuros.
  - Coordina búsqueda de stock (`ProductService`) y servicios (`BillableServiceService`).
- `usePaymentCollector`
  - Administra pagos múltiples (efectivo, tarjeta, transferencia), validando que la suma cubra el total.
  - Calcula saldo pendiente y marca pagos parcial/completos.
- `useCashSession`
  - Carga estado actual, movimientos, totales por método.
- `useUser` (ya existente) para obtener sucursal y cajero (extender `UserInfo` con sucursal activa si no existe).

### 5.4 Componentes clave
- **CustomerSearchDialog**: reutiliza patrones de `inventory` (combobox backend).
- **ProductSearchDrawer**: búsqueda debounced por SKU/nombre con stock y modos de venta.
- Al seleccionar un producto desde quick search, el frontend debe consultar el detalle (`/api/products/get`) para ofrecer los `saleModes` y permitir elegir unidad/precio al agregar al carrito.
- **ServiceSearchDialog**: tabla con filtros por paciente/atención, agrupado por tipo (`BillableServiceType`), permitiendo seleccionar múltiples servicios pendientes.
- **SaleCartTable**: muestra items, permite editar cantidad/importe, recalcula totales en vivo.
- **PaymentModal**: permite registrar múltiples métodos; bloquea confirmación si saldo ≠ 0 (o se marca venta a crédito).
- **SaleHistoryTable**: filtros por fecha, sucursal, estado; acciones ver detalle / anular (con diálogo de confirmación y comprobación de permisos).
- **CashDashboard**: tarjetas con apertura, ventas en efectivo, ingresos/egresos adicionales, diferencia actual.
- **CloseSessionModal**: formulario con `monto_cierre_contado`, notas y resumen calculado.

### 5.5 Validaciones (Zod)
- `saleFormSchema`: valida items no vacíos, cantidades > 0, precios >= 0, XOR producto/servicio, pagos que suman >= total cuando se cierra la venta.
- `paymentSchema`: campos obligatorios por método (ej. referencia requerida para transferencia).
- `cashSessionSchemas`: apertura (monto >= 0), movimiento (monto > 0, motivo), cierre (monto contado >= 0).

### 5.6 UX y flujos
- POS debe mostrar sucursal y vendedor derivado de sesión; si no hay caja abierta en efectivo, mostrar alerta para abrir caja (pero permitir otros métodos).
- Al agregar servicio desde `ServiceSearch`, el frontend debe marcarlo localmente como "reservado" para evitar doble selección; al confirmar venta el backend hará validación definitiva.
- Historial de ventas con exportación CSV (iteración futura).
- Caja: cuando se registra un pago en efectivo, el frontend debe refrescar la sesión activa automáticamente.

### 5.7 Testing frontend
- Vitest para hooks (`usePosCart`, `usePaymentCollector`).
- Tests de componentes críticos con Testing Library (PaymentModal, SaleCartTable).
- Playwright (futuro) para smoke test: crear venta con producto dummy usando MSW para mock de API.
- Ejecutar `npm run lint` tras implementar.

## 6. Roadmap de implementación sugerido
1. Implementar `BillableService` adapter layer y banderas `isBillable`/`billedSaleDetailId` en servicios clínicos.
2. Construir entidades + repositorios `sales` y `payments`.
3. Implementar `SaleService` (creación) + pruebas unitarias.
4. Integrar `PaymentService` con `CashSessionService`.
5. Exponer controladores y DTOs, completar pruebas de integración.
6. Desarrollar frontend POS (nueva venta) y enlazar API.
7. Desarrollar frontend caja (apertura/cierre).
8. Migrar datos viejos / descontinuar módulos anteriores.
