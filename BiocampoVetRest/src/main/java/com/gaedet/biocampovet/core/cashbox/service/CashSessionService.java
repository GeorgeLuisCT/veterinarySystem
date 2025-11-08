package com.gaedet.biocampovet.core.cashbox.service;

import com.gaedet.biocampovet.core.branches.entity.Branch;
import com.gaedet.biocampovet.core.branches.repository.BranchRepository;
import com.gaedet.biocampovet.core.cashbox.dto.request.CloseCashSessionRequest;
import com.gaedet.biocampovet.core.cashbox.dto.request.OpenCashSessionRequest;
import com.gaedet.biocampovet.core.cashbox.dto.request.RegisterCashMovementRequest;
import com.gaedet.biocampovet.core.cashbox.dto.response.CashMovementResponse;
import com.gaedet.biocampovet.core.cashbox.dto.response.CashSessionDetailResponse;
import com.gaedet.biocampovet.core.cashbox.dto.response.CashSessionHistoryResponse;
import com.gaedet.biocampovet.core.cashbox.dto.response.CashSessionSummaryResponse;
import com.gaedet.biocampovet.core.cashbox.entity.CashSession;
import com.gaedet.biocampovet.core.cashbox.entity.CashSessionMovement;
import com.gaedet.biocampovet.core.cashbox.enums.CashMovementType;
import com.gaedet.biocampovet.core.cashbox.enums.CashSessionStatus;
import com.gaedet.biocampovet.core.cashbox.repository.CashSessionMovementRepository;
import com.gaedet.biocampovet.core.cashbox.repository.CashSessionRepository;
import com.gaedet.biocampovet.core.sales.entity.SalePayment;
import com.gaedet.biocampovet.core.sales.repository.SalePaymentRepository;
import com.gaedet.biocampovet.core.users.entity.User;
import com.gaedet.biocampovet.core.users.repository.UserRepository;
import com.gaedet.biocampovet.exeption.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

import static java.math.BigDecimal.ZERO;

@Service
@RequiredArgsConstructor
public class CashSessionService {

    private final CashSessionRepository cashSessionRepository;
    private final CashSessionMovementRepository cashSessionMovementRepository;
    private final SalePaymentRepository salePaymentRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;

    private static final RoundingMode ROUNDING_MODE = RoundingMode.HALF_UP;
    private static final int MONEY_SCALE = 2;

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
                .map(this::buildDetailResponseOpen)
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
    public Page<CashSessionHistoryResponse> listHistory(Long branchId, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1));
        Specification<CashSession> spec = (root, query, cb) -> cb.equal(root.get("status"), CashSessionStatus.CLOSED);
        if (branchId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("branch").get("id"), branchId));
        }
        return cashSessionRepository.findAll(spec, pageable).map(this::buildHistoryResponse);
    }

    @Transactional(readOnly = true)
    public List<CashSessionHistoryResponse> listHistoryForBranchAndDate(Long branchId, LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.atTime(LocalTime.MAX);
        return cashSessionRepository.findByBranchIdAndOpenedAtBetween(branchId, start, end)
                .stream()
                .filter(session -> session.getStatus() == CashSessionStatus.CLOSED)
                .map(this::buildHistoryResponse)
                .collect(Collectors.toList());
    }

    private CashSessionDetailResponse buildDetailResponse(CashSession session) {
        CashSessionSummaryResponse summary = buildSummary(session);
        List<CashMovementResponse> movements = cashSessionMovementRepository.findByCashSessionId(session.getId())
                .stream()
                .map(this::toMovementResponse)
                .collect(Collectors.toList());

        return CashSessionDetailResponse.builder()
                .session(summary)
                .movements(movements)
                .build();
    }

    private CashSessionSummaryResponse buildSummary(CashSession session) {
        BigDecimal totalCashSales = sumCashSales(session.getId());
        BigDecimal totalIncomeMovements = sumMovements(session.getId(), CashMovementType.INCOME);
        BigDecimal totalExpenseMovements = sumMovements(session.getId(), CashMovementType.EXPENSE);

        BigDecimal calculated = session.getOpeningAmount()
                .add(totalCashSales)
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
                .totalCashSales(totalCashSales)
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

    private BigDecimal sumCashSales(Long sessionId) {
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

    private CashSessionDetailResponse buildDetailResponseOpen(CashSession session) {
        return CashSessionDetailResponse.builder()
                .open(true)
                .session(buildSummary(session))
                .movements(
                        session.getMovements().stream()
                                .map(this::toMovementResponse)
                                .toList()
                )
                .build();
    }

    private CashSessionDetailResponse buildDetailResponseClosed() {
        return CashSessionDetailResponse.builder()
                .open(false)
                .session(null)
                .movements(java.util.Collections.emptyList())
                .build();
    }
}
