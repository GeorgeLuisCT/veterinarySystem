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
import com.gaedet.biocampovet.core.sales.dto.FinalizeSaleRequest;
import com.gaedet.biocampovet.core.sales.dto.PendingProductMovement;
import com.gaedet.biocampovet.core.sales.dto.PendingServiceMark;
import com.gaedet.biocampovet.core.sales.dto.UpdateSaleRequest;
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
import java.time.LocalDate;
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

    private static final int MONEY_SCALE = 2;
    private static final RoundingMode ROUNDING_MODE = RoundingMode.HALF_UP;

    @Transactional
    public SaleResponse createSale(CreateSaleRequest request) {
        boolean finalizeSale = request.isFinalizeSale();

        Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new EntityNotFoundException("Sucursal no encontrada"));

        User seller = userRepository.findById(request.getSellerId())
                .orElseThrow(() -> new EntityNotFoundException("Usuario vendedor no encontrado"));

        Sale sale = Sale.builder()
                .branch(branch)
                .seller(seller)
                .build();

        return buildAndPersistSale(sale, branch, seller, request, finalizeSale);
    }

    @Transactional
    public SaleResponse updateSale(Long saleId, UpdateSaleRequest request) {
        Sale sale = getDraftSale(saleId);

        if (request.getBranchId() != null && !request.getBranchId().equals(sale.getBranch().getId())) {
            Branch branch = branchRepository.findById(request.getBranchId())
                    .orElseThrow(() -> new EntityNotFoundException("Sucursal no encontrada"));
            sale.setBranch(branch);
        }

        if (request.getSellerId() != null && !request.getSellerId().equals(sale.getSeller().getId())) {
            User seller = userRepository.findById(request.getSellerId())
                    .orElseThrow(() -> new EntityNotFoundException("Usuario vendedor no encontrado"));
            sale.setSeller(seller);
        }

        if (request.getCustomerId() != null) {
            if (sale.getCustomer() == null || !request.getCustomerId().equals(sale.getCustomer().getId())) {
                Customer customer = customerRepository.findById(request.getCustomerId())
                        .orElseThrow(() -> new EntityNotFoundException("Cliente no encontrado"));
                sale.setCustomer(customer);
            }
        } else {
            sale.setCustomer(null);
        }

        sale.setDocumentType(request.getDocumentType());
        sale.setDocumentNumber(request.getDocumentNumber());
        sale.setNotes(request.getNotes());
        sale.setSourceAttentionId(request.getSourceAttentionId());

        Sale savedSale = saleRepository.save(sale);
        return SaleMapper.toResponse(savedSale);
    }

    @Transactional(readOnly = true)
    public SaleResponse getSale(Long saleId) {
        Sale sale = saleRepository.findById(saleId)
                .orElseThrow(() -> new EntityNotFoundException("Venta no encontrada"));
        return SaleMapper.toResponse(sale);
    }

    @Transactional(readOnly = true)
    public Page<SaleSummaryResponse> listSales(Pageable pageable) {
        return saleRepository.findAll(pageable).map(SaleMapper::toSummary);
    }

    @Transactional(readOnly = true)
    public List<SaleSummaryResponse> listPendingSales(Long branchId) {
        List<Sale> sales;
        if (branchId != null && branchId > 0) {
            sales = saleRepository.findByBranchIdAndStatus(branchId, SaleStatus.DRAFT);
        } else {
            sales = saleRepository.findByStatus(SaleStatus.DRAFT);
        }
        return sales.stream().map(SaleMapper::toSummary).toList();
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

        sale.getDetails().stream()
                .filter(detail -> detail.getServiceType() != null && detail.getServiceItemId() != null)
                .forEach(detail -> billableServiceRegistry.markAsUnbilled(detail.getServiceType(), detail.getServiceItemId()));

        return SaleMapper.toResponse(sale);
    }

    @Transactional(readOnly = true)
    public List<BillableServiceItem> listBillableItems(Long branchId, Long attentionId, Long patientId, String query) {
        return List.of();
    }

    private SaleResponse buildAndPersistSale(
            Sale sale,
            Branch branch,
            User seller,
            CreateSaleRequest request,
            boolean finalizeSale
    ) {
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

        Map<Long, BigDecimal> reservedByBatch = new HashMap<>();
        List<PendingProductMovement> productMovements = new ArrayList<>();
        List<PendingServiceMark> serviceMarks = new ArrayList<>();

        for (SaleItemRequest item : request.getItems()) {
            List<SaleDetail> newDetails = mapSaleDetailsFromRequest(
                    sale,
                    branch,
                    item,
                    reservedByBatch,
                    productMovements,
                    serviceMarks,
                    finalizeSale
            );

            sale.getDetails().addAll(newDetails);

            for (SaleDetail detail : newDetails) {
                subtotal = subtotal.add(detail.getLineSubtotal());
                taxTotal = taxTotal.add(detail.getTaxAmount() == null ? ZERO : detail.getTaxAmount());
            }
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
            return SaleMapper.toResponse(savedSale);
        }

        sale.setStatus(SaleStatus.COMPLETED);
        Sale savedSale = saleRepository.saveAndFlush(sale);

        registerProductMovements(productMovements);
        markServicesAsBilled(serviceMarks);

        return SaleMapper.toResponse(savedSale);
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

    private ProductUnitType resolveUnitType(SaleDetail detail) {
        if (detail.getUnitType() != null) {
            return detail.getUnitType();
        }
        return detail.getProduct() != null ? detail.getProduct().getUnitType() : ProductUnitType.UNIT;
    }

    @Transactional
    public SaleResponse addDetailToSale(Long saleId, SaleItemRequest itemRequest) {
        Sale sale = getDraftSale(saleId);

        List<SaleDetail> newDetails = mapSaleDetailsFromRequest(
                sale,
                sale.getBranch(),
                itemRequest,
                new HashMap<>(),
                new ArrayList<>(),
                new ArrayList<>(),
                false
        );

        sale.getDetails().addAll(newDetails);
        recalculateSaleTotals(sale);

        return SaleMapper.toResponse(sale);
    }

    @Transactional
    public SaleResponse updateSaleDetail(Long saleId, Long detailId, SaleItemRequest itemRequest) {
        Sale sale = getDraftSale(saleId);

        SaleDetail existingDetail = sale.getDetails().stream()
                .filter(d -> d.getId().equals(detailId))
                .findFirst()
                .orElseThrow(() -> new EntityNotFoundException("Detalle de venta no encontrado con ID: " + detailId));

        sale.getDetails().remove(existingDetail);

        List<SaleDetail> newDetails = mapSaleDetailsFromRequest(
                sale,
                sale.getBranch(),
                itemRequest,
                new HashMap<>(),
                new ArrayList<>(),
                new ArrayList<>(),
                false
        );

        sale.getDetails().addAll(newDetails);

        recalculateSaleTotals(sale);
        Sale savedSale = saleRepository.save(sale);

        return SaleMapper.toResponse(savedSale);
    }

    @Transactional
    public void deleteSaleDetail(Long saleId, Long detailId) {
        Sale sale = getDraftSale(saleId);

        SaleDetail detail = sale.getDetails().stream()
                .filter(d -> d.getId().equals(detailId))
                .findFirst()
                .orElseThrow(() -> new EntityNotFoundException("Detalle de venta no encontrado"));

        sale.getDetails().remove(detail);
        recalculateSaleTotals(sale);

        saleRepository.save(sale);
    }

    @Transactional
    public SaleResponse addPaymentToSale(Long saleId, SalePaymentRequest paymentRequest) {
        Sale sale = getDraftSale(saleId);

        SalePayment payment = mapSalePayment(
                sale,
                sale.getBranch(),
                paymentRequest,
                false
        );

        sale.getPayments().add(payment);

        Sale savedSale = saleRepository.save(sale);
        return SaleMapper.toResponse(savedSale);
    }

    @Transactional
    public SaleResponse updateSalePayment(Long saleId, Long paymentId, SalePaymentRequest paymentRequest) {
        Sale sale = getDraftSale(saleId);

        SalePayment payment = sale.getPayments().stream()
                .filter(p -> p.getId().equals(paymentId))
                .findFirst()
                .orElseThrow(() -> new EntityNotFoundException("Pago no encontrado"));

        payment.setAmountPaid(paymentRequest.getAmount().setScale(MONEY_SCALE, ROUNDING_MODE));
        payment.setPaymentMethod(paymentRequest.getMethod());
        payment.setPaidAt(paymentRequest.getPaidAt() != null ? paymentRequest.getPaidAt() : LocalDateTime.now());
        payment.setPaymentReference(paymentRequest.getReference());
        payment.setNotes(paymentRequest.getNotes());

        Sale savedSale = saleRepository.save(sale);
        return SaleMapper.toResponse(savedSale);
    }

    @Transactional
    public void deleteSalePayment(Long saleId, Long paymentId) {
        Sale sale = getDraftSale(saleId);

        SalePayment payment = sale.getPayments().stream()
                .filter(p -> p.getId().equals(paymentId))
                .findFirst()
                .orElseThrow(() -> new EntityNotFoundException("Pago no encontrado"));

        sale.getPayments().remove(payment);

        saleRepository.save(sale);
    }

    @Transactional
    public SaleResponse finalizeSale(Long saleId, FinalizeSaleRequest request) {
        Sale sale = getDraftSale(saleId);
        Branch branch = sale.getBranch();

        if (request.getPayments() != null) {
            for (SalePaymentRequest paymentRequest : request.getPayments()) {
                SalePayment payment = mapSalePayment(sale, branch, paymentRequest, true);
                sale.getPayments().add(payment);
            }
        }

        BigDecimal paidTotal = sale.getPayments().stream()
                .map(SalePayment::getAmountPaid)
                .reduce(ZERO, BigDecimal::add);

        if (paidTotal.compareTo(sale.getGrandTotal()) < 0) {
            throw new BadRequestException("El total pagado (" + paidTotal + ") es menor al total de la venta (" + sale.getGrandTotal() + ")");
        }

        Map<Long, BigDecimal> reservedByProduct = new HashMap<>();
        List<PendingProductMovement> productMovements = new ArrayList<>();
        List<PendingServiceMark> serviceMarks = new ArrayList<>();

        for (SaleDetail detail : sale.getDetails()) {

            if (detail.getProduct() != null) {
                Product product = detail.getProduct();
                ProductSaleMode saleMode = detail.getSaleMode();
                ProductUnitType unitType = detail.getUnitType();
                ProductBatch batch = detail.getProductBatch();

                BigDecimal quantityInSaleUnits = detail.getQuantity();
                BigDecimal factor = BigDecimal.valueOf(saleMode.getQuantityEquivalent());
                BigDecimal quantityInBaseUnits = quantityInSaleUnits.multiply(factor);

                BigDecimal stockInBatchBase = kardexService.getCurrentStock(product.getId(), branch.getId(), batch.getId());
                BigDecimal alreadyReservedBase = reservedByProduct.getOrDefault(batch.getId(), ZERO); // Reservas por LOTE

                BigDecimal availableBase = stockInBatchBase.subtract(alreadyReservedBase);

                if (availableBase.compareTo(quantityInBaseUnits) < 0) {
                    throw new InsufficientStockException(
                            "Stock insuficiente para " + product.getName() + " (Lote: " + batch.getBatchNumber() + "). " +
                                    "Se intentan vender " + quantityInSaleUnits + " " + unitType.name() +
                                    " pero solo hay " + availableBase.divide(factor, 3, ROUNDING_MODE) + " disponibles."
                    );
                }

                reservedByProduct.put(batch.getId(), alreadyReservedBase.add(quantityInBaseUnits));

                productMovements.add(new PendingProductMovement(
                        detail,
                        product.getId(),
                        branch.getId(),
                        batch.getId(),
                        quantityInSaleUnits,
                        unitType
                ));

            } else if (detail.getServiceType() != null) {
                serviceMarks.add(new PendingServiceMark(
                        detail,
                        detail.getServiceType(),
                        detail.getServiceItemId()
                ));
            }
        }

        CashSession openSession = null;
        boolean sessionSearched = false;

        for (SalePayment payment : sale.getPayments()) {
            if (payment.getPaymentMethod() == PaymentMethod.CASH && payment.getCashSession() == null) {
                if (!sessionSearched) {
                    openSession = cashSessionRepository
                            .findFirstByBranchIdAndCashierIdAndStatus(branch.getId(), sale.getSeller().getId(), CashSessionStatus.OPEN)
                            .orElse(null);
                    sessionSearched = true;
                }
                payment.setCashSession(openSession);
            }
        }

        sale.setStatus(SaleStatus.COMPLETED);
        Sale savedSale = saleRepository.saveAndFlush(sale);

        registerProductMovements(productMovements);
        markServicesAsBilled(serviceMarks);

        return SaleMapper.toResponse(savedSale);
    }

    private Sale getDraftSale(Long saleId) {
        Sale sale = saleRepository.findById(saleId)
                .orElseThrow(() -> new EntityNotFoundException("Venta no encontrada con ID: " + saleId));

        if (sale.getStatus() != SaleStatus.DRAFT) {
            throw new BadRequestException("Solo se puede modificar una venta en estado DRAFT (borrador)");
        }

        return sale;
    }

    private void recalculateSaleTotals(Sale sale) {
        BigDecimal subtotal = ZERO;
        BigDecimal taxTotal = ZERO;

        for (SaleDetail detail : sale.getDetails()) {
            subtotal = subtotal.add(detail.getLineSubtotal());
            taxTotal = taxTotal.add(detail.getTaxAmount() == null ? ZERO : detail.getTaxAmount());
        }

        subtotal = subtotal.setScale(MONEY_SCALE, ROUNDING_MODE);
        taxTotal = taxTotal.setScale(MONEY_SCALE, ROUNDING_MODE);
        BigDecimal grandTotal = subtotal.add(taxTotal).setScale(MONEY_SCALE, ROUNDING_MODE);

        sale.setSubtotal(subtotal);
        sale.setTaxTotal(taxTotal);
        sale.setGrandTotal(grandTotal);
    }
    private List<SaleDetail> mapSaleDetailsFromRequest(
            Sale sale,
            Branch branch,
            SaleItemRequest item,
            Map<Long, BigDecimal> reservedByProduct,
            List<PendingProductMovement> productMovements,
            List<PendingServiceMark> serviceMarks,
            boolean finalizeSale
    ) {
        if (item.getKind() == SaleItemKind.SERVICE) {
            return List.of(mapServiceDetail(sale, branch, item, serviceMarks));
        }

        if (item.getKind() == SaleItemKind.PRODUCT) {
            return mapProductDetails(sale, branch, item, productMovements, reservedByProduct, finalizeSale);
        }

        throw new BadRequestException("Tipo de ítem de venta no soportado");
    }


    private List<SaleDetail> mapProductDetails(
            Sale sale,
            Branch branch,
            SaleItemRequest item,
            List<PendingProductMovement> productMovements,
            Map<Long, BigDecimal> reservedByBatch,
            boolean finalizeSale
    ) {
        Product product = productRepository.findById(item.getProductId())
                .orElseThrow(() -> new EntityNotFoundException("Producto no encontrado"));

        ProductSaleMode saleMode = productSaleModeRepository.findById(item.getSaleModeId())
                .orElseThrow(() -> new BadRequestException("Modo de venta no encontrado"));

        if (!saleMode.getProduct().getId().equals(product.getId())) {
            throw new BadRequestException("El modo de venta no pertenece al producto seleccionado");
        }

        ProductUnitType unitType = saleMode.getUnitType();
        BigDecimal quantityNeededSaleUnits = item.getQuantity().setScale(3, ROUNDING_MODE);
        BigDecimal unitPrice = item.getUnitPrice().setScale(MONEY_SCALE, ROUNDING_MODE);
        BigDecimal factor = BigDecimal.valueOf(saleMode.getQuantityEquivalent());

        if (factor.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("El modo de venta tiene un factor de equivalencia inválido.");
        }


        BigDecimal quantityToFulfillBase = quantityNeededSaleUnits.multiply(factor);
        List<SaleDetail> newDetails = new ArrayList<>();

        List<ProductBatch> availableBatches = productBatchRepository
                .findAllByProductIdAndExpirationDateGreaterThanEqualOrderByExpirationDateAsc(
                        product.getId(),
                        LocalDate.now()
                );

        if (availableBatches.isEmpty()) {
            throw new BadRequestException("No se encontraron lotes disponibles (no expirados) para el producto: " + product.getName());
        }

        Map<Long, BigDecimal> stockPerBatch = kardexService.getStockForProductByBatch(
                product.getId(),
                branch.getId()
        );

        for (ProductBatch batch : availableBatches) {
            if (quantityToFulfillBase.compareTo(ZERO) <= 0) {
                break;
            }

            BigDecimal stockInBatchBase = stockPerBatch.getOrDefault(batch.getId(), ZERO);

            BigDecimal alreadyReservedBase = reservedByBatch.getOrDefault(batch.getId(), ZERO);

            BigDecimal availableInBatchBase = stockInBatchBase.subtract(alreadyReservedBase);

            if (availableInBatchBase.compareTo(ZERO) <= 0) {
                continue;
            }

            BigDecimal quantityToTakeBase = availableInBatchBase.min(quantityToFulfillBase);

            BigDecimal quantityToTakeSaleUnits = quantityToTakeBase.divide(factor, 3, ROUNDING_MODE);

            if (quantityToTakeSaleUnits.compareTo(ZERO) <= 0) {
                continue;
            }

            BigDecimal lineSubtotal = unitPrice.multiply(quantityToTakeSaleUnits).setScale(MONEY_SCALE, ROUNDING_MODE);
            BigDecimal taxAmount = calculateTax(lineSubtotal, item.getTaxRate(), item.getTaxAmount());

            String description = item.getDescriptionOverride() != null ? item.getDescriptionOverride()
                    : (product.getName() + " - " + unitType.name() + " (Lote: " + batch.getBatchNumber() + ")");

            SaleDetail detail = SaleDetail.builder()
                    .sale(sale)
                    .itemDescription(description)
                    .unitPrice(unitPrice)
                    .quantity(quantityToTakeSaleUnits)
                    .lineSubtotal(lineSubtotal)
                    .taxRate(item.getTaxRate() != null ? item.getTaxRate() : ZERO)
                    .taxAmount(taxAmount)
                    .metadataJson(item.getMetadataJson())
                    .product(product)
                    .productBatch(batch)
                    .saleMode(saleMode)
                    .unitType(unitType)
                    .build();

            newDetails.add(detail);

            if (finalizeSale) {
                productMovements.add(new PendingProductMovement(
                        detail,
                        product.getId(),
                        branch.getId(),
                        batch.getId(),
                        quantityToTakeSaleUnits,
                        unitType
                ));
            }

            quantityToFulfillBase = quantityToFulfillBase.subtract(quantityToTakeBase);
            reservedByBatch.put(batch.getId(), alreadyReservedBase.add(quantityToTakeBase));
        }

        if (quantityToFulfillBase.compareTo(ZERO) > 0) {
            BigDecimal fulfilledSaleUnits = quantityNeededSaleUnits.subtract(quantityToFulfillBase.divide(factor, 3, ROUNDING_MODE));
            throw new InsufficientStockException(
                    "Stock insuficiente para " + product.getName() + ". Se pidieron " + quantityNeededSaleUnits
                            + " " + unitType.name() + " pero solo hay " + fulfilledSaleUnits + " disponibles."
            );
        }

        return newDetails;
    }

    private SaleDetail mapServiceDetail(
            Sale sale,
            Branch branch,
            SaleItemRequest item,
            List<PendingServiceMark> serviceMarks
    ) {
        BigDecimal quantity = item.getQuantity().setScale(3, ROUNDING_MODE);
        BigDecimal unitPrice = item.getUnitPrice().setScale(MONEY_SCALE, ROUNDING_MODE);
        BigDecimal lineSubtotal = unitPrice.multiply(quantity).setScale(MONEY_SCALE, ROUNDING_MODE);
        BigDecimal taxAmount = calculateTax(lineSubtotal, item.getTaxRate(), item.getTaxAmount());
        String description = item.getDescriptionOverride();

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
            description = billableItem.getDescription();
        }

        if (description == null || description.isBlank()) {
            throw new BadRequestException("El ítem de venta requiere una descripción");
        }

        SaleDetail detail = SaleDetail.builder()
                .sale(sale)
                .itemDescription(description)
                .unitPrice(unitPrice)
                .quantity(quantity)
                .lineSubtotal(lineSubtotal)
                .taxRate(item.getTaxRate() != null ? item.getTaxRate() : ZERO)
                .taxAmount(taxAmount)
                .metadataJson(item.getMetadataJson())
                .serviceType(serviceType)
                .serviceItemId(serviceItemId)
                .build();

        serviceMarks.add(new PendingServiceMark(detail, serviceType, serviceItemId));
        return detail;
    }

    private BigDecimal calculateTax(BigDecimal lineSubtotal, BigDecimal taxRate, BigDecimal taxAmount) {
        taxRate = taxRate != null ? taxRate : ZERO;
        if (taxAmount == null) {
            return lineSubtotal.multiply(taxRate).setScale(MONEY_SCALE, ROUNDING_MODE);
        }
        return taxAmount.setScale(MONEY_SCALE, ROUNDING_MODE);
    }
}