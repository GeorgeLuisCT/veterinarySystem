package com.gaedet.biocampovet.core.inventory.repository;

import com.gaedet.biocampovet.core.inventory.entity.ProductBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductBatchRepository extends JpaRepository<ProductBatch, Long> {

    Optional<ProductBatch> findByProductIdAndBranchIdAndBatchNumber(
            Long productId,
            Long branchId,
            String batchNumber
    );

    @Query("""
        SELECT b FROM ProductBatch b
        WHERE b.product.id = :productId
        AND b.branch.id = :branchId
        AND (b.stockUnits > 0 OR b.stockFractional > 0)
        ORDER BY b.expirationDate ASC NULLS LAST, b.id ASC
    """)
    Optional<ProductBatch> findFirstAvailableBatchByProductIdAndBranchIdOrderByExpirationDateAsc(
            @Param("productId") Long productId,
            @Param("branchId") Long branchId
    );
}
