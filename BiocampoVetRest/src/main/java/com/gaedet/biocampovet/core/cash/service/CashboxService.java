package com.gaedet.biocampovet.core.cash.service;

import com.gaedet.biocampovet.core.branches.entity.Branch;
import com.gaedet.biocampovet.core.cash.dto.CashboxResponse;
import com.gaedet.biocampovet.core.cash.mapper.CashboxMapper;
import com.gaedet.biocampovet.core.global.PaginatedResponse;
import com.gaedet.biocampovet.core.cash.dto.CashboxSummaryResponse;
import com.gaedet.biocampovet.core.cash.dto.CloseCashBoxRequest;
import com.gaedet.biocampovet.core.cash.dto.OpenCashboxRequest;
import com.gaedet.biocampovet.core.cash.entity.Cashbox;
import com.gaedet.biocampovet.core.cash.enums.CashBoxStatus;
import com.gaedet.biocampovet.core.cash.repository.CashboxRepository;
import com.gaedet.biocampovet.core.users.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import javax.persistence.EntityManager;
import javax.transaction.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class CashboxService {

    private final CashboxRepository cashBoxRepository;
    private final EntityManager entityManager;
    private final CashboxMapper cashBoxMapper;


    @Transactional
    public Long openCashBox(OpenCashboxRequest request, Long userId) {
        boolean isOpen = cashBoxRepository.existsByBranchIdAndStatus(request.getBranchId(), CashBoxStatus.OPEN);
        if (isOpen) {
            throw new IllegalStateException("Ya existe una caja abierta para esta sucursal");
        }

        Branch branchRef = entityManager.getReference(Branch.class, request.getBranchId());
        User userRef = entityManager.getReference(User.class, userId);

        Cashbox cashBox = new Cashbox();
        cashBox.setBranch(branchRef);
        cashBox.setOpenedBy(userRef);
        cashBox.setInitialAmount(request.getInitialAmount());
        cashBox.setOpenedAt(LocalDateTime.now());
        cashBox.setStatus(CashBoxStatus.OPEN);
        cashBox.setTotalIncome(BigDecimal.ZERO);
        cashBox.setTotalExpense(BigDecimal.ZERO);
        cashBox.setPhysicalAmount(BigDecimal.ZERO);

        return cashBoxRepository.save(cashBox).getId();
    }

    public boolean hasOpenCashBox(Long branchId) {
        return cashBoxRepository.existsByBranchIdAndStatus(branchId, CashBoxStatus.OPEN);
    }

    @Transactional
    public Long closeCashBox(CloseCashBoxRequest request, Long userId) {
        Cashbox cashBox = cashBoxRepository.findById(request.getCashboxId())
                .orElseThrow(() -> new IllegalArgumentException("Caja no encontrada"));

        if (cashBox.getStatus() != CashBoxStatus.OPEN) {
            throw new IllegalStateException("La caja ya ha sido cerrada");
        }

        User userRef = entityManager.getReference(User.class, userId);

        cashBox.setClosedBy(userRef);
        cashBox.setClosedAt(LocalDateTime.now());
        cashBox.setPhysicalAmount(request.getPhysicalAmount());
        cashBox.setClosingObservations(request.getClosingObservations());
        cashBox.setStatus(CashBoxStatus.CLOSED);

        return cashBox.getId();
    }

    public CashboxResponse getCurrentOpenCashBox(Long branchId) {
        Cashbox openCashbox = cashBoxRepository
                .findByBranchIdAndStatus(branchId, CashBoxStatus.OPEN)
                .orElseThrow(() -> new NoSuchElementException(
                        "No existe caja abierta para la sucursal con ID: " + branchId));

        return cashBoxMapper.toResponse(openCashbox);
    }

    public CashboxResponse getCashBoxById(Long id) {
        Cashbox cashBox = cashBoxRepository.findDetailedById(id)
                .orElseThrow(() -> new NoSuchElementException("Caja no encontrada con ID: " + id));
        return cashBoxMapper.toResponse(cashBox);
    }

    public PaginatedResponse<CashboxSummaryResponse> getCashBoxSummaries(
            int page,
            int size,
            Long branchId,
            LocalDateTime startDate,
            LocalDateTime endDate
    ) {
        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException("Las fechas de inicio y fin son obligatorias");
        }

        Long safeBranchId = (branchId == null || branchId == 0) ? null : branchId;

        Pageable pageable = PageRequest.of(page, size);

        Page<Object[]> rawPage = cashBoxRepository.findCashBoxSummariesByBranchAndDate(
                safeBranchId,
                startDate,
                endDate,
                pageable
        );

        Page<CashboxSummaryResponse> summaryPage = rawPage.map(CashboxSummaryResponse::fromNativeRow);

        return PaginatedResponse.<CashboxSummaryResponse>builder()
                .content(summaryPage.getContent())
                .totalPages(summaryPage.getTotalPages())
                .totalElements(summaryPage.getTotalElements())
                .currentPage(summaryPage.getNumber())
                .pageSize(summaryPage.getSize())
                .build();
    }
}