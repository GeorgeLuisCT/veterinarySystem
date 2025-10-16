package com.gaedet.biocampovet.core.inventory.repository;

import com.gaedet.biocampovet.core.inventory.entity.InventoryMovement;
import com.gaedet.biocampovet.core.inventory.enums.InventoryMovementType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, Long> {

    @Query("""
        SELECT m FROM InventoryMovement m
        LEFT JOIN FETCH m.sourceBranch
        LEFT JOIN FETCH m.targetBranch
        LEFT JOIN FETCH m.supplier
        LEFT JOIN FETCH m.employee
        LEFT JOIN FETCH m.products p
        LEFT JOIN FETCH p.product prod
        WHERE m.id = :id
    """)
    Optional<InventoryMovement> findDetailedById(@Param("id") Long id);

    @Query(value = """
    SELECT
        m.id,
        m.type,
        sb.name AS source_branch,
        tb.name AS target_branch,
        s.name AS supplier_name,
        m.date,
        COUNT(mp.id) AS product_count,
        COALESCE(SUM(mp.unit_cost * mp.quantity), 0) AS total_cost
    FROM inventory_movement m
    LEFT JOIN suppliers s ON m.supplier_id = s.id
    LEFT JOIN branches sb ON m.branch_id = sb.id
    LEFT JOIN branches tb ON m.target_branch_id = tb.id
    LEFT JOIN inventory_movement_product mp ON m.id = mp.movement_id
    WHERE m.date BETWEEN :startDate AND :endDate
      AND m.type IN (:types)
      AND m.branch_id = :branchId
    GROUP BY m.id, m.type, sb.name, tb.name, s.name, m.date
    ORDER BY m.date DESC
    """,
            countQuery = """
    SELECT COUNT(DISTINCT m.id)
    FROM inventory_movement m
    WHERE m.date BETWEEN :startDate AND :endDate
      AND m.type IN (:types)
      AND m.branch_id = :branchId
    """,
            nativeQuery = true
    )
    Page<Object[]> findMovementSummariesByTypes(
            @Param("branchId") Long branchId,
            @Param("types") List<String> types,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );
}
