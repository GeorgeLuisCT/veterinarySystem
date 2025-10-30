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

import java.util.Collection;
import java.util.List;
import java.util.Optional;


@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Page<Product> findAll(@Nullable Specification<Product> spec, @NonNull Pageable pageable);

    @EntityGraph(attributePaths = {
            "category",
            "saleModes",
            "branchStocks",
            "branchStocks.branch",
            "administrationRoutes"
    })
    List<Product> findAllByIdIn(Collection<Long> ids);

    @Query(value = """
    SELECT
        p.id,
        p.name,
        p.presentation,
        p.sku,
        (
            SELECT psm.price
            FROM product_sale_mode psm
            WHERE psm.product_id = p.id
              AND psm.is_base_mode = TRUE
            ORDER BY psm.id
            LIMIT 1
        ) AS standard_price
    FROM products p
    WHERE (:branchId IS NULL OR EXISTS (
        SELECT 1
        FROM product_branch pb
        WHERE pb.product_id = p.id
          AND pb.branch_id = :branchId
    ))
    AND (:isActive IS NULL OR EXISTS (
        SELECT 1
        FROM product_branch pb2
        WHERE pb2.product_id = p.id
          AND pb2.is_active = :isActive
    ))
    AND (
        :query IS NULL OR
        LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR
        LOWER(p.sku)  LIKE LOWER(CONCAT('%', :query, '%'))
    )
    ORDER BY p.name
    LIMIT 10
    """, nativeQuery = true)
    List<Object[]> quickProductSearch(
            @Param("query") String query,
            @Param("branchId") Long branchId,
            @Param("isActive") Boolean isActive
    );

    @EntityGraph(attributePaths = {
            "category",
            "saleModes",
            "branchStocks",
            "branchStocks.branch",
            "administrationRoutes"
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

}
