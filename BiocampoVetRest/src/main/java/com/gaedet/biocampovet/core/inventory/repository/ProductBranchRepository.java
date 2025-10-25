package com.gaedet.biocampovet.core.inventory.repository;

import com.gaedet.biocampovet.core.inventory.entity.ProductBranch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProductBranchStockRepository extends JpaRepository<ProductBranch, Long> {

    Optional<ProductBranch> findByProductIdAndBranchId(Long productId, Long branchId);

}

