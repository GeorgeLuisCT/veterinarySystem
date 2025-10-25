package com.gaedet.biocampovet.core.inventory.repository;

import com.gaedet.biocampovet.core.inventory.entity.ProductBranch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import javax.persistence.LockModeType;
import java.util.Optional;

public interface ProductBranchRepository extends JpaRepository<ProductBranch, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<ProductBranch> findByProductIdAndBranchId(Long productId, Long branchId);

}

