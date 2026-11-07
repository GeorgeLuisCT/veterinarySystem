package com.gaedet.veterinarysystem.core.inventory.repository;

import com.gaedet.veterinarysystem.core.inventory.entity.KardexMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface KardexMovementRepository
        extends JpaRepository<KardexMovement, Long>, JpaSpecificationExecutor<KardexMovement> {

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

    @Query("SELECT km.product.id as productId, SUM(km.quantity) as totalStock " +
            "FROM KardexMovement km " +
            "WHERE km.product.id IN :productIds " +
            "GROUP BY km.product.id")
    List<ProductStockAggregate> findTotalStockByProductIds(@Param("productIds") List<Long> productIds);

    @Query("SELECT km.product.id as productId, SUM(km.quantity) as totalStock " +
            "FROM KardexMovement km " +
            "WHERE km.product.id IN :productIds AND km.branch.id = :branchId " +
            "GROUP BY km.product.id")
    List<ProductStockAggregate> findTotalStockByProductIdsAndBranch(
            @Param("productIds") List<Long> productIds,
            @Param("branchId") Long branchId
    );

    @Query("SELECT km.product.id as productId, km.branch.id as branchId, SUM(km.quantity) as totalStock " +
            "FROM KardexMovement km " +
            "WHERE km.product.id IN :productIds " +
            "GROUP BY km.product.id, km.branch.id")
    List<ProductBranchStockAggregate> findAggregatedBranchStockByProductIds(@Param("productIds") List<Long> productIds);

    @Query("SELECT km.batch.id as batchId, SUM(km.quantity) as totalStock " +
            "FROM KardexMovement km " +
            "WHERE km.product.id = :productId AND km.branch.id = :branchId " +
            "AND km.batch.id IS NOT NULL " +
            "GROUP BY km.batch.id")
    List<ProductBatchStockAggregate> findStockByProductAndBranchGroupedByBatch(
            @Param("productId") Long productId,
            @Param("branchId") Long branchId
    );

    @Query("SELECT SUM(km.quantity) FROM KardexMovement km " +
            "WHERE km.product.id = :productId AND km.branch.id = :branchId AND km.batch.id IS NULL")
    Optional<BigDecimal> findCurrentStockByProductAndBranchWithoutBatch(Long productId, Long branchId);

    @Query("SELECT km FROM KardexMovement km WHERE km.originType IN :originTypes AND km.originId = :originId")
    List<KardexMovement> findByOrigin(@Param("originTypes") java.util.Collection<String> originTypes,
                                      @Param("originId") Long originId);
}
