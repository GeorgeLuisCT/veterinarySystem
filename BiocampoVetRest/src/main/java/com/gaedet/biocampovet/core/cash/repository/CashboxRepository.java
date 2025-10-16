package com.gaedet.biocampovet.core.cash.repository;

import com.gaedet.biocampovet.core.cash.entity.Cashbox;
import com.gaedet.biocampovet.core.cash.enums.CashBoxStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface CashboxRepository extends JpaRepository<Cashbox, Long> {

    boolean existsByBranchIdAndStatus(Long branchId, CashBoxStatus status);

    @Query("SELECT cb FROM Cashbox cb WHERE cb.id = :id")
    Optional<Cashbox> findDetailedById(@Param("id") Long id);

    @Query("""
        SELECT cb
          FROM Cashbox cb
         WHERE cb.branch.id = :branchId
           AND cb.status = :status
    """)
    Optional<Cashbox> findByBranchIdAndStatus(
            @Param("branchId") Long branchId,
            @Param("status")   CashBoxStatus status
    );

    @Query(value = """
    SELECT 
        cb.id,
        b.name AS branch_name,
        cb.opened_at,
        cb.closed_at,
        CONCAT(e_open.first_name, ' ', e_open.last_name) AS opened_by_full_name,
        CONCAT(e_close.first_name, ' ', e_close.last_name) AS closed_by_full_name,
        cb.status,
        cb.total_income,
        cb.total_expense,
        cb.physical_amount
    FROM cashboxes cb
    JOIN branches b ON cb.branch_id = b.id
    JOIN users u_open ON cb.opened_by_id = u_open.id
    JOIN employees e_open ON u_open.employee_id = e_open.id
    LEFT JOIN users u_close ON cb.closed_by_id = u_close.id
    LEFT JOIN employees e_close ON u_close.employee_id = e_close.id
    WHERE (:branchId IS NULL OR cb.branch_id = :branchId)
      AND cb.opened_at >= :startDate
      AND cb.opened_at <= :endDate
    ORDER BY cb.opened_at DESC
    """,
            countQuery = """
    SELECT COUNT(*)
    FROM cashboxes cb
    JOIN users u_open ON cb.opened_by_id = u_open.id
    JOIN employees e_open ON u_open.employee_id = e_open.id
    LEFT JOIN users u_close ON cb.closed_by_id = u_close.id
    LEFT JOIN employees e_close ON u_close.employee_id = e_close.id
    WHERE (:branchId IS NULL OR cb.branch_id = :branchId)
      AND cb.opened_at >= :startDate
      AND cb.opened_at <= :endDate
    """,
            nativeQuery = true
    )
    Page<Object[]> findCashBoxSummariesByBranchAndDate(
            @Param("branchId") Long branchId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );
}
