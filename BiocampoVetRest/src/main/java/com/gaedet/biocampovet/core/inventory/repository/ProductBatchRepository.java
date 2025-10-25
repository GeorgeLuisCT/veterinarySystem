package com.gaedet.biocampovet.core.inventory.repository;

import com.gaedet.biocampovet.core.inventory.entity.ProductBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductBatchRepository extends JpaRepository<ProductBatch, Long> {


    Optional<ProductBatch> findByProduct_IdAndBatchNumber(Long productId, String batchNumber);

}
