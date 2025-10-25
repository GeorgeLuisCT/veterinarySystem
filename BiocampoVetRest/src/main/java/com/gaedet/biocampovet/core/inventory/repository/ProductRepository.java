package com.gaedet.biocampovet.core.inventory.repository;


import com.gaedet.biocampovet.core.inventory.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;


@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    @EntityGraph(
            type = EntityGraph.EntityGraphType.LOAD,
            attributePaths = {
                    "category",
                    "saleModes",
                    "branchStocks",
                    "branchStocks.branch",
                    "administrationRoutes"
            }
    )
    Page<Product> findAll(@Nullable Specification<Product> spec, @NonNull Pageable pageable);

    @Query(value = """
    SELECT
        p.id,
        p.name,
        p.presentation,
        p.sku,
        p.standard_price
    FROM products p
    WHERE (:branchId IS NULL OR EXISTS (
        SELECT 1 FROM product_branch_stock pbs
        WHERE pbs.product_id = p.id AND pbs.branch_id = :branchId
    ))
    AND (:isActive IS NULL OR EXISTS (
        SELECT 1 FROM product_branch_stock pbs2
        WHERE pbs2.product_id = p.id AND pbs2.is_active = :isActive
    ))
    AND (
        :query IS NULL OR
        LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR
        LOWER(p.sku) LIKE LOWER(CONCAT('%', :query, '%'))
    )
    ORDER BY p.name
    LIMIT 10
    """,
            nativeQuery = true)
    List<Object[]> quickProductSearch(
            @Param("query") String query,
            @Param("branchId") Long branchId,
            @Param("isActive") Boolean isActive
    );

    @EntityGraph(attributePaths = {
            "category",
            "saleModes",
            "branchStocks",
            "branchStocks.branch"
    })
    Optional<Product> findWithDetailsById(Long id);

    @EntityGraph(attributePaths = {
            "category",
            "saleModes",
            "branchStocks",
            "branchStocks.branch"
    })
    @Query("SELECT p FROM Product p WHERE p.id IN :ids")
    List<Product> findAllWithDetailsByIdIn(@Param("ids") List<Long> ids);

    boolean existsBySku(String sku);
    boolean existsBySkuAndIdNot(String sku, Long id);

    Optional<Product> findBySku(String sku);
}
