package com.gaedet.biocampovet.core.sales.service;

import com.gaedet.biocampovet.core.branches.entity.Branch;
import com.gaedet.biocampovet.core.branches.repository.BranchRepository;
import com.gaedet.biocampovet.core.customer.entity.Customer;
import com.gaedet.biocampovet.core.customer.repository.CustomerRepository;
import com.gaedet.biocampovet.core.inventory.dto.KardexRegistrationRequest;
import com.gaedet.biocampovet.core.inventory.entity.Product;
import com.gaedet.biocampovet.core.inventory.entity.ProductBatch;
import com.gaedet.biocampovet.core.inventory.entity.ProductSaleMode;
import com.gaedet.biocampovet.core.inventory.enums.KardexMovementType;
import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import com.gaedet.biocampovet.core.inventory.repository.ProductBatchRepository;
import com.gaedet.biocampovet.core.inventory.repository.ProductRepository;
import com.gaedet.biocampovet.core.inventory.repository.ProductSaleModeRepository;
import com.gaedet.biocampovet.core.inventory.service.KardexService;
import com.gaedet.biocampovet.core.payments.entity.CashSession;
import com.gaedet.biocampovet.core.payments.enums.CashSessionStatus;
import com.gaedet.biocampovet.core.payments.repository.CashSessionRepository;
import com.gaedet.biocampovet.core.sales.billable.BillableServiceItem;
import com.gaedet.biocampovet.core.sales.billable.BillableServiceRegistry;
import com.gaedet.biocampovet.core.sales.dto.request.CreateSaleRequest;
import com.gaedet.biocampovet.core.sales.dto.request.SaleItemRequest;
import com.gaedet.biocampovet.core.sales.dto.request.SalePaymentRequest;
import com.gaedet.biocampovet.core.sales.dto.request.VoidSaleRequest;
import com.gaedet.biocampovet.core.sales.dto.response.SaleResponse;
import com.gaedet.biocampovet.core.sales.dto.response.SaleSummaryResponse;
import com.gaedet.biocampovet.core.sales.entity.Sale;
import com.gaedet.biocampovet.core.sales.entity.SaleDetail;
import com.gaedet.biocampovet.core.sales.entity.SalePayment;
import com.gaedet.biocampovet.core.sales.enums.BillableServiceType;
import com.gaedet.biocampovet.core.sales.enums.PaymentMethod;
import com.gaedet.biocampovet.core.sales.enums.SaleItemKind;
import com.gaedet.biocampovet.core.sales.enums.SaleStatus;
import com.gaedet.biocampovet.core.sales.mapper.SaleMapper;
import com.gaedet.biocampovet.core.sales.repository.SaleRepository;
import com.gaedet.biocampovet.core.users.entity.User;
import com.gaedet.biocampovet.core.users.repository.UserRepository;
import com.gaedet.biocampovet.exeption.BadRequestException;
import com.gaedet.biocampovet.exeption.InsufficientStockException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import static java.math.BigDecimal.ZERO;

@Service
@RequiredArgsConstructor
public class SaleService {

    private final SaleRepository saleRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final ProductBatchRepository productBatchRepository;
    private final ProductSaleModeRepository productSaleModeRepository;
    private final CashSessionRepository cashSessionRepository;
    private final KardexService kardexService;
    private final BillableServiceRegistry billableServiceRegistry;
    private final SaleMapper saleMapper;

    private static final int MONEY_SCALE = 2;
    private static final RoundingMode ROUNDING_MODE = RoundingMode.HALF_UP;

    @Transactional
    public SaleResponse saveSale(CreateSaleRequest request) {
        boolean finalizeSale = request.isFinalizeSale();

        Sale sale;
        Branch branch;
        User seller;

        if (request.getSaleId() != null) {
            sale = saleRepository.findById(request.getSaleId())
                    .orElseThrow(() -> new EntityNotFoundException("Venta no encontrada"));

            if (sale.getStatus() == SaleStatus.COMPLETED) {
                throw new BadRequestException("No se puede modificar una venta ya completada");
            }

            branch = sale.getBranch();
            seller = sale.getSeller();

            if (!branch.getId().equals(request.getBranchId())) {
                throw new BadRequestException("La venta pertenece a otra sucursal");
            }
            if (!seller.getId().equals(request.getSellerId())) {
                throw new BadRequestException("La venta pertenece a otro vendedor");
            }

            sale.getDetails().clear();
            sale.getPayments().clear();
            sale.setVoidedAt(null);
            sale.setVoidReason(null);
        } else {
            branch = branchRepository.findById(request.getBranchId())
                    .orElseThrow(() -> new EntityNotFoundException("Sucursal no encontrada"));

            seller = userRepository.findById(request.getSellerId())
                    .orElseThrow(() -> new EntityNotFoundException("Usuario vendedor no encontrado"));

            sale = Sale.builder()
                    .branch(branch)
                    .seller(seller)
                    .build();
        }

        Customer customer = null;
        if (request.getCustomerId() != null) {
            customer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new EntityNotFoundException("Cliente no encontrado"));
        }

