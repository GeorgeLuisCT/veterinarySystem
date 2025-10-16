package com.gaedet.biocampovet.core.inventory.repository;

import com.gaedet.biocampovet.core.inventory.entity.ProductBranchStock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductBranchStockRepository extends JpaRepository<ProductBranchStock, Long> {

    Optional<ProductBranchStock> findByProductIdAndBranchId(Long productId, Long branchId);

}

