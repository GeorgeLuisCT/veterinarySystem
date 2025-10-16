package com.gaedet.biocampovet.core.inventory.repository;

import com.gaedet.biocampovet.core.inventory.entity.ProductSaleMode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Set;

public interface ProductSaleModeRepository extends JpaRepository<ProductSaleMode, Long> {

    @Modifying
    @Query("DELETE FROM ProductSaleMode psm WHERE psm.id NOT IN :updatedIds")
    void deleteSaleModesNotIn(@Param("updatedIds") Set<Long> updatedIds);

    @Modifying
    @Query("DELETE FROM ProductSaleMode psm WHERE psm.product.id = :productId")
    void deleteAllSaleModesByProductId(@Param("productId") Long productId);

}