        sale.setCustomer(customer);
        sale.setDocumentType(request.getDocumentType());
        sale.setDocumentNumber(request.getDocumentNumber());
        sale.setNotes(request.getNotes());

        BigDecimal subtotal = ZERO;
        BigDecimal taxTotal = ZERO;

        Map<Long, BigDecimal> reservedByProduct = new HashMap<>();
        List<PendingProductMovement> productMovements = new ArrayList<>();
        List<PendingServiceMark> serviceMarks = new ArrayList<>();

        for (SaleItemRequest item : request.getItems()) {
            SaleDetail detail = mapSaleDetail(sale, branch, item, reservedByProduct, productMovements, serviceMarks, finalizeSale);
            sale.getDetails().add(detail);
            subtotal = subtotal.add(detail.getLineSubtotal());
            taxTotal = taxTotal.add(detail.getTaxAmount() == null ? ZERO : detail.getTaxAmount());
        }

        subtotal = subtotal.setScale(MONEY_SCALE, ROUNDING_MODE);
        taxTotal = taxTotal.setScale(MONEY_SCALE, ROUNDING_MODE);
        BigDecimal grandTotal = subtotal.add(taxTotal).setScale(MONEY_SCALE, ROUNDING_MODE);

        sale.setSubtotal(subtotal);
        sale.setTaxTotal(taxTotal);
        sale.setGrandTotal(grandTotal);

        List<SalePaymentRequest> paymentRequests = request.getPayments() != null ? request.getPayments() : List.of();
        BigDecimal paidTotal = ZERO;

        for (SalePaymentRequest paymentRequest : paymentRequests) {
            SalePayment payment = mapSalePayment(sale, branch, paymentRequest, finalizeSale);
            sale.getPayments().add(payment);
            paidTotal = paidTotal.add(payment.getAmountPaid());
        }

        if (finalizeSale && paidTotal.compareTo(grandTotal) < 0) {
            throw new BadRequestException("El total pagado es menor al total de la venta");
        }

        if (!finalizeSale) {
            sale.setStatus(SaleStatus.DRAFT);
            Sale savedSale = saleRepository.save(sale);
            return saleMapper.toResponse(savedSale);
        }

        sale.setStatus(SaleStatus.COMPLETED);

        Sale savedSale = saleRepository.saveAndFlush(sale);

        registerProductMovements(productMovements);
        markServicesAsBilled(serviceMarks);

