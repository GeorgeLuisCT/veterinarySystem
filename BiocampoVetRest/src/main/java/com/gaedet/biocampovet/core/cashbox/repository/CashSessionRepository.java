package com.gaedet.biocampovet.core.cashbox.repository;

import com.gaedet.biocampovet.core.cashbox.entity.CashSession;
import com.gaedet.biocampovet.core.cashbox.enums.CashSessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface CashSessionRepository extends JpaRepository<CashSession, Long>, JpaSpecificationExecutor<CashSession> {

    Optional<CashSession> findFirstByBranchIdAndStatusOrderByOpenedAtDesc(Long branchId, CashSessionStatus status);

    Optional<CashSession> findFirstByBranchIdAndCashierIdAndStatus(Long branchId, Long cashierId, CashSessionStatus status);

    List<CashSession> findByBranchIdAndOpenedAtBetween(Long branchId, LocalDateTime start, LocalDateTime end);
}

