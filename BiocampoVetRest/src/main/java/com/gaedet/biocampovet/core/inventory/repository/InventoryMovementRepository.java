package com.gaedet.biocampovet.core.inventory.repository;

import com.gaedet.biocampovet.core.inventory.entity.InventoryMovement;
import com.gaedet.biocampovet.core.inventory.enums.InventoryMovementType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, Long>,
        JpaSpecificationExecutor<InventoryMovement> {

    @Query("""
        select distinct im
        from InventoryMovement im
        left join fetch im.products p
        left join fetch p.product prod
        left join fetch p.productBatch pb
        left join fetch im.sourceBranch sb
        left join fetch im.targetBranch tb
        left join fetch im.supplier s
        left join fetch im.employee e
        where im.id = :id
    """)
    Optional<InventoryMovement> findByIdWithDetails(@Param("id") Long id);

}