        return saleMapper.toResponse(savedSale);
    }

    @Transactional(readOnly = true)
    public SaleResponse getSale(Long saleId) {
        Sale sale = saleRepository.findById(saleId)
                .orElseThrow(() -> new EntityNotFoundException("Venta no encontrada"));
        return saleMapper.toResponse(sale);
    }

    @Transactional(readOnly = true)
    public Page<SaleSummaryResponse> listSales(Pageable pageable) {
        return saleRepository.findAll(pageable).map(saleMapper::toSummary);
    }

    @Transactional(readOnly = true)
    public List<SaleSummaryResponse> listPendingSales(Long branchId) {
        List<Sale> sales;
        if (branchId != null && branchId > 0) {
            sales = saleRepository.findByBranchIdAndStatus(branchId, SaleStatus.DRAFT);
        } else {
            sales = saleRepository.findByStatus(SaleStatus.DRAFT);
        }

        return sales.stream()
                .map(saleMapper::toSummary)
                .toList();
    }

    @Transactional
    public SaleResponse voidSale(Long saleId, VoidSaleRequest request) {
        Sale sale = saleRepository.findById(saleId)
                .orElseThrow(() -> new EntityNotFoundException("Venta no encontrada"));

        if (sale.getStatus() == SaleStatus.VOIDED) {
            throw new BadRequestException("La venta ya se encuentra anulada");
        }

        if (sale.getStatus() != SaleStatus.COMPLETED) {
            throw new BadRequestException("Solo se pueden anular ventas completadas");
        }

        sale.setStatus(SaleStatus.VOIDED);
        sale.setVoidedAt(LocalDateTime.now());
        sale.setVoidReason(request.getReason());

        // Reponer stock de productos vendidos
        sale.getDetails().stream()
                .filter(detail -> detail.getProduct() != null)
                .forEach(detail -> kardexService.registerMovement(KardexRegistrationRequest.builder()
                        .productId(detail.getProduct().getId())
                        .branchId(sale.getBranch().getId())
                        .batchId(detail.getProductBatch() != null ? detail.getProductBatch().getId() : null)
                        .quantity(detail.getQuantity())
                        .unitType(resolveUnitType(detail))
                        .type(KardexMovementType.ADJUSTMENT_ENTRY)
                        .originId(detail.getId())
                        .originType("SALE_DETAIL_VOID")
                        .build()));

        // Marcar servicios como no facturados
        sale.getDetails().stream()
                .filter(detail -> detail.getServiceType() != null && detail.getServiceItemId() != null)
                .forEach(detail -> billableServiceRegistry.markAsUnbilled(detail.getServiceType(), detail.getServiceItemId()));

        return saleMapper.toResponse(sale);
    }

    @Transactional(readOnly = true)
    public List<BillableServiceItem> listBillableItems(Long branchId, Long attentionId, Long patientId, String query) {
        // Aún no hay adaptadores concretos; devolver lista vacía para mantener contrato.
        return List.of();
    }

    private SaleDetail mapSaleDetail(
            Sale sale,
            Branch branch,
            SaleItemRequest item,
            Map<Long, BigDecimal> reservedByProduct,
            List<PendingProductMovement> productMovements,
            List<PendingServiceMark> serviceMarks,
            boolean finalizeSale
    ) {
        BigDecimal quantity = item.getQuantity().setScale(3, ROUNDING_MODE);
        BigDecimal unitPrice = item.getUnitPrice().setScale(MONEY_SCALE, ROUNDING_MODE);
        BigDecimal lineSubtotal = unitPrice.multiply(quantity).setScale(MONEY_SCALE, ROUNDING_MODE);

        BigDecimal taxRate = item.getTaxRate() != null ? item.getTaxRate() : ZERO;
        BigDecimal taxAmount = item.getTaxAmount();
        if (taxAmount == null) {
            taxAmount = lineSubtotal.multiply(taxRate).setScale(MONEY_SCALE, ROUNDING_MODE);
        } else {
            taxAmount = taxAmount.setScale(MONEY_SCALE, ROUNDING_MODE);
        }

        String description = item.getDescriptionOverride();

        SaleDetail detail = SaleDetail.builder()
                .sale(sale)
                .itemDescription(description)
                .unitPrice(unitPrice)
                .quantity(quantity)
                .lineSubtotal(lineSubtotal)
                .taxRate(taxRate)
                .taxAmount(taxAmount)
                .metadataJson(item.getMetadataJson())
                .build();

        if (item.getKind() == SaleItemKind.PRODUCT) {
            Product product = productRepository.findById(item.getProductId())
                    .orElseThrow(() -> new EntityNotFoundException("Producto no encontrado"));

            ProductBatch batch = null;
            if (item.getProductBatchId() != null) {
                batch = productBatchRepository.findById(item.getProductBatchId())
                        .orElseThrow(() -> new BadRequestException("Lote de producto no encontrado"));
            }

            detail.setProduct(product);
            detail.setProductBatch(batch);
            ProductSaleMode saleMode = null;
            ProductUnitType unitType = item.getUnitType();

            if (item.getSaleModeId() != null) {
                saleMode = productSaleModeRepository.findById(item.getSaleModeId())
                        .orElseThrow(() -> new BadRequestException("Modo de venta no encontrado"));

                if (!saleMode.getProduct().getId().equals(product.getId())) {
                    throw new BadRequestException("El modo de venta no pertenece al producto seleccionado");
                }

                unitType = saleMode.getUnitType();
                detail.setSaleMode(saleMode);
            } else {
                throw new BadRequestException("Debe seleccionar un modo de venta para el producto");
            }

            if (description == null || description.isBlank()) {
                detail.setItemDescription(product.getName() + " - " + unitType.name());
            }

            detail.setUnitType(unitType);

            validateStockAvailability(product, branch.getId(), quantity, unitType, saleMode, reservedByProduct, finalizeSale);

            productMovements.add(new PendingProductMovement(
                    detail,
                    product.getId(),
                    branch.getId(),
                    batch != null ? batch.getId() : null,
                    quantity,
                    unitType
            ));
        } else if (item.getKind() == SaleItemKind.SERVICE) {
            BillableServiceType serviceType = item.getServiceType();
            Long serviceItemId = item.getServiceItemId();
            if (serviceType == null || serviceItemId == null) {
                throw new BadRequestException("Debe indicar el tipo e identificador del servicio facturable");
            }

            BillableServiceItem billableItem = billableServiceRegistry.fetchItem(serviceType, serviceItemId);

            if (billableItem.getBranchId() != null && !Objects.equals(billableItem.getBranchId(), branch.getId())) {
                throw new BadRequestException("El servicio seleccionado pertenece a otra sucursal");
            }

            if (description == null || description.isBlank()) {
                detail.setItemDescription(billableItem.getDescription());
            }

            detail.setServiceType(serviceType);
            detail.setServiceItemId(serviceItemId);

            serviceMarks.add(new PendingServiceMark(detail, serviceType, serviceItemId));
        } else {
            throw new BadRequestException("Tipo de ítem de venta no soportado");
        }

        if (detail.getItemDescription() == null || detail.getItemDescription().isBlank()) {
            throw new BadRequestException("El ítem de venta requiere una descripción");
        }

        return detail;
    }

    private SalePayment mapSalePayment(Sale sale, Branch branch, SalePaymentRequest paymentRequest, boolean linkToCashSession) {
        BigDecimal amount = paymentRequest.getAmount().setScale(MONEY_SCALE, ROUNDING_MODE);
        PaymentMethod method = paymentRequest.getMethod();
        LocalDateTime paidAt = paymentRequest.getPaidAt() != null ? paymentRequest.getPaidAt() : LocalDateTime.now();

        SalePayment payment = SalePayment.builder()
                .sale(sale)
                .amountPaid(amount)
                .paymentMethod(method)
                .paidAt(paidAt)
                .paymentReference(paymentRequest.getReference())
                .notes(paymentRequest.getNotes())
                .build();

        if (linkToCashSession && method == PaymentMethod.CASH) {
            CashSession cashSession = cashSessionRepository
                    .findFirstByBranchIdAndCashierIdAndStatus(branch.getId(), sale.getSeller().getId(), CashSessionStatus.OPEN)
                    .orElse(null);
            payment.setCashSession(cashSession);
        }

        return payment;
    }

    private void registerProductMovements(List<PendingProductMovement> productMovements) {
        productMovements.forEach(pending -> {
            SaleDetail detail = pending.detail();
            kardexService.registerMovement(KardexRegistrationRequest.builder()
                    .productId(pending.productId())
                    .branchId(pending.branchId())
                    .batchId(pending.batchId())
                    .quantity(pending.quantity())
                    .unitType(pending.unitType())
                    .type(KardexMovementType.SALE_EXIT)
                    .originId(detail.getId())
                    .originType("SALE_DETAIL")
                    .build());
        });
    }

    private void markServicesAsBilled(List<PendingServiceMark> serviceMarks) {
        serviceMarks.forEach(mark ->
                billableServiceRegistry.markAsBilled(mark.type(), mark.itemId(), mark.detail().getId()));
    }

    private void validateStockAvailability(
            Product product,
            Long branchId,
            BigDecimal quantity,
            ProductUnitType unitType,
            ProductSaleMode saleMode,
            Map<Long, BigDecimal> reservedByProduct,
            boolean finalizeSale
    ) {
        if (!finalizeSale) {
            return;
        }

        BigDecimal requiredBase;
        if (saleMode != null) {
            requiredBase = quantity.multiply(BigDecimal.valueOf(saleMode.getQuantityEquivalent()));
        } else {
            requiredBase = kardexService.convertToBaseUnit(product.getId(), quantity, unitType);
        }

        BigDecimal alreadyReserved = reservedByProduct.getOrDefault(product.getId(), ZERO);
        BigDecimal currentStock = kardexService.getCurrentStock(product.getId(), branchId);
        BigDecimal available = currentStock.subtract(alreadyReserved);

        if (available.compareTo(requiredBase) < 0) {
            throw new InsufficientStockException("Stock insuficiente para el producto: " + product.getName());
        }

        reservedByProduct.put(product.getId(), alreadyReserved.add(requiredBase));
    }

    private ProductUnitType resolveUnitType(SaleDetail detail) {
        if (detail.getUnitType() != null) {
            return detail.getUnitType();
        }
        return detail.getProduct() != null ? detail.getProduct().getUnitType() : ProductUnitType.UNIT;
    }

    private record PendingProductMovement(
            SaleDetail detail,
            Long productId,
            Long branchId,
            Long batchId,
            BigDecimal quantity,
            ProductUnitType unitType
    ) {
    }

    private record PendingServiceMark(
            SaleDetail detail,
            BillableServiceType type,
            Long itemId
    ) {
    }
}
