package com.gaedet.biocampovet.core.inventory.repository;

import com.gaedet.biocampovet.core.inventory.entity.ProductBatch;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductBatchRepository extends JpaRepository<ProductBatch, Long> {


    Optional<ProductBatch> findByProduct_IdAndBatchNumber(Long productId, String batchNumber);

    List<ProductBatch> findByProductIdAndBatchNumberContainingIgnoreCase(Long productId, String batchNumber, Pageable pageable);

    List<ProductBatch> findAllByProductIdAndExpirationDateGreaterThanEqualOrderByExpirationDateAsc(
            Long productId,
            LocalDate today
    );
}
