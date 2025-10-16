package com.gaedet.biocampovet.core.sales.repository;

import com.gaedet.biocampovet.core.sales.dto.SaleProductSummaryResponse;
import com.gaedet.biocampovet.core.sales.entity.SaleProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

public interface SaleProductRepository extends JpaRepository<SaleProduct, Long> {

    @Query("""
    SELECT new com.gaedet.biocampovet.core.sales.dto.SaleProductSummaryResponse(
        sp.id,
        sp.product.id,
        sp.product.name,
        sp.unitType,
        sp.quantityEquivalent,
        sp.price,
        sp.discount,
        sp.subtotal,
        sp.applied
    )
    FROM SaleProduct sp
    WHERE sp.animal.id = :animalId
""")
    List<SaleProductSummaryResponse> findSummaryByAnimalId(@Param("animalId") Long animalId);

}