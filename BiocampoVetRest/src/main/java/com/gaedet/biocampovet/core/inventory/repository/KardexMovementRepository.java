package com.gaedet.biocampovet.core.inventory.repository;

import com.gaedet.biocampovet.core.inventory.entity.KardexMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Optional;

@Repository
public interface KardexMovementRepository extends JpaRepository<KardexMovement, Long>,
        JpaSpecificationExecutor<KardexMovement> {

    @Query("SELECT SUM(km.quantity) FROM KardexMovement km " +
            "WHERE km.product.id = :productId AND km.branch.id = :branchId")
    Optional<BigDecimal> findCurrentStockByProductAndBranch(
            @Param("productId") Long productId,
            @Param("branchId") Long branchId
    );

    @Query("SELECT SUM(km.quantity) FROM KardexMovement km " +
            "WHERE km.product.id = :productId AND km.branch.id = :branchId AND km.batch.id = :batchId")
    Optional<BigDecimal> findCurrentStockByProductAndBranchAndBatch(
            @Param("productId") Long productId,
            @Param("branchId") Long branchId,
            @Param("batchId") Long batchId
    );
}