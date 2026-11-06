package com.gaedet.veterinarysystem.core.cashbox.repository;

import com.gaedet.veterinarysystem.core.cashbox.entity.CashSession;
import com.gaedet.veterinarysystem.core.cashbox.enums.CashSessionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import javax.persistence.LockModeType;

public interface CashSessionRepository extends JpaRepository<CashSession, Long>, JpaSpecificationExecutor<CashSession> {

    @Override
    @EntityGraph(attributePaths = {"branch", "cashier", "cashier.employee"})
    Page<CashSession> findAll(Specification<CashSession> spec, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM CashSession s WHERE s.id = :id")
    Optional<CashSession> findByIdForUpdate(@Param("id") Long id);

    Optional<CashSession> findFirstByBranchIdAndStatusOrderByOpenedAtDesc(Long branchId, CashSessionStatus status);

    Optional<CashSession> findFirstByBranchIdAndCashierIdAndStatus(Long branchId, Long cashierId, CashSessionStatus status);

    List<CashSession> findByBranchIdAndOpenedAtBetween(Long branchId, LocalDateTime start, LocalDateTime end);
}

