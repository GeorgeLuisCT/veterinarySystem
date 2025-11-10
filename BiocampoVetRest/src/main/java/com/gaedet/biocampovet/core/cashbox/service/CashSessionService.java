package com.gaedet.biocampovet.core.cashbox.service;

import com.gaedet.biocampovet.core.branches.entity.Branch;
import com.gaedet.biocampovet.core.branches.repository.BranchRepository;
import com.gaedet.biocampovet.core.cashbox.dto.request.CloseCashSessionRequest;
import com.gaedet.biocampovet.core.cashbox.dto.request.OpenCashSessionRequest;
import com.gaedet.biocampovet.core.cashbox.dto.request.RegisterCashMovementRequest;
import com.gaedet.biocampovet.core.cashbox.dto.response.*;
import com.gaedet.biocampovet.core.cashbox.entity.CashSession;
import com.gaedet.biocampovet.core.cashbox.entity.CashSessionMovement;
import com.gaedet.biocampovet.core.cashbox.enums.CashMovementType;
import com.gaedet.biocampovet.core.cashbox.enums.CashSessionStatus;
import com.gaedet.biocampovet.core.cashbox.repository.CashSessionMovementRepository;
import com.gaedet.biocampovet.core.cashbox.repository.CashSessionRepository;
import com.gaedet.biocampovet.core.cashbox.specs.CashSessionSpecs;
import com.gaedet.biocampovet.core.finance.enums.AccountMovementType;
import com.gaedet.biocampovet.core.finance.service.AccountMovementService;
import com.gaedet.biocampovet.core.global.PaginatedResponse;
import com.gaedet.biocampovet.core.sales.entity.Sale;
import com.gaedet.biocampovet.core.sales.entity.SalePayment;
import com.gaedet.biocampovet.core.sales.enums.PaymentMethod;
import com.gaedet.biocampovet.core.sales.repository.SalePaymentRepository;
import com.gaedet.biocampovet.core.users.entity.User;
import com.gaedet.biocampovet.core.users.repository.UserRepository;
import com.gaedet.biocampovet.exeption.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CashSessionService {

    private final CashSessionRepository cashSessionRepository;
    private final CashSessionMovementRepository cashSessionMovementRepository;
    private final SalePaymentRepository salePaymentRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final AccountMovementService accountMovementService;

    private static final RoundingMode ROUNDING_MODE = RoundingMode.HALF_UP;
    private static final int MONEY_SCALE = 2;
    private static final BigDecimal ZERO = BigDecimal.ZERO;

    @Transactional
    public CashSessionSummaryResponse openSession(OpenCashSessionRequest request) {
        Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new EntityNotFoundException("Sucursal no encontrada"));

        User cashier = userRepository.findById(request.getCashierId())
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));

        cashSessionRepository.findFirstByBranchIdAndStatusOrderByOpenedAtDesc(branch.getId(), CashSessionStatus.OPEN)
                .ifPresent(session -> {
                    throw new BadRequestException("Ya existe una sesión de caja abierta para la sucursal");
                });

        CashSession session = CashSession.builder()
                .branch(branch)
                .cashier(cashier)
                .openingAmount(request.getOpeningAmount().setScale(MONEY_SCALE, ROUNDING_MODE))
                .status(CashSessionStatus.OPEN)
                .openedAt(LocalDateTime.now())
                .build();

        CashSession saved = cashSessionRepository.save(session);

        return buildSummary(saved);
    }

    @Transactional(readOnly = true)
    public CashSessionDetailResponse getActiveSession(Long branchId) {
        return cashSessionRepository
                .findFirstByBranchIdAndStatusOrderByOpenedAtDesc(branchId, CashSessionStatus.OPEN)
                .map(this::buildDetailResponse)
                .orElseGet(this::buildDetailResponseClosed);
    }

    @Transactional
    public CashSessionDetailResponse registerMovement(Long sessionId, RegisterCashMovementRequest request) {
        CashSession session = cashSessionRepository.findById(sessionId)
                .orElseThrow(() -> new EntityNotFoundException("Sesión de caja no encontrada"));

        if (session.getStatus() != CashSessionStatus.OPEN) {
            throw new BadRequestException("Solo se pueden registrar movimientos en sesiones abiertas");
        }

        if (request.getMovementType() == CashMovementType.EXPENSE && request.getAmount().compareTo(ZERO) <= 0) {
            throw new BadRequestException("Los egresos deben tener un monto positivo");
        }

        User registeredBy = userRepository.findById(request.getRegisteredById())
                .orElseThrow(() -> new EntityNotFoundException("Usuario registrador no encontrado"));

        CashSessionMovement movement = CashSessionMovement.builder()
                .cashSession(session)
                .movementType(request.getMovementType())
                .amount(request.getAmount().setScale(MONEY_SCALE, ROUNDING_MODE))
                .reason(request.getReason())
                .registeredBy(registeredBy)
                .reference(request.getReference())
                .build();

        cashSessionMovementRepository.save(movement);

        return buildDetailResponse(session);
    }

    @Transactional
    public CashSessionSummaryResponse closeSession(Long sessionId, CloseCashSessionRequest request) {
        CashSession session = cashSessionRepository.findById(sessionId)
                .orElseThrow(() -> new EntityNotFoundException("Sesión de caja no encontrada"));

        if (session.getStatus() != CashSessionStatus.OPEN) {
            throw new BadRequestException("La sesión ya se encuentra cerrada");
        }

        CashSessionSummaryResponse summaryBeforeClose = buildSummary(session);

        BigDecimal counted = request.getCountedClosingAmount().setScale(MONEY_SCALE, ROUNDING_MODE);
        BigDecimal calculated = summaryBeforeClose.getCalculatedClosingAmount();
        BigDecimal difference = counted.subtract(calculated).setScale(MONEY_SCALE, ROUNDING_MODE);

        Map<PaymentMethod, BigDecimal> paymentTotals = getPaymentMethodTotals(session.getId());
        Map<PaymentMethod, Long> transferTargets = normalizeTransferTargets(request.getPaymentTransfers());
        registerCashboxTransfers(session, paymentTotals, transferTargets);

        session.setStatus(CashSessionStatus.CLOSED);
        session.setClosedAt(LocalDateTime.now());
        session.setCountedClosingAmount(counted);
        session.setCalculatedClosingAmount(calculated);
        session.setDifferenceAmount(difference);
        session.setClosingNotes(request.getNotes());

        CashSession saved = cashSessionRepository.save(session);

        return buildSummary(saved);
    }

    @Transactional(readOnly = true)
    public CashSessionDetailResponse getSessionDetail(Long sessionId) {
        CashSession session = cashSessionRepository.findById(sessionId)
                .orElseThrow(() -> new EntityNotFoundException("Sesión de caja no encontrada"));
        return buildDetailResponse(session);
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<CashSessionHistoryResponse> listHistory(
            Long branchId,
            Long cashierId,
            LocalDateTime startDate,
            LocalDateTime endDate,
            int page,
            int size
    ) {
        Specification<CashSession> spec = CashSessionSpecs.byFilters(
                branchId, cashierId, startDate, endDate
        );

        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.max(size, 1),
                Sort.by("openedAt").descending()
        );

        Page<CashSession> paged = cashSessionRepository.findAll(spec, pageable);

        Page<CashSessionHistoryResponse> pagedDto = paged.map(this::buildHistoryResponse);

        return PaginatedResponse.<CashSessionHistoryResponse>builder()
                .content(pagedDto.getContent())
                .totalPages(pagedDto.getTotalPages())
                .totalElements(pagedDto.getTotalElements())
                .currentPage(pagedDto.getNumber())
                .pageSize(pagedDto.getSize())
                .build();
    }

    private CashSessionDetailResponse buildDetailResponse(CashSession session) {
        CashSessionSummaryResponse summary = buildSummary(session);

        List<CashMovementResponse> movements = cashSessionMovementRepository.findByCashSessionId(session.getId())
                .stream()
                .map(this::toMovementResponse)
                .toList();

        List<CashboxPaymentBreakdownResponse> breakdown = buildPaymentBreakdown(session.getId());

        List<SalePayment> salePayments = salePaymentRepository.findAllWithDetailsByCashSessionId(session.getId());
        List<CashSessionSalePaymentResponse> salePaymentDetails = salePayments.stream()
                .map(this::toSalePaymentResponse)
                .toList();

        return CashSessionDetailResponse.builder()
                .open(session.getStatus() == CashSessionStatus.OPEN)
                .session(summary)
                .movements(movements)
                .paymentBreakdown(breakdown)
                .salePayments(salePaymentDetails)
                .build();
    }

    private Map<PaymentMethod, Long> normalizeTransferTargets(List<CloseCashSessionRequest.PaymentTransferAllocation> allocations) {
        Map<PaymentMethod, Long> targets = new EnumMap<>(PaymentMethod.class);
        if (allocations == null) {
            return targets;
        }
        allocations.stream()
                .filter(Objects::nonNull)
                .forEach(allocation -> {
                    if (allocation.getPaymentMethod() != null) {
                        targets.put(allocation.getPaymentMethod(), allocation.getTreasuryAccountId());
                    }
                });
        return targets;
    }

    private void registerCashboxTransfers(CashSession session,
                                          Map<PaymentMethod, BigDecimal> totals,
                                          Map<PaymentMethod, Long> targets) {
        totals.forEach((method, amount) -> {
            BigDecimal normalized = amount.setScale(MONEY_SCALE, ROUNDING_MODE);
            if (normalized.compareTo(BigDecimal.ZERO) <= 0) {
                return;
            }
            Long accountId = targets.get(method);
            if (accountId == null) {
                throw new BadRequestException("Selecciona una cuenta para " + method.getLabel());
            }
            accountMovementService.registerMovement(
                    accountId,
                    normalized,
                    AccountMovementType.CASHBOX_CLOSING,
                    "Cierre caja #" + session.getId() + " - " + method.getLabel(),
                    LocalDateTime.now(),
                    null
            );
        });
    }

    private Map<PaymentMethod, BigDecimal> getPaymentMethodTotals(Long sessionId) {
        Map<PaymentMethod, BigDecimal> totals = new EnumMap<>(PaymentMethod.class);
        salePaymentRepository.sumByCashSessionGrouped(sessionId).forEach(row -> {
            PaymentMethod method = (PaymentMethod) row[0];
            BigDecimal amount = (BigDecimal) row[1];
            if (amount == null) {
                return;
            }
            amount = amount.setScale(MONEY_SCALE, ROUNDING_MODE);
            totals.merge(method, amount, BigDecimal::add);
        });

        for (PaymentMethod method : PaymentMethod.values()) {
            totals.putIfAbsent(method, BigDecimal.ZERO.setScale(MONEY_SCALE, ROUNDING_MODE));
        }
        return totals;
    }

    private List<CashboxPaymentBreakdownResponse> buildPaymentBreakdown(Long sessionId) {
        Map<PaymentMethod, BigDecimal> totals = getPaymentMethodTotals(sessionId);
        return totals.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> CashboxPaymentBreakdownResponse.builder()
                        .paymentMethod(entry.getKey())
                        .label(entry.getKey().getLabel())
                        .amount(entry.getValue())
                        .build())
                .collect(Collectors.toList());
    }

    private CashSessionSummaryResponse buildSummary(CashSession session) {
        BigDecimal totalSales = sumSales(session.getId());
        BigDecimal totalIncomeMovements = sumMovements(session.getId(), CashMovementType.INCOME);
        BigDecimal totalExpenseMovements = sumMovements(session.getId(), CashMovementType.EXPENSE);

        BigDecimal calculated = session.getOpeningAmount()
                .add(totalSales)
                .add(totalIncomeMovements)
                .subtract(totalExpenseMovements)
                .setScale(MONEY_SCALE, ROUNDING_MODE);

        String branchName = session.getBranch() != null ? session.getBranch().getName() : null;
        String cashierName = null;
        if (session.getCashier() != null && session.getCashier().getEmployee() != null) {
            cashierName = session.getCashier().getEmployee().getFullName();
        }

        return CashSessionSummaryResponse.builder()
                .id(session.getId())
                .branchId(session.getBranch() != null ? session.getBranch().getId() : null)
                .branchName(branchName)
                .cashierId(session.getCashier() != null ? session.getCashier().getId() : null)
                .cashierName(cashierName)
                .status(session.getStatus())
                .openedAt(session.getOpenedAt())
                .closedAt(session.getClosedAt())
                .openingAmount(session.getOpeningAmount())
                .totalSales(totalSales)
                .totalIncomeMovements(totalIncomeMovements)
                .totalExpenseMovements(totalExpenseMovements)
                .calculatedClosingAmount(calculated)
                .countedClosingAmount(session.getCountedClosingAmount())
                .differenceAmount(session.getDifferenceAmount())
                .notes(session.getClosingNotes())
                .build();
    }

    private CashSessionHistoryResponse buildHistoryResponse(CashSession session) {
        String branchName = session.getBranch() != null ? session.getBranch().getName() : null;
        String cashierName = null;
        if (session.getCashier() != null && session.getCashier().getEmployee() != null) {
            cashierName = session.getCashier().getEmployee().getFullName();
        }

        BigDecimal calculated = session.getCalculatedClosingAmount();
        if (calculated == null) {
            calculated = buildSummary(session).getCalculatedClosingAmount();
        }

        return CashSessionHistoryResponse.builder()
                .id(session.getId())
                .branchId(session.getBranch() != null ? session.getBranch().getId() : null)
                .branchName(branchName)
                .cashierId(session.getCashier() != null ? session.getCashier().getId() : null)
                .cashierName(cashierName)
                .openedAt(session.getOpenedAt())
                .closedAt(session.getClosedAt())
                .openingAmount(session.getOpeningAmount())
                .calculatedClosingAmount(calculated)
                .countedClosingAmount(session.getCountedClosingAmount())
                .differenceAmount(session.getDifferenceAmount())
                .notes(session.getClosingNotes())
                .build();
    }

    private BigDecimal sumSales(Long sessionId) {
        List<SalePayment> payments = salePaymentRepository.findByCashSessionId(sessionId);
        return payments.stream()
                .map(SalePayment::getAmountPaid)
                .reduce(ZERO, BigDecimal::add)
                .setScale(MONEY_SCALE, ROUNDING_MODE);
    }

    private BigDecimal sumMovements(Long sessionId, CashMovementType type) {
        return cashSessionMovementRepository.findByCashSessionId(sessionId).stream()
                .filter(movement -> movement.getMovementType() == type)
                .map(CashSessionMovement::getAmount)
                .reduce(ZERO, BigDecimal::add)
                .setScale(MONEY_SCALE, ROUNDING_MODE);
    }

    private CashMovementResponse toMovementResponse(CashSessionMovement movement) {
        String registeredName = null;
        if (movement.getRegisteredBy() != null && movement.getRegisteredBy().getEmployee() != null) {
            registeredName = movement.getRegisteredBy().getEmployee().getFullName();
        }

        return CashMovementResponse.builder()
                .id(movement.getId())
                .movementType(movement.getMovementType())
                .amount(movement.getAmount())
                .reason(movement.getReason())
                .registeredById(movement.getRegisteredBy() != null ? movement.getRegisteredBy().getId() : null)
                .registeredByName(registeredName)
                .registeredAt(movement.getRegisteredAt())
                .reference(movement.getReference())
                .build();
    }

    private CashSessionSalePaymentResponse toSalePaymentResponse(SalePayment payment) {
        Sale sale = payment.getSale();
        String customerName = "Cliente General";
        if (sale.getCustomer() != null) {
            customerName = sale.getCustomer().getName();
        }

        String typeLabel = sale.getDocumentType().getLabel();
        String docNumber = sale.getDocumentNumber();
        String document;

        if (docNumber != null && !docNumber.isBlank()) {
            document = typeLabel + " " + docNumber;
        } else {
            document = typeLabel;
        }

        return new CashSessionSalePaymentResponse(
                payment.getId(),
                sale.getId(),
                payment.getPaidAt(),
                payment.getPaymentMethod(),
                payment.getAmountPaid(),
                customerName,
                document,
                sale.getGrandTotal()
        );
    }

    private CashSessionDetailResponse buildDetailResponseClosed() {
        return CashSessionDetailResponse.builder()
                .open(false)
                .session(null)
                .movements(java.util.Collections.emptyList())
                .paymentBreakdown(java.util.Collections.emptyList())
                .salePayments(java.util.Collections.emptyList())
                .build();
    }
}
